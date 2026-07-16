-- Production-readiness hardening for the private beta.
-- Apply after 202607140001_initial_labops.sql.

alter table public.organizations
  add column if not exists ai_enabled boolean not null default false,
  add column if not exists ai_monthly_limit integer not null default 0 check (ai_monthly_limit >= 0),
  add column if not exists storage_limit_bytes bigint not null default 1073741824 check (storage_limit_bytes > 0),
  add column if not exists deleted_at timestamptz;

alter table public.invitations
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references auth.users(id),
  add column if not exists accepted_by uuid references auth.users(id),
  add column if not exists resend_count integer not null default 0,
  add column if not exists last_sent_at timestamptz not null default now();

alter table public.reports
  add column if not exists change_summary text not null default '',
  add column if not exists parent_report_id uuid references public.reports(id),
  add column if not exists pdf_snapshot_path text,
  add column if not exists locked_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.suppliers add column if not exists deleted_at timestamptz;
alter table public.components add column if not exists deleted_at timestamptz;
alter table public.lots add column if not exists deleted_at timestamptz;
alter table public.projects add column if not exists deleted_at timestamptz;

create table public.report_datasets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete restrict,
  original_name text not null,
  selected_column text,
  row_count integer check (row_count >= 0),
  mapping jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.report_statistics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  dataset_id uuid not null references public.report_datasets(id) on delete cascade,
  measurement text not null,
  statistic_name text not null,
  statistic_value numeric not null,
  unit text not null default '',
  calculation_version text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(dataset_id, measurement, statistic_name, calculation_version)
);

create table public.report_figures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete restrict,
  title text not null,
  caption text not null default '',
  sort_order integer not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(report_id, sort_order)
);

create table public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  name text not null,
  title text not null default '',
  email text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_qualifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  decision text not null check(decision in ('pending','approved','conditionally_approved','rejected')),
  rationale text not null default '',
  conditions text not null default '',
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  next_review date,
  created_at timestamptz not null default now()
);

create table public.inspection_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  characteristic text not null,
  result numeric,
  text_result text,
  unit text not null default '',
  lower_limit numeric,
  upper_limit numeric,
  outcome text not null check(outcome in ('pass','fail','not_evaluated')),
  created_at timestamptz not null default now(),
  check (result is not null or text_result is not null)
);

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  organization_id uuid references public.organizations(id) on delete set null,
  status text not null check(status in ('processing','processed','failed')),
  error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  report_id uuid references public.reports(id) on delete set null,
  prompt_version text not null,
  model text not null,
  input_tokens integer not null check(input_tokens >= 0),
  output_tokens integer not null check(output_tokens >= 0),
  estimated_cost_usd numeric(12,6) not null default 0 check(estimated_cost_usd >= 0),
  created_at timestamptz not null default now()
);

create table public.rate_limit_counters (
  key_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  primary key(key_hash, action, window_started_at)
);

