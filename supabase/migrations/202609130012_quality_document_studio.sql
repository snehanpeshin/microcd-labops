-- Controlled quality-document planning, immutable revisions, and human reviews.

create table public.quality_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  regulatory_profile_id uuid,
  document_key text not null check (char_length(document_key) between 2 and 100),
  title text not null check (char_length(title) between 2 and 180),
  lifecycle_phase integer not null check (lifecycle_phase between 1 and 5),
  quality_file text not null check (quality_file in ('DDF / DHF','DMR','DHR','QMS','Submission')),
  regulatory_basis text not null default '',
  applicability text not null default 'conditional' check (applicability in ('core','conditional','business')),
  planned_start_week integer not null check (planned_start_week between 0 and 520),
  planned_end_week integer check (planned_end_week between 0 and 520 and planned_end_week >= planned_start_week),
  status text not null default 'draft' check (status in ('draft','in_review','changes_requested','approved','obsolete')),
  current_revision integer not null default 1 check (current_revision > 0),
  owner_id uuid not null references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_id, document_key),
  unique (id, organization_id),
  constraint quality_documents_project_same_org foreign key (project_id, organization_id) references public.projects(id, organization_id),
  constraint quality_documents_profile_same_org foreign key (regulatory_profile_id, organization_id) references public.regulatory_profiles(id, organization_id)
);

create table public.quality_document_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null,
  revision integer not null check (revision > 0),
  content text not null check (char_length(content) between 10 and 100000),
  source text not null default 'user' check (source in ('template','user','ai_assisted')),
  ai_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(ai_metadata) = 'object'),
  dlp_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(dlp_summary) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (document_id, revision),
  unique (id, organization_id),
  constraint quality_revisions_document_same_org foreign key (document_id, organization_id) references public.quality_documents(id, organization_id) on delete cascade
);

create table public.quality_document_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null,
  revision_id uuid not null,
  decision text not null check (decision in ('submitted','changes_requested','approved')),
  comment text not null default '' check (char_length(comment) <= 4000),
  reviewer_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint quality_reviews_document_same_org foreign key (document_id, organization_id) references public.quality_documents(id, organization_id) on delete cascade,
  constraint quality_reviews_revision_same_org foreign key (revision_id, organization_id) references public.quality_document_revisions(id, organization_id)
);

do $$ declare t text; begin
  foreach t in array array['quality_documents','quality_document_revisions','quality_document_reviews'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.is_org_member(organization_id))',t,t);
  end loop;
end $$;

create policy quality_documents_insert on public.quality_documents for insert to authenticated with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy quality_documents_update on public.quality_documents for update to authenticated using (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy quality_revisions_insert on public.quality_document_revisions for insert to authenticated with check (public.has_org_role(organization_id,array['owner','admin','engineer']::public.member_role[]));
create policy quality_reviews_insert on public.quality_document_reviews for insert to authenticated with check (public.has_org_role(organization_id,array['owner','admin','reviewer']::public.member_role[]));

revoke delete on public.quality_documents from authenticated, anon;
revoke update, delete on public.quality_document_revisions, public.quality_document_reviews from authenticated, anon;

create index quality_documents_project_idx on public.quality_documents(organization_id,project_id,lifecycle_phase,status);
create index quality_revisions_document_idx on public.quality_document_revisions(document_id,revision desc);
create index quality_reviews_document_idx on public.quality_document_reviews(document_id,created_at desc);

alter table public.ai_usage add column quality_document_id uuid references public.quality_documents(id) on delete set null;
create index ai_usage_quality_document_idx on public.ai_usage(quality_document_id,created_at desc);
