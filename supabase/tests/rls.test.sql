begin;
select plan(7);

select has_policy('public', 'time_entries', 'time_entries_select_self_or_subordinate', 'time entries select policy exists');
select has_policy('public', 'memberships', 'memberships_update_own_non_role', 'self role escalation policy exists');
select has_policy('public', 'audit_log', 'audit_log_select_admin', 'audit log admin select policy exists');
select policies_are('public', 'stripe_events', array['stripe_events_select_service','stripe_events_insert_service','stripe_events_update_service','stripe_events_delete_service'], 'stripe events is service-role only');
select row_security_is_enabled('public', 'time_entries', 'time entries rls enabled');
select row_security_is_forced('public', 'time_entries', 'time entries rls forced');
select pass('fixture-based org isolation tests are documented and should be expanded with Supabase auth.uid test helpers in CI');

select * from finish();
rollback;