create table public.operational_events (
  id bigint generated always as identity primary key,
  correlation_id uuid not null,
  organization_id uuid references public.organizations(id) on delete set null,
  category text not null,
  severity text not null check(severity in ('info','warning','error')),
  code text not null,
  safe_message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add composite uniqueness and foreign keys so a child cannot reference a
-- record from another organization, even if an application query is wrong.
alter table public.projects add constraint projects_id_org_unique unique(id, organization_id);
alter table public.reports add constraint reports_id_org_unique unique(id, organization_id);
alter table public.suppliers add constraint suppliers_id_org_unique unique(id, organization_id);
alter table public.components add constraint components_id_org_unique unique(id, organization_id);
alter table public.lots add constraint lots_id_org_unique unique(id, organization_id);
alter table public.inspections add constraint inspections_id_org_unique unique(id, organization_id);
alter table public.attachments add constraint attachments_id_org_unique unique(id, organization_id);
alter table public.report_datasets add constraint report_datasets_id_org_unique unique(id, organization_id);

alter table public.reports add constraint reports_project_same_org foreign key(project_id, organization_id) references public.projects(id, organization_id);
alter table public.report_sections add constraint sections_report_same_org foreign key(report_id, organization_id) references public.reports(id, organization_id);
alter table public.acceptance_criteria add constraint criteria_report_same_org foreign key(report_id, organization_id) references public.reports(id, organization_id);
alter table public.report_reviews add constraint reviews_report_same_org foreign key(report_id, organization_id) references public.reports(id, organization_id);
alter table public.supplier_documents add constraint supplier_documents_same_org foreign key(supplier_id, organization_id) references public.suppliers(id, organization_id);
alter table public.supplier_components add constraint supplier_components_supplier_same_org foreign key(supplier_id, organization_id) references public.suppliers(id, organization_id);
alter table public.supplier_components add constraint supplier_components_component_same_org foreign key(component_id, organization_id) references public.components(id, organization_id);
alter table public.lots add constraint lots_supplier_same_org foreign key(supplier_id, organization_id) references public.suppliers(id, organization_id);
alter table public.lots add constraint lots_component_same_org foreign key(component_id, organization_id) references public.components(id, organization_id);
alter table public.inspections add constraint inspections_lot_same_org foreign key(lot_id, organization_id) references public.lots(id, organization_id);
alter table public.inspections add constraint inspections_component_same_org foreign key(component_id, organization_id) references public.components(id, organization_id);
alter table public.report_datasets add constraint datasets_report_same_org foreign key(report_id, organization_id) references public.reports(id, organization_id);
alter table public.report_datasets add constraint datasets_attachment_same_org foreign key(attachment_id, organization_id) references public.attachments(id, organization_id);
alter table public.report_statistics add constraint statistics_report_same_org foreign key(report_id, organization_id) references public.reports(id, organization_id);
alter table public.report_statistics add constraint statistics_dataset_same_org foreign key(dataset_id, organization_id) references public.report_datasets(id, organization_id);
alter table public.report_figures add constraint figures_report_same_org foreign key(report_id, organization_id) references public.reports(id, organization_id);
alter table public.report_figures add constraint figures_attachment_same_org foreign key(attachment_id, organization_id) references public.attachments(id, organization_id);
alter table public.supplier_contacts add constraint contacts_supplier_same_org foreign key(supplier_id, organization_id) references public.suppliers(id, organization_id);
alter table public.supplier_qualifications add constraint qualifications_supplier_same_org foreign key(supplier_id, organization_id) references public.suppliers(id, organization_id);
alter table public.inspection_results add constraint results_inspection_same_org foreign key(inspection_id, organization_id) references public.inspections(id, organization_id);

-- New tenant tables use the same membership boundary.
do $$
declare t text;
begin
  foreach t in array array['report_datasets','report_statistics','report_figures','supplier_contacts','supplier_qualifications','inspection_results','ai_usage']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_select on public.%I for select using (public.is_org_member(organization_id))', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (public.has_org_role(organization_id, array[''owner'',''admin'',''engineer'']::public.member_role[]))', t, t);
    execute format('create policy %I_update on public.%I for update using (public.has_org_role(organization_id, array[''owner'',''admin'',''engineer'']::public.member_role[])) with check (public.has_org_role(organization_id, array[''owner'',''admin'',''engineer'']::public.member_role[]))', t, t);
  end loop;
end $$;

alter table public.stripe_events enable row level security;
alter table public.rate_limit_counters enable row level security;
alter table public.operational_events enable row level security;

-- Audit entries and provider events are server-generated and append-only.
drop policy if exists activity_log_tenant_insert on public.activity_log;
drop policy if exists activity_log_tenant_update on public.activity_log;
revoke insert, update, delete on public.activity_log from authenticated, anon;
revoke all on public.stripe_events, public.rate_limit_counters, public.operational_events from authenticated, anon;

-- Approved reports are immutable to ordinary update queries.
drop policy if exists reports_tenant_update on public.reports;
create policy reports_tenant_update on public.reports for update
using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]) and status <> 'approved')
with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]) and status <> 'approved');

