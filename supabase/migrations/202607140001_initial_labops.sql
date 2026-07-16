-- MicroCD LabOps initial schema. Run in a new Supabase project.
-- Every tenant-owned table carries organization_id and is protected by RLS.

create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','admin','engineer','reviewer','viewer');
create type public.member_status as enum ('invited','active','suspended');
create type public.report_status as enum ('draft','in_progress','ready_for_review','changes_requested','approved','archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.member_role not null,
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from organization_members m where m.organization_id = target_org and m.user_id = auth.uid() and m.status = 'active') $$;

create or replace function public.has_org_role(target_org uuid, allowed public.member_role[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from organization_members m where m.organization_id = target_org and m.user_id = auth.uid() and m.status = 'active' and m.role = any(allowed)) $$;

create table public.projects (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null, name text not null, product text not null default '', description text not null default '',
  status text not null default 'planning' check (status in ('planning','active','on_hold','complete')),
  owner_id uuid references auth.users(id), target_date date, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null, number text not null, title text not null, report_type text not null,
  revision text not null default 'A', status public.report_status not null default 'draft', confidentiality text not null default 'Internal',
  author_id uuid not null references auth.users(id), reviewer_id uuid references auth.users(id),
  submitted_at timestamptz, approved_at timestamptz, approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, number, revision)
);

create table public.report_sections (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade, title text not null, content text not null default '', sort_order integer not null,
  source text not null default 'user' check (source in ('user','ai_assisted')), ai_metadata jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(report_id, sort_order)
);

create table public.acceptance_criteria (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade, measurement text not null,
  operator text not null check (operator in ('between','>=','<=','=')), minimum numeric, maximum numeric, target numeric, unit text not null default '',
  result numeric, outcome text not null default 'not_evaluated' check(outcome in ('pass','fail','not_evaluated')),
  override_outcome text check(override_outcome in ('pass','fail')), override_reason text, overridden_by uuid references auth.users(id), overridden_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (override_outcome is null or (char_length(coalesce(override_reason,'')) >= 10 and overridden_by is not null))
);

create table public.report_reviews (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade, reviewer_id uuid not null references auth.users(id),
  decision text not null check(decision in ('comment','changes_requested','approved')), comment text not null default '', revision text not null,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null, name text not null, supplier_type text not null default '', country text not null default '', website text,
  risk text not null default 'medium' check(risk in ('low','medium','high')), status text not null default 'prospective' check(status in ('prospective','under_evaluation','conditionally_approved','approved','on_hold','disqualified','inactive')),
  owner_id uuid references auth.users(id), next_review date, notes text not null default '', created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id, code)
);

create table public.supplier_documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade, document_type text not null, title text not null,
  storage_path text not null, issued_at date, expires_at date, review_status text not null default 'pending' check(review_status in ('pending','accepted','rejected','expired')),
  reviewed_by uuid references auth.users(id), reviewed_at timestamptz, created_at timestamptz not null default now()
);

create table public.components (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  part_number text not null, name text not null, category text not null default '', material text not null default '', revision text not null default 'A',
  risk text not null default 'medium' check(risk in ('low','medium','high')), status text not null default 'active' check(status in ('active','obsolete')),
  specification_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id, part_number, revision)
);

create table public.supplier_components (
  organization_id uuid not null references public.organizations(id) on delete cascade, supplier_id uuid not null references public.suppliers(id) on delete cascade,
  component_id uuid not null references public.components(id) on delete cascade, supplier_part_number text not null default '', approved boolean not null default false,
  created_at timestamptz not null default now(), primary key(supplier_id, component_id)
);

create table public.lots (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  internal_lot text not null, supplier_lot text not null default '', component_id uuid not null references public.components(id), supplier_id uuid not null references public.suppliers(id),
  quantity numeric not null check(quantity > 0), unit text not null default 'each', received_at date not null, manufactured_at date, expires_at date,
  inspection_status text not null default 'pending' check(inspection_status in ('pending','passed','failed','conditional')),
  disposition text not null default 'quarantine', certificate_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id, internal_lot)
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id), shipment_number text not null, carrier text, tracking_number text,
  shipped_at date, received_at date, condition_notes text not null default '', created_at timestamptz not null default now(), unique(organization_id, shipment_number)
);

create table public.shipment_lots (
  organization_id uuid not null references public.organizations(id) on delete cascade, shipment_id uuid not null references public.shipments(id) on delete cascade,
  lot_id uuid not null references public.lots(id) on delete cascade, primary key(shipment_id, lot_id)
);

create table public.inspections (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  inspection_number text not null, lot_id uuid not null references public.lots(id), component_id uuid not null references public.components(id),
  inspector_id uuid not null references auth.users(id), inspected_at date not null, sample_size integer not null check(sample_size > 0),
  outcome text not null check(outcome in ('passed','failed','conditional')), disposition text not null, defects text not null default '', report_id uuid references public.reports(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id, inspection_number)
);

