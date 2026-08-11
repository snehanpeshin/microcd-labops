-- Laboratory operations expansion: experiments, samples, inventory, equipment,
-- protocols, and tasks. All records remain organization-scoped and RLS protected.

alter table public.projects
  add column if not exists priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  add column if not exists start_date date;

create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text not null default '',
  owner_id uuid references auth.users(id),
  status text not null default 'draft' check (status in ('draft','active','retired')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, code),
  unique (id, organization_id)
);

create table public.protocol_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  protocol_id uuid not null,
  version integer not null check (version > 0),
  title text not null,
  steps text not null default '',
  materials text not null default '',
  equipment text not null default '',
  notes text not null default '',
  status text not null default 'draft' check (status in ('draft','approved','superseded')),
  authored_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (protocol_id, version),
  unique (id, organization_id),
  constraint protocol_versions_same_org foreign key (protocol_id, organization_id) references public.protocols(id, organization_id)
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null default '',
  manufacturer text not null default '',
  model text not null default '',
  serial_number text not null default '',
  location text not null default '',
  status text not null default 'available' check (status in ('available','in_use','maintenance','calibration_required','out_of_service','retired')),
  owner_id uuid references auth.users(id),
  last_maintenance date,
  next_maintenance date,
  last_calibration date,
  next_calibration date,
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, code),
  unique (id, organization_id)
);

create table public.equipment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  equipment_id uuid not null,
  event_type text not null check (event_type in ('maintenance','calibration','status_change','inspection','note')),
  performed_at timestamptz not null default now(),
  performed_by uuid not null references auth.users(id),
  previous_status text,
  new_status text,
  summary text not null,
  next_due_date date,
  created_at timestamptz not null default now(),
  constraint equipment_events_same_org foreign key (equipment_id, organization_id) references public.equipment(id, organization_id)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  item_type text not null default 'reagent' check (item_type in ('reagent','chemical','consumable','kit','disposable')),
  manufacturer text not null default '',
  catalog_number text not null default '',
  lot_number text not null default '',
  quantity numeric not null default 0 check (quantity >= 0),
  unit text not null default 'each',
  minimum_stock numeric not null default 0 check (minimum_stock >= 0),
  storage_location text not null default '',
  received_date date,
  opened_date date,
  expiration_date date,
  owner_id uuid references auth.users(id),
  supplier_id uuid,
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  constraint inventory_supplier_same_org foreign key (supplier_id, organization_id) references public.suppliers(id, organization_id)
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_item_id uuid not null,
  transaction_type text not null check (transaction_type in ('receipt','use','adjustment','disposal','transfer')),
  quantity_delta numeric not null check (quantity_delta <> 0),
  resulting_quantity numeric not null check (resulting_quantity >= 0),
  reason text not null check (char_length(reason) between 3 and 1000),
  experiment_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint inventory_transactions_same_org foreign key (inventory_item_id, organization_id) references public.inventory_items(id, organization_id)
);

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  title text not null,
  project_id uuid,
  objective text not null default '',
  owner_id uuid references auth.users(id),
  experiment_type text not null default '',
  protocol_version_id uuid,
  start_date date,
  completion_date date,
  status text not null default 'draft' check (status in ('draft','planned','ready','running','paused','completed','failed','cancelled','under_review','approved')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  notes text not null default '',
  results text not null default '',
  observations text not null default '',
  conclusions text not null default '',
  tags text[] not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  constraint experiments_project_same_org foreign key (project_id, organization_id) references public.projects(id, organization_id),
  constraint experiments_protocol_version_same_org foreign key (protocol_version_id, organization_id) references public.protocol_versions(id, organization_id)
);

alter table public.inventory_transactions
  add constraint inventory_transactions_experiment_same_org foreign key (experiment_id, organization_id) references public.experiments(id, organization_id);

create table public.experiment_collaborators (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  experiment_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (experiment_id, user_id),
  constraint experiment_collaborators_same_org foreign key (experiment_id, organization_id) references public.experiments(id, organization_id)
);

create table public.samples (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  sample_type text not null default '',
  source text not null default '',
  project_id uuid,
  experiment_id uuid,
  parent_sample_id uuid,
  preparation_date date,
  owner_id uuid references auth.users(id),
  quantity numeric check (quantity is null or quantity >= 0),
  concentration numeric check (concentration is null or concentration >= 0),
  unit text not null default '',
  storage_location text not null default '',
  freezer text not null default '',
  rack text not null default '',
  box text not null default '',
  position text not null default '',
  status text not null default 'available' check (status in ('available','reserved','in_use','consumed','disposed','expired')),
  notes text not null default '',
  expiration_date date,
  barcode text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, code),
  unique (organization_id, barcode),
  unique (id, organization_id),
  constraint samples_project_same_org foreign key (project_id, organization_id) references public.projects(id, organization_id),
  constraint samples_experiment_same_org foreign key (experiment_id, organization_id) references public.experiments(id, organization_id),
  constraint samples_parent_same_org foreign key (parent_sample_id, organization_id) references public.samples(id, organization_id)
);

