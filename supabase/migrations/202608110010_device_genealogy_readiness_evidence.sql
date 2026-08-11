-- Device genealogy, experiment readiness, and immutable evidence packets.

create table public.device_builds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid,
  code text not null,
  name text not null,
  revision text not null default 'A',
  serial_number text not null default '',
  firmware_version text not null default '',
  configuration text not null default '',
  status text not null default 'planned' check (status in ('planned','in_build','available','consumed','quarantined','retired')),
  built_at date,
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  constraint device_builds_project_same_org foreign key (project_id, organization_id) references public.projects(id, organization_id)
);

create table public.device_build_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  build_id uuid not null,
  component_id uuid not null,
  lot_id uuid not null,
  quantity numeric not null default 1 check (quantity > 0),
  reference_designator text not null default '',
  notes text not null default '',
  added_by uuid not null references auth.users(id),
  added_at timestamptz not null default now(),
  unique (build_id, component_id, lot_id, reference_designator),
  constraint device_build_items_build_same_org foreign key (build_id, organization_id) references public.device_builds(id, organization_id) on delete cascade,
  constraint device_build_items_component_same_org foreign key (component_id, organization_id) references public.components(id, organization_id),
  constraint device_build_items_lot_same_org foreign key (lot_id, organization_id) references public.lots(id, organization_id)
);

create table public.experiment_builds (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  experiment_id uuid not null,
  build_id uuid not null,
  linked_by uuid not null references auth.users(id),
  linked_at timestamptz not null default now(),
  primary key (experiment_id, build_id),
  constraint experiment_builds_experiment_same_org foreign key (experiment_id, organization_id) references public.experiments(id, organization_id) on delete cascade,
  constraint experiment_builds_build_same_org foreign key (build_id, organization_id) references public.device_builds(id, organization_id)
);

create table public.experiment_equipment (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  experiment_id uuid not null,
  equipment_id uuid not null,
  linked_by uuid not null references auth.users(id),
  linked_at timestamptz not null default now(),
  primary key (experiment_id, equipment_id),
  constraint experiment_equipment_experiment_same_org foreign key (experiment_id, organization_id) references public.experiments(id, organization_id) on delete cascade,
  constraint experiment_equipment_equipment_same_org foreign key (equipment_id, organization_id) references public.equipment(id, organization_id)
);

create table public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  experiment_id uuid not null,
  status text not null check (status in ('ready','at_risk','blocked')),
  checks jsonb not null check (jsonb_typeof(checks) = 'array'),
  evaluated_by uuid not null references auth.users(id),
  evaluated_at timestamptz not null default now(),
  constraint readiness_snapshots_experiment_same_org foreign key (experiment_id, organization_id) references public.experiments(id, organization_id) on delete cascade
);

create table public.evidence_packets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  experiment_id uuid not null,
  packet_number text not null,
  version integer not null check (version > 0),
  readiness_status text not null check (readiness_status in ('ready','at_risk','blocked')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, packet_number),
  unique (experiment_id, version),
  constraint evidence_packets_experiment_same_org foreign key (experiment_id, organization_id) references public.experiments(id, organization_id) on delete cascade
);

do $$
declare t text;
begin
  foreach t in array array['device_builds','device_build_items','experiment_builds','experiment_equipment','readiness_snapshots','evidence_packets']
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.is_org_member(organization_id))',t,t);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check (public.has_org_role(organization_id,array[''owner'',''admin'',''engineer'']::public.member_role[]))',t,t);
  end loop;
end $$;

create policy device_builds_update on public.device_builds for update to authenticated
  using (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]))
  with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy device_build_items_delete on public.device_build_items for delete to authenticated
  using (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy experiment_builds_delete on public.experiment_builds for delete to authenticated
  using (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy experiment_equipment_delete on public.experiment_equipment for delete to authenticated
  using (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));

revoke update, delete on public.readiness_snapshots from authenticated, anon;
revoke update, delete on public.evidence_packets from authenticated, anon;

create index device_builds_org_status_idx on public.device_builds(organization_id,status,updated_at desc) where deleted_at is null;
create index device_build_items_build_idx on public.device_build_items(build_id,added_at);
create index experiment_builds_build_idx on public.experiment_builds(build_id,experiment_id);
create index experiment_equipment_equipment_idx on public.experiment_equipment(equipment_id,experiment_id);
create index readiness_snapshots_experiment_idx on public.readiness_snapshots(experiment_id,evaluated_at desc);
create index evidence_packets_experiment_idx on public.evidence_packets(experiment_id,version desc);
