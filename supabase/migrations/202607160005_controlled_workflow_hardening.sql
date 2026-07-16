-- Enforce controlled-report invariants at the database boundary.

-- management:begin base

drop policy if exists reports_tenant_update on public.reports;
revoke update, delete on public.reports from authenticated, anon;

drop policy if exists reports_tenant_insert on public.reports;
create policy reports_controlled_insert on public.reports for insert to authenticated
with check (
  public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])
  and author_id = auth.uid()
  and status = 'draft'
  and reviewer_id is null
  and approved_at is null
  and approved_by is null
  and locked_at is null
);

-- Review history is append-only and is written by the controlled transition
-- functions below. Ordinary API clients cannot forge or edit decisions.
drop policy if exists report_reviews_tenant_insert on public.report_reviews;
drop policy if exists report_reviews_tenant_update on public.report_reviews;
revoke insert, update, delete on public.report_reviews from authenticated, anon;
-- management:end base

-- management:begin submit
create or replace function public.submit_report_for_review(target_report_id uuid, submission_comment text default '')
returns void language plpgsql security definer set search_path = public
as $$
declare report_record public.reports%rowtype; caller_role public.member_role;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(coalesce(submission_comment, '')) > 4000 then raise exception 'Submission comment is too long'; end if;

  select r.* into report_record
  from reports r
  join organization_members m on m.organization_id = r.organization_id
  where r.id = target_report_id and r.deleted_at is null
    and m.user_id = auth.uid() and m.status = 'active'
  for update of r;

  if report_record.id is null then raise exception 'Report not found'; end if;
  select role into caller_role from organization_members
    where organization_id = report_record.organization_id and user_id = auth.uid() and status = 'active';
  if caller_role not in ('owner','admin','engineer') then raise exception 'Not authorized'; end if;
  if report_record.status not in ('draft','in_progress','changes_requested') then raise exception 'Invalid report state transition'; end if;

  update reports set status = 'ready_for_review', submitted_at = now(), reviewer_id = null
    where id = report_record.id;
  insert into report_reviews(organization_id,report_id,reviewer_id,decision,comment,revision)
    values(report_record.organization_id,report_record.id,auth.uid(),'comment',
      coalesce(nullif(trim(submission_comment),''),'Submitted for review'),report_record.revision);
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary)
    values(report_record.organization_id,auth.uid(),'report_submitted','Report',report_record.id,
      format('Report %s revision %s submitted for review',report_record.number,report_record.revision));
end $$;
-- management:end submit

-- management:begin review
create or replace function public.review_report(target_report_id uuid, review_decision text, review_comment text)
returns void language plpgsql security definer set search_path = public
as $$
declare report_record public.reports%rowtype; caller_role public.member_role; decision_value text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  decision_value := lower(trim(review_decision));
  if decision_value not in ('approved','changes_requested') then raise exception 'Invalid review decision'; end if;
  if char_length(trim(coalesce(review_comment,''))) < 10 or char_length(review_comment) > 4000 then raise exception 'Review comment must contain 10 to 4000 characters'; end if;

  select r.* into report_record
  from reports r
  join organization_members m on m.organization_id = r.organization_id
  where r.id = target_report_id and r.deleted_at is null
    and m.user_id = auth.uid() and m.status = 'active'
  for update of r;

  if report_record.id is null then raise exception 'Report not found'; end if;
  select role into caller_role from organization_members
    where organization_id = report_record.organization_id and user_id = auth.uid() and status = 'active';
  if caller_role not in ('owner','admin','reviewer') then raise exception 'Not authorized'; end if;
  if report_record.status <> 'ready_for_review' then raise exception 'Invalid report state transition'; end if;
  if report_record.author_id = auth.uid() then raise exception 'The report author cannot review their own report'; end if;

  if decision_value = 'approved' then
    update reports set status='approved',reviewer_id=auth.uid(),approved_at=now(),approved_by=auth.uid(),locked_at=now()
      where id=report_record.id;
  else
    update reports set status='changes_requested',reviewer_id=auth.uid(),approved_at=null,approved_by=null,locked_at=null
      where id=report_record.id;
  end if;

  insert into report_reviews(organization_id,report_id,reviewer_id,decision,comment,revision)
    values(report_record.organization_id,report_record.id,auth.uid(),decision_value,trim(review_comment),report_record.revision);
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary)
    values(report_record.organization_id,auth.uid(),'report_' || decision_value,'Report',report_record.id,
      format('Report %s revision %s: %s',report_record.number,report_record.revision,replace(decision_value,'_',' ')));
