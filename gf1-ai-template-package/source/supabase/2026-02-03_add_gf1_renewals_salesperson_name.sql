alter table public.gf1_renewals
  add column if not exists salesperson_name text;

update public.gf1_renewals r
set salesperson_name = p.name
from public.profiles p
where r.salesperson_name is null
  and r.created_by is not null
  and p.user_id = r.created_by;
