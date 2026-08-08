-- Support Firebase third-party JWT subjects while preserving existing Supabase users.
-- Identity values are text because Firebase UIDs are not guaranteed to be UUIDs.

drop trigger if exists on_auth_user_created on auth.users;

-- Policies that directly reference identity columns must be removed before
-- PostgreSQL will allow those columns to change from uuid to text.
drop policy if exists notification_owner_select on public.notifications;
drop policy if exists notification_owner_update on public.notifications;
drop policy if exists profile_self_select on public.profiles;
drop policy if exists profile_self_update on public.profiles;
drop policy if exists reports_controlled_insert on public.reports;

do $$
declare constraint_record record;
begin
  for constraint_record in
    select constraint_table.oid::regclass as table_name, constraint_def.conname
    from pg_constraint constraint_def
    join pg_class constraint_table on constraint_table.oid = constraint_def.conrelid
    join pg_namespace constraint_schema on constraint_schema.oid = constraint_table.relnamespace
    where constraint_def.contype = 'f'
      and constraint_def.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
      and constraint_schema.nspname = 'public'
  loop
    execute format('alter table %s drop constraint %I', constraint_record.table_name, constraint_record.conname);
  end loop;
end $$;

alter table public.profiles
  alter column id type text using id::text,
  add column if not exists email text not null default '',
  add column if not exists identity_provider text not null default 'supabase';

update public.profiles p
set email = lower(coalesce(u.email, ''))
from auth.users u
where p.id = u.id::text and p.email = '';

alter table public.organizations alter column created_by type text using created_by::text;
alter table public.organization_members alter column user_id type text using user_id::text;
alter table public.invitations
  alter column invited_by type text using invited_by::text,
  alter column revoked_by type text using revoked_by::text,
  alter column accepted_by type text using accepted_by::text;
alter table public.projects
  alter column owner_id type text using owner_id::text,
  alter column created_by type text using created_by::text;
alter table public.reports
  alter column author_id type text using author_id::text,
  alter column reviewer_id type text using reviewer_id::text,
  alter column approved_by type text using approved_by::text;
alter table public.acceptance_criteria alter column overridden_by type text using overridden_by::text;
alter table public.report_reviews alter column reviewer_id type text using reviewer_id::text;
alter table public.suppliers
  alter column owner_id type text using owner_id::text,
  alter column created_by type text using created_by::text;
alter table public.supplier_documents alter column reviewed_by type text using reviewed_by::text;
alter table public.inspections alter column inspector_id type text using inspector_id::text;
alter table public.issues alter column owner_id type text using owner_id::text;
alter table public.attachments alter column uploaded_by type text using uploaded_by::text;
alter table public.activity_log alter column actor_id type text using actor_id::text;
alter table public.notifications alter column user_id type text using user_id::text;
alter table public.report_datasets alter column created_by type text using created_by::text;
alter table public.report_statistics alter column created_by type text using created_by::text;
alter table public.report_figures alter column created_by type text using created_by::text;
alter table public.supplier_qualifications alter column decided_by type text using decided_by::text;
alter table public.ai_usage alter column user_id type text using user_id::text;

alter table public.organizations add constraint organizations_creator_profile_fkey foreign key (created_by) references public.profiles(id);
alter table public.organization_members add constraint organization_members_user_profile_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.invitations
  add constraint invitations_inviter_profile_fkey foreign key (invited_by) references public.profiles(id),
  add constraint invitations_revoker_profile_fkey foreign key (revoked_by) references public.profiles(id),
  add constraint invitations_acceptor_profile_fkey foreign key (accepted_by) references public.profiles(id);
alter table public.projects
  add constraint projects_owner_profile_fkey foreign key (owner_id) references public.profiles(id),
  add constraint projects_creator_profile_fkey foreign key (created_by) references public.profiles(id);
alter table public.reports
  add constraint reports_author_profile_fkey foreign key (author_id) references public.profiles(id),
  add constraint reports_reviewer_profile_fkey foreign key (reviewer_id) references public.profiles(id),
  add constraint reports_approver_profile_fkey foreign key (approved_by) references public.profiles(id);