create table public.issues (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id), supplier_id uuid references public.suppliers(id), lot_id uuid references public.lots(id), inspection_id uuid references public.inspections(id),
  number text not null, title text not null, description text not null, severity text not null check(severity in ('low','medium','high','critical')),
  status text not null default 'open' check(status in ('open','investigating','resolved','closed')), owner_id uuid references auth.users(id), due_at date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id, number)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  record_type text not null, record_id uuid not null, file_name text not null, storage_path text not null, mime_type text not null, size_bytes bigint not null check(size_bytes >= 0),
  checksum_sha256 text, uploaded_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);

create table public.activity_log (
  id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id), action text not null, record_type text not null, record_id uuid, summary text not null,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, title text not null, body text not null, link text, read_at timestamptz, created_at timestamptz not null default now()
);

create table public.subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade, stripe_customer_id text unique, stripe_subscription_id text unique,
  plan text not null default 'trial', status text not null default 'trialing', current_period_end timestamptz, updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(), name text not null, email text not null, organization_name text not null default '', message text not null default '',
  source text not null default 'website', created_at timestamptz not null default now()
);

-- Tenant policies. Server-side role checks remain required for business actions.
do $$
declare t text;
begin
  foreach t in array array['organizations','organization_members','invitations','projects','reports','report_sections','acceptance_criteria','report_reviews','suppliers','supplier_documents','components','supplier_components','lots','shipments','shipment_lots','inspections','issues','attachments','activity_log','notifications','subscriptions']
  loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

create policy org_select on public.organizations for select using (public.is_org_member(id));
create policy org_update on public.organizations for update using (public.has_org_role(id, array['owner','admin']::public.member_role[]));
create policy member_select on public.organization_members for select using (public.is_org_member(organization_id));
create policy member_manage on public.organization_members for all using (public.has_org_role(organization_id, array['owner','admin']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));

do $$
declare t text;
begin
  foreach t in array array['invitations','projects','reports','report_sections','acceptance_criteria','report_reviews','suppliers','supplier_documents','components','supplier_components','lots','shipments','shipment_lots','inspections','issues','attachments','activity_log','subscriptions']
  loop
    execute format('create policy %I_tenant_select on public.%I for select using (public.is_org_member(organization_id))', t, t);
    execute format('create policy %I_tenant_insert on public.%I for insert with check (public.has_org_role(organization_id, array[''owner'',''admin'',''engineer'']::public.member_role[]))', t, t);
    execute format('create policy %I_tenant_update on public.%I for update using (public.has_org_role(organization_id, array[''owner'',''admin'',''engineer'']::public.member_role[])) with check (public.has_org_role(organization_id, array[''owner'',''admin'',''engineer'']::public.member_role[]))', t, t);
  end loop;
end $$;

create policy notification_owner_select on public.notifications for select using (user_id = auth.uid() and public.is_org_member(organization_id));
create policy notification_owner_update on public.notifications for update using (user_id = auth.uid() and public.is_org_member(organization_id));
alter table public.profiles enable row level security;
create policy profile_self_select on public.profiles for select using (id = auth.uid());
create policy profile_self_update on public.profiles for update using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into profiles(id, full_name) values(new.id, coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.create_workspace(workspace_name text, workspace_slug text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare new_org uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists(select 1 from organization_members where user_id = auth.uid() and status = 'active') then raise exception 'User already belongs to an active workspace'; end if;
  insert into organizations(name, slug, created_by) values(workspace_name, workspace_slug, auth.uid()) returning id into new_org;
  insert into organization_members(organization_id, user_id, role, status) values(new_org, auth.uid(), 'owner', 'active');
  insert into subscriptions(organization_id, plan, status) values(new_org, 'trial', 'trialing');
  return new_org;
end $$;
grant execute on function public.create_workspace(text,text) to authenticated;

-- Storage objects use paths formatted as organization_id/record_type/uuid/filename.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('labops-files','labops-files',false,52428800,array['application/pdf','text/csv','image/png','image/jpeg','image/tiff','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;
create policy storage_member_read on storage.objects for select using (bucket_id = 'labops-files' and public.is_org_member((storage.foldername(name))[1]::uuid));
create policy storage_engineer_write on storage.objects for insert with check (bucket_id = 'labops-files' and public.has_org_role((storage.foldername(name))[1]::uuid, array['owner','admin','engineer']::public.member_role[]));

create index projects_org_idx on public.projects(organization_id, updated_at desc);
create index reports_org_idx on public.reports(organization_id, updated_at desc);
create index suppliers_org_idx on public.suppliers(organization_id, status);
create index lots_trace_idx on public.lots(organization_id, component_id, supplier_id);
create index inspections_lot_idx on public.inspections(organization_id, lot_id);
create index activity_org_idx on public.activity_log(organization_id, created_at desc);

revoke all on public.leads from anon, authenticated;