-- Restrict direct invitation writes. The lifecycle is exposed through audited RPCs.
drop policy if exists invitations_tenant_insert on public.invitations;
drop policy if exists invitations_tenant_update on public.invitations;
revoke insert, update, delete on public.invitations from authenticated, anon;

create or replace function public.issue_invitation(target_email text, assigned_role public.member_role, ttl_hours integer default 72)
returns table(invitation_id uuid, raw_token text, expires_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare caller_org uuid; caller_role public.member_role; token text; invite_id uuid; expiry timestamptz;
begin
  select organization_id, role into caller_org, caller_role from organization_members where user_id = auth.uid() and status = 'active' limit 1;
  if caller_org is null or caller_role not in ('owner','admin') then raise exception 'Not authorized'; end if;
  if assigned_role = 'owner' or (caller_role = 'admin' and assigned_role = 'admin') then raise exception 'Role assignment not authorized'; end if;
  if ttl_hours < 1 or ttl_hours > 168 then raise exception 'Invalid invitation lifetime'; end if;
  if exists(select 1 from auth.users u join organization_members m on m.user_id=u.id where m.organization_id=caller_org and lower(u.email)=lower(trim(target_email)) and m.status='active') then raise exception 'User is already a member'; end if;
  token := encode(gen_random_bytes(32), 'hex'); expiry := now() + make_interval(hours => ttl_hours);
  insert into invitations(organization_id,email,role,token_hash,invited_by,expires_at,last_sent_at)
  values(caller_org,lower(trim(target_email)),assigned_role,encode(digest(token,'sha256'),'hex'),auth.uid(),expiry,now())
  on conflict(organization_id,email) do update set role=excluded.role, token_hash=excluded.token_hash, invited_by=excluded.invited_by, expires_at=excluded.expires_at, accepted_at=null, accepted_by=null, revoked_at=null, revoked_by=null, resend_count=invitations.resend_count+1, last_sent_at=now()
  returning id into invite_id;
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary) values(caller_org,auth.uid(),'invitation_sent','Invitation',invite_id,'Organization invitation issued');
  return query select invite_id, token, expiry;
end $$;

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
  if exists(select 1 from organization_members where organization_id=invite.organization_id and user_id=auth.uid() and status='active') then raise exception 'User is already a member'; end if;
  insert into organization_members(organization_id,user_id,role,status) values(invite.organization_id,auth.uid(),invite.role,'active')
  on conflict(organization_id,user_id) do update set role=excluded.role,status='active';
  update invitations set accepted_at=now(),accepted_by=auth.uid() where id=invite.id;
  insert into activity_log(organization_id,actor_id,action,record_type,record_id,summary) values(invite.organization_id,auth.uid(),'invitation_accepted','Invitation',invite.id,'Organization invitation accepted');
  return invite.organization_id;
end $$;

grant execute on function public.issue_invitation(text,public.member_role,integer) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

create or replace function public.consume_rate_limit(counter_key text, action_name text, window_seconds integer, maximum integer)
returns boolean language plpgsql security definer set search_path = public
as $$
declare bucket timestamptz; current_count integer;
begin
  if window_seconds < 1 or maximum < 1 then return false; end if;
  bucket := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);
  insert into rate_limit_counters(key_hash,action,window_started_at,request_count)
  values(encode(digest(counter_key,'sha256'),'hex'),action_name,bucket,1)
  on conflict(key_hash,action,window_started_at) do update set request_count=rate_limit_counters.request_count+1
  returning request_count into current_count;
  return current_count <= maximum;
end $$;
revoke all on function public.consume_rate_limit(text,text,integer,integer) from public, anon, authenticated;

create policy storage_admin_delete on storage.objects for delete
using (bucket_id='labops-files' and public.has_org_role((storage.foldername(name))[1]::uuid,array['owner','admin']::public.member_role[]));

create index invitation_token_idx on public.invitations(token_hash);
create index report_dataset_report_idx on public.report_datasets(organization_id,report_id);
create index ai_usage_month_idx on public.ai_usage(organization_id,created_at);
create index operational_event_time_idx on public.operational_events(created_at desc);