alter table public.acceptance_criteria add constraint acceptance_criteria_overrider_profile_fkey foreign key (overridden_by) references public.profiles(id);
alter table public.report_reviews add constraint report_reviews_reviewer_profile_fkey foreign key (reviewer_id) references public.profiles(id);
alter table public.suppliers
  add constraint suppliers_owner_profile_fkey foreign key (owner_id) references public.profiles(id),
  add constraint suppliers_creator_profile_fkey foreign key (created_by) references public.profiles(id);
alter table public.supplier_documents add constraint supplier_documents_reviewer_profile_fkey foreign key (reviewed_by) references public.profiles(id);
alter table public.inspections add constraint inspections_inspector_profile_fkey foreign key (inspector_id) references public.profiles(id);
alter table public.issues add constraint issues_owner_profile_fkey foreign key (owner_id) references public.profiles(id);
alter table public.attachments add constraint attachments_uploader_profile_fkey foreign key (uploaded_by) references public.profiles(id);
alter table public.activity_log add constraint activity_log_actor_profile_fkey foreign key (actor_id) references public.profiles(id);
alter table public.notifications add constraint notifications_user_profile_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.report_datasets add constraint report_datasets_creator_profile_fkey foreign key (created_by) references public.profiles(id);
alter table public.report_statistics add constraint report_statistics_creator_profile_fkey foreign key (created_by) references public.profiles(id);
alter table public.report_figures add constraint report_figures_creator_profile_fkey foreign key (created_by) references public.profiles(id);
alter table public.supplier_qualifications add constraint supplier_qualifications_decider_profile_fkey foreign key (decided_by) references public.profiles(id);
alter table public.ai_usage add constraint ai_usage_user_profile_fkey foreign key (user_id) references public.profiles(id);

create or replace function public.current_user_id()
returns text language sql stable
as $$ select nullif(auth.jwt()->>'sub', '') $$;

create or replace function public.current_user_email()
returns text language sql stable
as $$ select lower(nullif(auth.jwt()->>'email', '')) $$;

create or replace function public.ensure_current_profile()
returns text language plpgsql security definer set search_path = public
as $$
declare caller_id text; caller_email text; caller_name text; provider text;
begin
  caller_id := public.current_user_id();
  caller_email := coalesce(public.current_user_email(), '');
  caller_name := coalesce(nullif(auth.jwt()->>'name', ''), nullif(caller_email, ''), 'User');
  provider := case when auth.jwt()->>'iss' like 'https://securetoken.google.com/%' then 'firebase' else 'supabase' end;
  if caller_id is null then raise exception 'Authentication required'; end if;
  insert into profiles(id, full_name, email, identity_provider)
  values(caller_id, caller_name, caller_email, provider)
  on conflict(id) do update set
    full_name = case when excluded.full_name <> '' then excluded.full_name else profiles.full_name end,
    email = case when excluded.email <> '' then excluded.email else profiles.email end,
    identity_provider = excluded.identity_provider,
    updated_at = now();
  return caller_id;
end $$;

revoke all on function public.ensure_current_profile() from public, anon;
grant execute on function public.ensure_current_profile() to authenticated;

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from organization_members m where m.organization_id = target_org and m.user_id = public.current_user_id() and m.status = 'active') $$;

