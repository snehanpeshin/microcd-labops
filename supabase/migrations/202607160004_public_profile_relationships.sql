-- PostgREST only discovers relationships between tables in exposed schemas.
-- These additive foreign keys mirror existing auth.users references through
-- public.profiles so dashboard embeds can resolve names without exposing auth.

alter table public.projects
  add constraint projects_owner_profile_fkey
  foreign key (owner_id) references public.profiles(id);

alter table public.reports
  add constraint reports_author_profile_fkey
  foreign key (author_id) references public.profiles(id),
  add constraint reports_reviewer_profile_fkey
  foreign key (reviewer_id) references public.profiles(id);

alter table public.suppliers
  add constraint suppliers_owner_profile_fkey
  foreign key (owner_id) references public.profiles(id);

alter table public.inspections
  add constraint inspections_inspector_profile_fkey
  foreign key (inspector_id) references public.profiles(id);

alter table public.activity_log
  add constraint activity_log_actor_profile_fkey
  foreign key (actor_id) references public.profiles(id);
