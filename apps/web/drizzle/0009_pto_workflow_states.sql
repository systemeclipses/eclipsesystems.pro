alter table public.pto_requests
  drop constraint if exists pto_requests_status_check;

alter table public.pto_requests
  add constraint pto_requests_status_check check (
    status in ('draft', 'pending', 'needs_revision', 'approved', 'denied', 'cancelled', 'revoked', 'completed')
  );
