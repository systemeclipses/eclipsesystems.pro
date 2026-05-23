alter table public.subscriptions
add column if not exists deleted_at timestamptz;