end $$;
-- management:end review

-- management:begin grants
revoke all on function public.submit_report_for_review(uuid,text) from public, anon;
revoke all on function public.review_report(uuid,text,text) from public, anon;
grant execute on function public.submit_report_for_review(uuid,text) to authenticated;
grant execute on function public.review_report(uuid,text,text) to authenticated;
-- management:end grants

-- Evidence linked to an approved report is part of the controlled revision.
-- management:begin evidence
create or replace function public.prevent_approved_report_attachment_change()
returns trigger language plpgsql set search_path = public
as $$
declare attachment_record public.attachments%rowtype; report_state public.report_status;
begin
  attachment_record := case when tg_op = 'DELETE' then old else new end;
  if attachment_record.record_type = 'report' then
    select status into report_state from reports
      where id = attachment_record.record_id and organization_id = attachment_record.organization_id;
    if report_state = 'approved' then raise exception 'Approved report evidence is immutable'; end if;
  end if;
  if tg_op = 'UPDATE' and old.record_type = 'report' then
    select status into report_state from reports where id = old.record_id and organization_id = old.organization_id;
    if report_state = 'approved' then raise exception 'Approved report evidence is immutable'; end if;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

drop trigger if exists lock_approved_report_attachments on public.attachments;
create trigger lock_approved_report_attachments before insert or update or delete on public.attachments
for each row execute function public.prevent_approved_report_attachment_change();
-- management:end evidence

-- A source file/column can only have one persisted analysis per report.
-- management:begin constraints
do $$ begin
  if not exists(select 1 from pg_constraint where conname='report_dataset_source_unique') then
    alter table public.report_datasets add constraint report_dataset_source_unique unique(report_id,attachment_id,selected_column);
  end if;
end $$;

-- The application currently supports one active workspace per account. Keep
-- invitation acceptance consistent with workspace creation and expose member
-- profile names through an API-visible relationship.
do $$ begin
  if not exists(select 1 from pg_constraint where conname='organization_members_user_profile_fkey') then
    alter table public.organization_members add constraint organization_members_user_profile_fkey
      foreign key (user_id) references public.profiles(id);
  end if;
end $$;
-- management:end constraints

-- management:begin invitation
create or replace function public.accept_invitation(raw_token text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare invite invitations%rowtype; account_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select email into account_email from auth.users where id=auth.uid();
  select * into invite from invitations where token_hash=encode(digest(raw_token,'sha256'),'hex') for update;
  if invite.id is null then raise exception 'Invitation not found'; end if;
  if invite.revoked_at is not null then raise exception 'Invitation revoked'; end if;
  if invite.accepted_at is not null then raise exception 'Invitation already accepted'; end if;
  if invite.expires_at <= now() then raise exception 'Invitation expired'; end if;
  if lower(invite.email) <> lower(account_email) then raise exception 'Invitation email does not match the signed-in account'; end if;
  if exists(select 1 from organization_members where user_id=auth.uid() and status='active') then
    raise exception 'Account already belongs to an active workspace';
  end if;
  insert into organization_members(organization_id,user_id,role,status)
    values(invite.organization_id,auth.uid(),invite.role,'active');
  update invitations set accepted_at=now(),accepted_by=auth.uid() where id=invite.id;
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary)
    values(invite.organization_id,auth.uid(),'invitation_accepted','Invitation',invite.id,'Organization invitation accepted');
  return invite.organization_id;
end $$;
-- management:end invitation