create or replace function public.has_org_role(target_org uuid, allowed public.member_role[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from organization_members m where m.organization_id = target_org and m.user_id = public.current_user_id() and m.status = 'active' and m.role = any(allowed)) $$;

drop policy if exists notification_owner_select on public.notifications;
drop policy if exists notification_owner_update on public.notifications;
drop policy if exists profile_self_select on public.profiles;
drop policy if exists profile_self_update on public.profiles;
drop policy if exists reports_controlled_insert on public.reports;

create policy notification_owner_select on public.notifications for select using (user_id = public.current_user_id() and public.is_org_member(organization_id));
create policy notification_owner_update on public.notifications for update using (user_id = public.current_user_id() and public.is_org_member(organization_id));
create policy profile_self_select on public.profiles for select using (id = public.current_user_id());
create policy profile_self_update on public.profiles for update using (id = public.current_user_id());
create policy reports_controlled_insert on public.reports for insert to authenticated
with check (
  public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])
  and author_id = public.current_user_id()
  and status = 'draft' and reviewer_id is null and approved_at is null and approved_by is null and locked_at is null
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into profiles(id, full_name, email, identity_provider)
  values(new.id::text, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''), 'supabase')
  on conflict(id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.create_workspace(workspace_name text, workspace_slug text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare new_org uuid; caller_id text;
begin
  caller_id := public.ensure_current_profile();
  if exists(select 1 from organization_members where user_id = caller_id and status = 'active') then raise exception 'User already belongs to an active workspace'; end if;
  insert into organizations(name, slug, created_by) values(workspace_name, workspace_slug, caller_id) returning id into new_org;
  insert into organization_members(organization_id, user_id, role, status) values(new_org, caller_id, 'owner', 'active');
  insert into subscriptions(organization_id, plan, status) values(new_org, 'trial', 'trialing');
  return new_org;
end $$;

create or replace function public.issue_invitation(target_email text, assigned_role public.member_role, ttl_hours integer default 72)
returns table(invitation_id uuid, raw_token text, expires_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare caller_id text; caller_org uuid; caller_role public.member_role; token text; invite_id uuid; expiry timestamptz;
begin
  caller_id := public.ensure_current_profile();
  select organization_id, role into caller_org, caller_role from organization_members where user_id = caller_id and status = 'active' limit 1;
  if caller_org is null or caller_role not in ('owner','admin') then raise exception 'Not authorized'; end if;
  if assigned_role = 'owner' or (caller_role = 'admin' and assigned_role = 'admin') then raise exception 'Role assignment not authorized'; end if;
  if ttl_hours < 1 or ttl_hours > 168 then raise exception 'Invalid invitation lifetime'; end if;
  if exists(select 1 from profiles p join organization_members m on m.user_id=p.id where m.organization_id=caller_org and lower(p.email)=lower(trim(target_email)) and m.status='active') then raise exception 'User is already a member'; end if;
  token := encode(gen_random_bytes(32), 'hex'); expiry := now() + make_interval(hours => ttl_hours);
  insert into invitations(organization_id,email,role,token_hash,invited_by,expires_at,last_sent_at)
  values(caller_org,lower(trim(target_email)),assigned_role,encode(digest(token,'sha256'),'hex'),caller_id,expiry,now())
  on conflict(organization_id,email) do update set role=excluded.role,token_hash=excluded.token_hash,invited_by=excluded.invited_by,expires_at=excluded.expires_at,accepted_at=null,accepted_by=null,revoked_at=null,revoked_by=null,resend_count=invitations.resend_count+1,last_sent_at=now()
  returning id into invite_id;
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary) values(caller_org,caller_id,'invitation_sent','Invitation',invite_id,'Organization invitation issued');
  return query select invite_id, token, expiry;
end $$;

create or replace function public.accept_invitation(raw_token text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare invite invitations%rowtype; account_email text; caller_id text;
begin
  caller_id := public.ensure_current_profile(); account_email := public.current_user_email();
  select * into invite from invitations where token_hash=encode(digest(raw_token,'sha256'),'hex') for update;
  if invite.id is null then raise exception 'Invitation not found'; end if;
  if invite.revoked_at is not null then raise exception 'Invitation revoked'; end if;
  if invite.accepted_at is not null then raise exception 'Invitation already accepted'; end if;
  if invite.expires_at <= now() then raise exception 'Invitation expired'; end if;
  if lower(invite.email) <> lower(account_email) then raise exception 'Invitation email does not match the signed-in account'; end if;
  if exists(select 1 from organization_members where user_id=caller_id and status='active') then raise exception 'Account already belongs to an active workspace'; end if;
  insert into organization_members(organization_id,user_id,role,status) values(invite.organization_id,caller_id,invite.role,'active')
  on conflict(organization_id,user_id) do update set role=excluded.role,status='active';
  update invitations set accepted_at=now(),accepted_by=caller_id where id=invite.id;
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary) values(invite.organization_id,caller_id,'invitation_accepted','Invitation',invite.id,'Organization invitation accepted');
  return invite.organization_id;
end $$;

create or replace function public.submit_report_for_review(target_report_id uuid, submission_comment text default '')
returns void language plpgsql security definer set search_path = public
as $$
declare report_record public.reports%rowtype; caller_role public.member_role; caller_id text;
begin
  caller_id := public.current_user_id(); if caller_id is null then raise exception 'Authentication required'; end if;
  if char_length(coalesce(submission_comment, '')) > 4000 then raise exception 'Submission comment is too long'; end if;
  select r.* into report_record from reports r join organization_members m on m.organization_id=r.organization_id
  where r.id=target_report_id and r.deleted_at is null and m.user_id=caller_id and m.status='active' for update of r;
  if report_record.id is null then raise exception 'Report not found'; end if;
  select role into caller_role from organization_members where organization_id=report_record.organization_id and user_id=caller_id and status='active';
  if caller_role not in ('owner','admin','engineer') then raise exception 'Not authorized'; end if;
  if report_record.status not in ('draft','in_progress','changes_requested') then raise exception 'Invalid report state transition'; end if;
  update reports set status='ready_for_review',submitted_at=now(),reviewer_id=null where id=report_record.id;
  insert into report_reviews(organization_id,report_id,reviewer_id,decision,comment,revision) values(report_record.organization_id,report_record.id,caller_id,'comment',coalesce(nullif(trim(submission_comment),''),'Submitted for review'),report_record.revision);
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary) values(report_record.organization_id,caller_id,'report_submitted','Report',report_record.id,format('Report %s revision %s submitted for review',report_record.number,report_record.revision));
end $$;

create or replace function public.review_report(target_report_id uuid, review_decision text, review_comment text)
returns void language plpgsql security definer set search_path = public
as $$
declare report_record public.reports%rowtype; caller_role public.member_role; decision_value text; caller_id text;
begin
  caller_id := public.current_user_id(); if caller_id is null then raise exception 'Authentication required'; end if;
  decision_value := lower(trim(review_decision));
  if decision_value not in ('approved','changes_requested') then raise exception 'Invalid review decision'; end if;
  if char_length(trim(coalesce(review_comment,''))) < 10 or char_length(review_comment) > 4000 then raise exception 'Review comment must contain 10 to 4000 characters'; end if;
  select r.* into report_record from reports r join organization_members m on m.organization_id=r.organization_id
  where r.id=target_report_id and r.deleted_at is null and m.user_id=caller_id and m.status='active' for update of r;
  if report_record.id is null then raise exception 'Report not found'; end if;
  select role into caller_role from organization_members where organization_id=report_record.organization_id and user_id=caller_id and status='active';
  if caller_role not in ('owner','admin','reviewer') then raise exception 'Not authorized'; end if;
  if report_record.status <> 'ready_for_review' then raise exception 'Invalid report state transition'; end if;
  if report_record.author_id = caller_id then raise exception 'The report author cannot review their own report'; end if;
  if decision_value='approved' then update reports set status='approved',reviewer_id=caller_id,approved_at=now(),approved_by=caller_id,locked_at=now() where id=report_record.id;
  else update reports set status='changes_requested',reviewer_id=caller_id,approved_at=null,approved_by=null,locked_at=null where id=report_record.id; end if;
  insert into report_reviews(organization_id,report_id,reviewer_id,decision,comment,revision) values(report_record.organization_id,report_record.id,caller_id,decision_value,trim(review_comment),report_record.revision);
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary) values(report_record.organization_id,caller_id,'report_'||decision_value,'Report',report_record.id,format('Report %s revision %s: %s',report_record.number,report_record.revision,replace(decision_value,'_',' ')));
end $$;

grant execute on function public.create_workspace(text,text) to authenticated;
grant execute on function public.issue_invitation(text,public.member_role,integer) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.submit_report_for_review(uuid,text) to authenticated;
grant execute on function public.review_report(uuid,text,text) to authenticated;
