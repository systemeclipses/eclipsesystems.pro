create table if not exists public.generated_pdfs (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,
  source_module text not null,
  title text not null,
  file_name text not null,
  storage_bucket text not null default 'generated-pdfs',
  storage_path text not null,
  organization_id uuid null references public.organizations(id) on delete set null,
  pricing_info_sheet_id uuid null references public.pricing_info_sheets(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_pdfs_created_at
  on public.generated_pdfs (created_at desc);

create index if not exists idx_generated_pdfs_org
  on public.generated_pdfs (organization_id);

create index if not exists idx_generated_pdfs_source
  on public.generated_pdfs (source_module, document_type);

alter table public.generated_pdfs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'generated_pdfs'
      and policyname = 'admin read generated pdfs'
  ) then
    create policy "admin read generated pdfs"
      on public.generated_pdfs
      for select
      using (public.is_staff_or_admin(auth.uid()));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'generated_pdfs'
      and policyname = 'service role manage generated pdfs'
  ) then
    create policy "service role manage generated pdfs"
      on public.generated_pdfs
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values ('generated-pdfs', 'generated-pdfs', false)
on conflict (id) do nothing;
