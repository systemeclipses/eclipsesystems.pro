alter type public.plan_code add value if not exists 'timekeeping';
alter type public.plan_code add value if not exists 'mission_command';
alter type public.plan_code add value if not exists 'eclipse';
alter type public.plan_code add value if not exists 'suite';
alter type public.plan_code add value if not exists 'legal_addon';

do $$ begin create type public.plan_kind as enum ('product','bundle','add_on'); exception when duplicate_object then null; end $$;
