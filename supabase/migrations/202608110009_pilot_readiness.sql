-- Pilot-readiness capabilities: imports, alerts, adoption analytics, measurable
-- pilot outcomes, and onboarding template history.

create table public.notification_preferences (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  overdue_tasks boolean not null default true,
  low_stock boolean not null default true,
  expirations boolean not null default true,
  calibration boolean not null default true,
  lead_days integer not null default 14 check (lead_days between 1 and 90),
  digest_frequency text not null default 'daily' check (digest_frequency in ('daily','weekly','off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_key text not null,
  alert_type text not null check (alert_type in ('overdue_task','low_stock','expiration','calibration')),
  entity_type text not null,
  entity_id uuid not null,
  sent_at timestamptz not null default now(),
  unique (organization_id, user_id, alert_key)
);

create table public.product_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_name text not null check (char_length(event_name) between 3 and 80),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.pilot_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 120),
  unit text not null check (char_length(unit) between 1 and 40),
  baseline numeric not null,
  target numeric not null,
  current_value numeric,
  direction text not null default 'decrease' check (direction in ('increase','decrease')),
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.workspace_template_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_key text not null check (template_key in ('microfluidic-development','assay-development','equipment-qualification')),
  applied_by uuid not null references auth.users(id),
  created_record_count integer not null default 0 check (created_record_count >= 0),
  applied_at timestamptz not null default now(),
  unique (organization_id, template_key)
);

alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.product_events enable row level security;
alter table public.pilot_metrics enable row level security;
alter table public.workspace_template_runs enable row level security;

create policy notification_preferences_select on public.notification_preferences for select to authenticated
  using (user_id = auth.uid() and public.is_org_member(organization_id));
create policy notification_preferences_insert on public.notification_preferences for insert to authenticated
  with check (user_id = auth.uid() and public.is_org_member(organization_id));
create policy notification_preferences_update on public.notification_preferences for update to authenticated
  using (user_id = auth.uid() and public.is_org_member(organization_id))
  with check (user_id = auth.uid() and public.is_org_member(organization_id));

create policy notification_deliveries_select on public.notification_deliveries for select to authenticated
  using (user_id = auth.uid() and public.is_org_member(organization_id));

create policy product_events_select on public.product_events for select to authenticated
  using (public.is_org_member(organization_id));
create policy product_events_insert on public.product_events for insert to authenticated
  with check (actor_id = auth.uid() and public.is_org_member(organization_id));

create policy pilot_metrics_select on public.pilot_metrics for select to authenticated
  using (public.is_org_member(organization_id));
create policy pilot_metrics_write on public.pilot_metrics for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));

create policy workspace_template_runs_select on public.workspace_template_runs for select to authenticated
  using (public.is_org_member(organization_id));
create policy workspace_template_runs_insert on public.workspace_template_runs for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner','admin','engineer']::public.member_role[]));

revoke insert, update, delete on public.notification_deliveries from authenticated, anon;
revoke update, delete on public.product_events from authenticated, anon;
revoke update, delete on public.workspace_template_runs from authenticated, anon;

create index notification_digest_idx on public.notification_preferences(digest_frequency, updated_at) where digest_frequency <> 'off';
create index notification_delivery_lookup_idx on public.notification_deliveries(organization_id, user_id, sent_at desc);
create index product_events_org_time_idx on public.product_events(organization_id, occurred_at desc);
create index product_events_org_name_idx on public.product_events(organization_id, event_name, occurred_at desc);
create index pilot_metrics_org_idx on public.pilot_metrics(organization_id, updated_at desc);

create or replace function public.import_inventory_rows(target_org uuid, payload jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb;
  item_id uuid;
  initial_quantity numeric;
  imported integer := 0;
begin
  if not public.has_org_role(target_org, array['owner','admin','engineer']::public.member_role[]) then
    raise exception 'Insufficient permission';
  end if;
  if jsonb_typeof(payload) <> 'array' or jsonb_array_length(payload) < 1 or jsonb_array_length(payload) > 250 then
    raise exception 'Import must contain between 1 and 250 rows';
  end if;

  for row_data in select value from jsonb_array_elements(payload)
  loop
    initial_quantity := coalesce((row_data->>'quantity')::numeric, 0);
    if initial_quantity < 0 then raise exception 'Initial quantity cannot be negative'; end if;
    if coalesce(trim(row_data->>'code'),'') = '' or coalesce(trim(row_data->>'name'),'') = '' then
      raise exception 'Code and name are required';
    end if;

    insert into public.inventory_items(
      organization_id, code, name, item_type, manufacturer, catalog_number, lot_number,
      quantity, unit, minimum_stock, storage_location, received_date, expiration_date,
      owner_id, notes, created_by
    ) values (
      target_org, trim(row_data->>'code'), trim(row_data->>'name'), coalesce(nullif(row_data->>'item_type',''),'reagent'),
      coalesce(row_data->>'manufacturer',''), coalesce(row_data->>'catalog_number',''), coalesce(row_data->>'lot_number',''),
      initial_quantity, coalesce(nullif(row_data->>'unit',''),'each'), coalesce((row_data->>'minimum_stock')::numeric,0),
      coalesce(row_data->>'storage_location',''), nullif(row_data->>'received_date','')::date,
      nullif(row_data->>'expiration_date','')::date, auth.uid(), coalesce(row_data->>'notes',''), auth.uid()
    ) returning id into item_id;

    if initial_quantity > 0 then
      insert into public.inventory_transactions(
        organization_id, inventory_item_id, transaction_type, quantity_delta,
        resulting_quantity, reason, created_by
      ) values (target_org, item_id, 'receipt', initial_quantity, initial_quantity, 'Initial CSV import balance', auth.uid());
    end if;
    imported := imported + 1;
  end loop;

  insert into public.activity_log(organization_id, actor_id, action, record_type, summary)
  values (target_org, auth.uid(), 'inventory_csv_imported', 'Inventory import', imported || ' inventory rows imported');
  insert into public.product_events(organization_id, actor_id, event_name, entity_type, metadata)
  values (target_org, auth.uid(), 'inventory_csv_imported', 'Inventory import', jsonb_build_object('rows', imported));
  return imported;
end;
$$;

revoke all on function public.import_inventory_rows(uuid,jsonb) from public, anon;
grant execute on function public.import_inventory_rows(uuid,jsonb) to authenticated;