create table public.lab_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  assigned_to uuid references auth.users(id),
  experiment_id uuid,
  project_id uuid,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'to_do' check (status in ('to_do','in_progress','blocked','completed')),
  notes text not null default '',
  completed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, organization_id),
  constraint lab_tasks_experiment_same_org foreign key (experiment_id, organization_id) references public.experiments(id, organization_id),
  constraint lab_tasks_project_same_org foreign key (project_id, organization_id) references public.projects(id, organization_id)
);

create table public.lab_task_dependencies (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  depends_on_task_id uuid not null,
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id),
  constraint task_dependencies_task_same_org foreign key (task_id, organization_id) references public.lab_tasks(id, organization_id),
  constraint task_dependencies_parent_same_org foreign key (depends_on_task_id, organization_id) references public.lab_tasks(id, organization_id)
);

-- User identifiers remain anchored to auth.users. Profile display names are
-- resolved separately because older production workspaces may store profile
-- identifiers as text while newer installations use uuid.

do $$
declare table_name text;
begin
  foreach table_name in array array['protocols','protocol_versions','equipment','equipment_events','inventory_items','inventory_transactions','experiments','experiment_collaborators','samples','lab_tasks','lab_task_dependencies']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_org_member(organization_id))', table_name || '_tenant_select', table_name);
  end loop;
end $$;

create policy protocols_tenant_insert on public.protocols for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy protocols_tenant_update on public.protocols for update to authenticated using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy protocol_versions_tenant_insert on public.protocol_versions for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy equipment_tenant_write on public.equipment for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy equipment_events_tenant_insert on public.equipment_events for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy inventory_items_tenant_write on public.inventory_items for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy experiments_tenant_write on public.experiments for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy collaborators_tenant_write on public.experiment_collaborators for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy samples_tenant_write on public.samples for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy lab_tasks_tenant_write on public.lab_tasks for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));
create policy task_dependencies_tenant_write on public.lab_task_dependencies for all to authenticated using (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));

revoke update, delete on public.inventory_transactions, public.equipment_events, public.protocol_versions from authenticated, anon;

create index experiments_org_status_idx on public.experiments(organization_id, status, updated_at desc) where deleted_at is null;
create index experiments_project_idx on public.experiments(organization_id, project_id, updated_at desc) where deleted_at is null;
create index samples_org_status_idx on public.samples(organization_id, status, updated_at desc) where deleted_at is null;
create index samples_experiment_idx on public.samples(organization_id, experiment_id) where deleted_at is null;
create index samples_parent_idx on public.samples(organization_id, parent_sample_id) where parent_sample_id is not null and deleted_at is null;
create index inventory_warning_idx on public.inventory_items(organization_id, expiration_date, quantity) where deleted_at is null;
create index inventory_transaction_item_idx on public.inventory_transactions(organization_id, inventory_item_id, created_at desc);
create index equipment_status_idx on public.equipment(organization_id, status, next_maintenance, next_calibration) where deleted_at is null;
create index protocol_status_idx on public.protocols(organization_id, status, updated_at desc) where deleted_at is null;
create index task_due_idx on public.lab_tasks(organization_id, status, due_date) where deleted_at is null;

create or replace function public.adjust_inventory(
  target_item_id uuid,
  amount numeric,
  adjustment_type text,
  adjustment_reason text,
  related_experiment_id uuid default null
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.inventory_items;
  next_quantity numeric;
begin
  if adjustment_type not in ('receipt','use','adjustment','disposal','transfer') or amount = 0 or char_length(trim(adjustment_reason)) < 3 then
    raise exception 'Invalid inventory adjustment';
  end if;

  select * into item from public.inventory_items where id = target_item_id and deleted_at is null for update;
  if item.id is null or not public.has_org_role(item.organization_id, array['owner','admin','engineer']::public.member_role[]) then
    raise exception 'Inventory item not found';
  end if;
  if related_experiment_id is not null and not exists (
    select 1 from public.experiments where id = related_experiment_id and organization_id = item.organization_id and deleted_at is null
  ) then
    raise exception 'Experiment not found';
  end if;

  next_quantity := item.quantity + amount;
  if next_quantity < 0 then raise exception 'Insufficient inventory'; end if;

  update public.inventory_items set quantity = next_quantity, updated_at = now() where id = item.id;
  insert into public.inventory_transactions(organization_id, inventory_item_id, transaction_type, quantity_delta, resulting_quantity, reason, experiment_id, created_by)
  values (item.organization_id, item.id, adjustment_type, amount, next_quantity, trim(adjustment_reason), related_experiment_id, auth.uid());
  insert into public.activity_log(organization_id, actor_id, action, record_type, record_id, summary)
  values (item.organization_id, auth.uid(), 'inventory_adjusted', 'Inventory item', item.id, item.code || ' adjusted by ' || amount || ' ' || item.unit || ': ' || trim(adjustment_reason));
  return next_quantity;
end;
$$;

revoke all on function public.adjust_inventory(uuid,numeric,text,text,uuid) from public, anon;
grant execute on function public.adjust_inventory(uuid,numeric,text,text,uuid) to authenticated;
