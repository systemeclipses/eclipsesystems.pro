create table if not exists public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind public.channel_kind not null,
  name text,
  topic text,
  is_private boolean not null default false,
  created_by uuid not null references public.memberships(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.chat_channel_members (
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  role text not null default 'member',
  last_read_at timestamptz,
  notifications_muted boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (channel_id, membership_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  author_id uuid not null references public.memberships(id) on delete cascade,
  kind public.message_kind not null default 'text',
  body text,
  attachments jsonb,
  reply_to_id uuid references public.chat_messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_reactions (
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, membership_id, emoji)
);

create index if not exists chat_messages_channel_created_idx on public.chat_messages (channel_id, created_at desc) where deleted_at is null;

alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_reactions;
alter publication supabase_realtime add table public.time_entries;

drop trigger if exists chat_channels_set_updated_at on public.chat_channels;
create trigger chat_channels_set_updated_at before update on public.chat_channels for each row execute function public.set_updated_at();
