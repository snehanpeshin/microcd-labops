-- Close policy gaps discovered during the production-readiness review.

-- Invitation token hashes are credentials. Only owner/admin users may list
-- invitation metadata; acceptance remains token-based through the RPC.
drop policy if exists invitations_tenant_select on public.invitations;
create policy invitations_admin_select on public.invitations for select
using (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));

-- Lock controlled report content once its parent revision is approved. This
-- trigger also applies to service-role operations, protecting against a future
-- application regression. New work must be copied to a fresh revision.
create or replace function public.prevent_approved_report_content_change()
returns trigger language plpgsql set search_path = public
as $$
declare target_report uuid; current_status public.report_status;
begin
  if tg_op = 'DELETE' then target_report := old.report_id; else target_report := new.report_id; end if;
  select status into current_status from public.reports where id = target_report;
  if current_status = 'approved' then
    raise exception 'Approved report content is immutable';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

drop trigger if exists lock_approved_sections on public.report_sections;
create trigger lock_approved_sections before insert or update or delete on public.report_sections
for each row execute function public.prevent_approved_report_content_change();

drop trigger if exists lock_approved_criteria on public.acceptance_criteria;
create trigger lock_approved_criteria before insert or update or delete on public.acceptance_criteria
for each row execute function public.prevent_approved_report_content_change();

drop trigger if exists lock_approved_datasets on public.report_datasets;
create trigger lock_approved_datasets before insert or update or delete on public.report_datasets
for each row execute function public.prevent_approved_report_content_change();

drop trigger if exists lock_approved_statistics on public.report_statistics;
create trigger lock_approved_statistics before insert or update or delete on public.report_statistics
for each row execute function public.prevent_approved_report_content_change();

drop trigger if exists lock_approved_figures on public.report_figures;
create trigger lock_approved_figures before insert or update or delete on public.report_figures
for each row execute function public.prevent_approved_report_content_change();
