-- Ensure an inspection's component is the component recorded on its lot.
do $$ begin
  if not exists(select 1 from pg_constraint where conname='lots_id_component_org_unique') then
    alter table public.lots add constraint lots_id_component_org_unique unique(id,component_id,organization_id);
  end if;
  if not exists(select 1 from pg_constraint where conname='inspections_lot_component_match_fkey') then
    alter table public.inspections add constraint inspections_lot_component_match_fkey
      foreign key(lot_id,component_id,organization_id)
      references public.lots(id,component_id,organization_id);
  end if;
end $$;
