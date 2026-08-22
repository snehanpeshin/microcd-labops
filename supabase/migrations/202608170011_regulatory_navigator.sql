-- Regulatory Navigator: decision-support profiles, transparent assessments,
-- evidence requirements/links, and immutable readiness report snapshots.

create table public.regulatory_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  product_name text not null check (char_length(product_name) between 2 and 180),
  intended_use text not null default '',
  intended_user text not null default '',
  target_population text not null default '',
  clinical_environment text not null default '',
  markets text[] not null default array['US']::text[] check (markets <@ array['US','EU']::text[] and cardinality(markets) > 0),
  device_type text not null default 'hardware' check (device_type in ('hardware','software','combination')),
  is_ivd boolean not null default false,
  is_samd boolean not null default false,
  has_ai boolean not null default false,
  is_connected boolean not null default false,
  is_patient_facing boolean not null default false,
  is_diagnostic boolean not null default false,
  is_therapeutic boolean not null default false,
  is_monitoring boolean not null default false,
  drives_clinical_decisions boolean not null default false,
  failure_impact text not null default 'inconvenience' check (failure_impact in ('inconvenience','delay_diagnosis','incorrect_diagnosis','deterioration','serious_injury','death')),
  predicate_availability text not null default 'unknown' check (predicate_availability in ('yes','no','unknown')),
  wizard_step integer not null default 1 check (wizard_step between 1 and 4),
  completed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_id),
  unique (id, organization_id),
  constraint regulatory_profiles_project_same_org foreign key (project_id, organization_id) references public.projects(id, organization_id)
);

create table public.regulatory_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null,
  jurisdiction text not null check (jurisdiction in ('US','EU')),
  possible_device_status text not null,
  possible_classification text not null,
  possible_pathway text not null,
  confidence text not null default 'preliminary' check (confidence in ('preliminary','insufficient_information')),
  rule_id text not null,
  rule_version text not null,
  evaluated_inputs jsonb not null check (jsonb_typeof(evaluated_inputs) = 'object'),
  reasoning jsonb not null check (jsonb_typeof(reasoning) = 'array'),
  assumptions jsonb not null check (jsonb_typeof(assumptions) = 'array'),
  confirmations jsonb not null check (jsonb_typeof(confirmations) = 'array'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id, organization_id),
  constraint regulatory_assessments_profile_same_org foreign key (profile_id, organization_id) references public.regulatory_profiles(id, organization_id)
);

create table public.regulatory_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null,
  generated_by_assessment_id uuid,
  category text not null,
  title text not null,
  description text not null,
  status text not null default 'missing' check (status in ('not_assessed','missing','partial','evidence_linked','needs_review')),
  rationale text not null,
  jurisdiction text not null default 'US' check (jurisdiction in ('US','EU','Generic')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  minimum_evidence_count integer not null default 1 check (minimum_evidence_count between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, category),
  unique (id, organization_id),
  constraint regulatory_requirements_profile_same_org foreign key (profile_id, organization_id) references public.regulatory_profiles(id, organization_id),
  constraint regulatory_requirements_assessment_same_org foreign key (generated_by_assessment_id, organization_id) references public.regulatory_assessments(id, organization_id)
);

create table public.regulatory_evidence_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requirement_id uuid not null,
  evidence_type text not null check (evidence_type in ('project','experiment','report','evidence_packet','protocol','file')),
  evidence_id uuid not null,
  evidence_label text not null,
  evidence_href text not null check (evidence_href like '/app/%'),
  notes text not null default '',
  linked_by uuid not null references auth.users(id),
  linked_at timestamptz not null default now(),
  unique (requirement_id, evidence_type, evidence_id),
  constraint regulatory_evidence_requirement_same_org foreign key (requirement_id, organization_id) references public.regulatory_requirements(id, organization_id) on delete cascade
);

create table public.regulatory_readiness_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null,
  assessment_id uuid not null,
  report_number text not null,
  version integer not null check (version > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, report_number, version),
  unique (profile_id, version),
  constraint regulatory_reports_profile_same_org foreign key (profile_id, organization_id) references public.regulatory_profiles(id, organization_id),
  constraint regulatory_reports_assessment_same_org foreign key (assessment_id, organization_id) references public.regulatory_assessments(id, organization_id)
);

do $$
declare t text;
begin
  foreach t in array array['regulatory_profiles','regulatory_assessments','regulatory_requirements','regulatory_evidence_links','regulatory_readiness_reports']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.is_org_member(organization_id))', t, t);
  end loop;
end $$;

create policy regulatory_profiles_insert on public.regulatory_profiles for insert to authenticated
  with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy regulatory_profiles_update on public.regulatory_profiles for update to authenticated
  using (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]))
  with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));

create policy regulatory_assessments_insert on public.regulatory_assessments for insert to authenticated
  with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy regulatory_requirements_insert on public.regulatory_requirements for insert to authenticated
  with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy regulatory_requirements_update on public.regulatory_requirements for update to authenticated
  using (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]))
  with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));

create policy regulatory_evidence_links_insert on public.regulatory_evidence_links for insert to authenticated
  with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy regulatory_evidence_links_delete on public.regulatory_evidence_links for delete to authenticated
  using (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy regulatory_readiness_reports_insert on public.regulatory_readiness_reports for insert to authenticated
  with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));

revoke update, delete on public.regulatory_assessments from authenticated, anon;
revoke delete on public.regulatory_profiles, public.regulatory_requirements from authenticated, anon;
revoke update, delete on public.regulatory_readiness_reports from authenticated, anon;

create index regulatory_profiles_org_idx on public.regulatory_profiles(organization_id, updated_at desc);
create index regulatory_assessments_profile_idx on public.regulatory_assessments(profile_id, created_at desc);
create index regulatory_requirements_profile_idx on public.regulatory_requirements(profile_id, priority, status);
create index regulatory_evidence_requirement_idx on public.regulatory_evidence_links(requirement_id, linked_at desc);
create index regulatory_reports_profile_idx on public.regulatory_readiness_reports(profile_id, version desc);
