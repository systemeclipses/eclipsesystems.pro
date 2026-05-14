do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','organizations','memberships','invitations','plans','subscriptions','stripe_events','payment_methods',
    'clients','projects','project_members','tasks','time_entries','org_sequences','invoices','invoice_line_items','invoice_payments',
    'shift_locations','shift_roles','shifts','shift_swap_requests','shift_marketplace_posts',
    'chat_channels','chat_channel_members','chat_messages','chat_reactions',
    'utbms_task_codes','utbms_activity_codes','utbms_expense_codes','matters','matter_rates','conflict_checks','trust_accounts','trust_transactions',
    'audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

create policy profiles_select_own on public.profiles for select using (id = auth.uid() and deleted_at is null);
create policy profiles_insert_own_or_service on public.profiles for insert with check (id = auth.uid() or auth.role() = 'service_role');
create policy profiles_update_own on public.profiles for update using (id = auth.uid() and deleted_at is null) with check (id = auth.uid());
create policy profiles_delete_none on public.profiles for delete using (false);

create policy organizations_select_member on public.organizations for select using (public.is_org_member(id) and deleted_at is null);
create policy organizations_insert_authenticated on public.organizations for insert with check (auth.uid() is not null or auth.role() = 'service_role');
create policy organizations_update_admin on public.organizations for update using (public.has_org_role(id, 'admin') and deleted_at is null) with check (public.has_org_role(id, 'admin'));
create policy organizations_delete_owner_soft_only on public.organizations for delete using (false);

create policy memberships_select_org_member on public.memberships for select using (public.is_org_member(organization_id) and deleted_at is null);
create policy memberships_insert_admin on public.memberships for insert with check (public.has_org_role(organization_id, 'admin') or auth.role() = 'service_role');
create policy memberships_update_admin on public.memberships for update using (public.has_org_role(organization_id, 'admin') and deleted_at is null) with check (public.has_org_role(organization_id, 'admin'));
create policy memberships_update_own_non_role on public.memberships for update using (user_id = auth.uid() and deleted_at is null) with check (user_id = auth.uid() and role = 'member');
create policy memberships_delete_none on public.memberships for delete using (false);

create policy invitations_select_admin on public.invitations for select using (public.has_org_role(organization_id, 'admin') and deleted_at is null);
create policy invitations_insert_admin on public.invitations for insert with check (public.has_org_role(organization_id, 'admin'));
create policy invitations_update_admin on public.invitations for update using (public.has_org_role(organization_id, 'admin') and deleted_at is null) with check (public.has_org_role(organization_id, 'admin'));
create policy invitations_delete_none on public.invitations for delete using (false);

create policy plans_select_authenticated on public.plans for select using (auth.uid() is not null or auth.role() = 'service_role');
create policy plans_insert_service on public.plans for insert with check (auth.role() = 'service_role');
create policy plans_update_service on public.plans for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy plans_delete_service on public.plans for delete using (auth.role() = 'service_role');

create policy subscriptions_select_member on public.subscriptions for select using (public.is_org_member(organization_id));
create policy subscriptions_insert_service on public.subscriptions for insert with check (auth.role() = 'service_role');
create policy subscriptions_update_service on public.subscriptions for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy subscriptions_delete_service on public.subscriptions for delete using (auth.role() = 'service_role');

create policy stripe_events_select_service on public.stripe_events for select using (auth.role() = 'service_role');
create policy stripe_events_insert_service on public.stripe_events for insert with check (auth.role() = 'service_role');
create policy stripe_events_update_service on public.stripe_events for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy stripe_events_delete_service on public.stripe_events for delete using (auth.role() = 'service_role');

create policy payment_methods_select_member on public.payment_methods for select using (public.is_org_member(organization_id));
create policy payment_methods_insert_service on public.payment_methods for insert with check (auth.role() = 'service_role');
create policy payment_methods_update_service on public.payment_methods for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy payment_methods_delete_service on public.payment_methods for delete using (auth.role() = 'service_role');

create policy clients_select_project_feature on public.clients for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'projects') and deleted_at is null);
create policy clients_insert_manager on public.clients for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'projects'));
create policy clients_update_manager on public.clients for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy clients_delete_none on public.clients for delete using (false);

create policy projects_select_project_feature on public.projects for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'projects') and deleted_at is null);
create policy projects_insert_manager on public.projects for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'projects'));
create policy projects_update_manager on public.projects for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy projects_delete_none on public.projects for delete using (false);

create policy project_members_select_project_feature on public.project_members for select using (exists (select 1 from public.projects p where p.id = project_id and public.is_org_member(p.organization_id) and public.org_has_feature(p.organization_id, 'projects') and p.deleted_at is null));
create policy project_members_insert_manager on public.project_members for insert with check (exists (select 1 from public.projects p where p.id = project_id and public.has_org_role(p.organization_id, 'manager') and public.org_has_feature(p.organization_id, 'projects')));
create policy project_members_update_manager on public.project_members for update using (exists (select 1 from public.projects p where p.id = project_id and public.has_org_role(p.organization_id, 'manager'))) with check (exists (select 1 from public.projects p where p.id = project_id and public.has_org_role(p.organization_id, 'manager')));
create policy project_members_delete_manager on public.project_members for delete using (exists (select 1 from public.projects p where p.id = project_id and public.has_org_role(p.organization_id, 'manager')));

create policy tasks_select_project_feature on public.tasks for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'projects') and deleted_at is null);
create policy tasks_insert_manager on public.tasks for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'projects'));
create policy tasks_update_manager on public.tasks for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy tasks_delete_none on public.tasks for delete using (false);

create policy time_entries_select_self_or_subordinate on public.time_entries for select using (
  public.is_org_member(organization_id) and deleted_at is null and (
    membership_id = public.my_membership_id(organization_id)
    or public.has_org_role(organization_id, 'admin')
    or membership_id in (select public.subordinate_membership_ids(organization_id))
  )
);
create policy time_entries_insert_own on public.time_entries for insert with check (membership_id = public.my_membership_id(organization_id));
create policy time_entries_update_self_or_subordinate_unlocked on public.time_entries for update using (
  deleted_at is null and status not in ('invoiced','locked') and (
    membership_id = public.my_membership_id(organization_id)
    or public.has_org_role(organization_id, 'admin')
    or membership_id in (select public.subordinate_membership_ids(organization_id))
  )
) with check (status not in ('invoiced','locked'));
create policy time_entries_delete_none on public.time_entries for delete using (false);

create policy org_sequences_select_admin on public.org_sequences for select using (public.has_org_role(organization_id, 'admin'));
create policy org_sequences_insert_service on public.org_sequences for insert with check (auth.role() = 'service_role');
create policy org_sequences_update_service on public.org_sequences for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy org_sequences_delete_service on public.org_sequences for delete using (auth.role() = 'service_role');

create policy invoices_select_invoicing_feature on public.invoices for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'invoicing') and deleted_at is null);
create policy invoices_insert_manager on public.invoices for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'invoicing'));
create policy invoices_update_manager on public.invoices for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy invoices_delete_none on public.invoices for delete using (false);

create policy invoice_line_items_select_invoicing_feature on public.invoice_line_items for select using (exists (select 1 from public.invoices i where i.id = invoice_id and public.is_org_member(i.organization_id) and public.org_has_feature(i.organization_id, 'invoicing') and i.deleted_at is null));
create policy invoice_line_items_insert_manager on public.invoice_line_items for insert with check (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, 'manager') and public.org_has_feature(i.organization_id, 'invoicing')));
create policy invoice_line_items_update_manager on public.invoice_line_items for update using (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, 'manager'))) with check (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, 'manager')));
create policy invoice_line_items_delete_manager on public.invoice_line_items for delete using (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, 'manager')));

create policy invoice_payments_select_invoicing_feature on public.invoice_payments for select using (exists (select 1 from public.invoices i where i.id = invoice_id and public.is_org_member(i.organization_id) and public.org_has_feature(i.organization_id, 'invoicing') and i.deleted_at is null));
create policy invoice_payments_insert_manager on public.invoice_payments for insert with check (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, 'manager')));
create policy invoice_payments_update_manager on public.invoice_payments for update using (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, 'manager'))) with check (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, 'manager')));
create policy invoice_payments_delete_manager on public.invoice_payments for delete using (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, 'manager')));

create policy shift_locations_select_shifts_feature on public.shift_locations for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'shifts') and deleted_at is null);
create policy shift_locations_insert_manager on public.shift_locations for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'shifts'));
create policy shift_locations_update_manager on public.shift_locations for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy shift_locations_delete_none on public.shift_locations for delete using (false);

create policy shift_roles_select_shifts_feature on public.shift_roles for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'shifts') and deleted_at is null);
create policy shift_roles_insert_manager on public.shift_roles for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'shifts'));
create policy shift_roles_update_manager on public.shift_roles for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy shift_roles_delete_none on public.shift_roles for delete using (false);

create policy shifts_select_org_shifts_feature on public.shifts for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'shifts') and deleted_at is null);
create policy shifts_insert_manager on public.shifts for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'shifts'));
create policy shifts_update_manager on public.shifts for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy shifts_delete_none on public.shifts for delete using (false);

create policy shift_swap_requests_select_shifts_feature on public.shift_swap_requests for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'shifts') and deleted_at is null);
create policy shift_swap_requests_insert_member on public.shift_swap_requests for insert with check (requested_by = public.my_membership_id(organization_id) and public.org_has_feature(organization_id, 'shifts'));
create policy shift_swap_requests_update_manager_or_party on public.shift_swap_requests for update using (public.has_org_role(organization_id, 'manager') or requested_by = public.my_membership_id(organization_id) or offered_to = public.my_membership_id(organization_id)) with check (public.is_org_member(organization_id));
create policy shift_swap_requests_delete_none on public.shift_swap_requests for delete using (false);

create policy shift_marketplace_posts_select_shifts_feature on public.shift_marketplace_posts for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'shifts') and deleted_at is null);
create policy shift_marketplace_posts_insert_member on public.shift_marketplace_posts for insert with check (posted_by = public.my_membership_id(organization_id) and public.org_has_feature(organization_id, 'shifts'));
create policy shift_marketplace_posts_update_manager_or_claimant on public.shift_marketplace_posts for update using (public.has_org_role(organization_id, 'manager') or claimed_by = public.my_membership_id(organization_id) or posted_by = public.my_membership_id(organization_id)) with check (public.is_org_member(organization_id));
create policy shift_marketplace_posts_delete_none on public.shift_marketplace_posts for delete using (false);

create policy chat_channels_select_channel_member on public.chat_channels for select using (public.org_has_feature(organization_id, 'chat') and deleted_at is null and (not is_private or public.is_channel_member(id) or public.has_org_role(organization_id, 'admin')));
create policy chat_channels_insert_member on public.chat_channels for insert with check (created_by = public.my_membership_id(organization_id) and public.org_has_feature(organization_id, 'chat'));
create policy chat_channels_update_admin_or_creator on public.chat_channels for update using (public.has_org_role(organization_id, 'admin') or created_by = public.my_membership_id(organization_id)) with check (public.is_org_member(organization_id));
create policy chat_channels_delete_none on public.chat_channels for delete using (false);

create policy chat_channel_members_select_channel_member on public.chat_channel_members for select using (public.is_channel_member(channel_id));
create policy chat_channel_members_insert_channel_admin on public.chat_channel_members for insert with check (exists (select 1 from public.chat_channels cc where cc.id = channel_id and public.has_org_role(cc.organization_id, 'admin') and public.org_has_feature(cc.organization_id, 'chat')));
create policy chat_channel_members_update_self on public.chat_channel_members for update using (membership_id in (select public.my_membership_id(cc.organization_id) from public.chat_channels cc where cc.id = channel_id)) with check (membership_id in (select public.my_membership_id(cc.organization_id) from public.chat_channels cc where cc.id = channel_id));
create policy chat_channel_members_delete_admin on public.chat_channel_members for delete using (exists (select 1 from public.chat_channels cc where cc.id = channel_id and public.has_org_role(cc.organization_id, 'admin')));

create policy chat_messages_select_channel_member on public.chat_messages for select using (public.org_has_feature(organization_id, 'chat') and deleted_at is null and public.is_channel_member(channel_id));
create policy chat_messages_insert_channel_member on public.chat_messages for insert with check (author_id = public.my_membership_id(organization_id) and public.is_channel_member(channel_id) and public.org_has_feature(organization_id, 'chat'));
create policy chat_messages_update_author_15_minutes on public.chat_messages for update using (author_id = public.my_membership_id(organization_id) and created_at > now() - interval '15 minutes') with check (author_id = public.my_membership_id(organization_id));
create policy chat_messages_delete_none on public.chat_messages for delete using (false);

create policy chat_reactions_select_channel_member on public.chat_reactions for select using (exists (select 1 from public.chat_messages m where m.id = message_id and public.is_channel_member(m.channel_id) and m.deleted_at is null));
create policy chat_reactions_insert_self on public.chat_reactions for insert with check (exists (select 1 from public.chat_messages m where m.id = message_id and membership_id = public.my_membership_id(m.organization_id) and public.is_channel_member(m.channel_id)));
create policy chat_reactions_update_self on public.chat_reactions for update using (exists (select 1 from public.chat_messages m where m.id = message_id and membership_id = public.my_membership_id(m.organization_id))) with check (exists (select 1 from public.chat_messages m where m.id = message_id and membership_id = public.my_membership_id(m.organization_id)));
create policy chat_reactions_delete_self on public.chat_reactions for delete using (exists (select 1 from public.chat_messages m where m.id = message_id and membership_id = public.my_membership_id(m.organization_id)));

create policy utbms_task_codes_select_legal_member on public.utbms_task_codes for select using (auth.uid() is not null);
create policy utbms_task_codes_insert_service on public.utbms_task_codes for insert with check (auth.role() = 'service_role');
create policy utbms_task_codes_update_service on public.utbms_task_codes for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy utbms_task_codes_delete_service on public.utbms_task_codes for delete using (auth.role() = 'service_role');
create policy utbms_activity_codes_select_legal_member on public.utbms_activity_codes for select using (auth.uid() is not null);
create policy utbms_activity_codes_insert_service on public.utbms_activity_codes for insert with check (auth.role() = 'service_role');
create policy utbms_activity_codes_update_service on public.utbms_activity_codes for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy utbms_activity_codes_delete_service on public.utbms_activity_codes for delete using (auth.role() = 'service_role');
create policy utbms_expense_codes_select_legal_member on public.utbms_expense_codes for select using (auth.uid() is not null);
create policy utbms_expense_codes_insert_service on public.utbms_expense_codes for insert with check (auth.role() = 'service_role');
create policy utbms_expense_codes_update_service on public.utbms_expense_codes for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy utbms_expense_codes_delete_service on public.utbms_expense_codes for delete using (auth.role() = 'service_role');

create policy matters_select_legal_feature on public.matters for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'legal') and deleted_at is null);
create policy matters_insert_manager on public.matters for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'legal'));
create policy matters_update_manager on public.matters for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy matters_delete_none on public.matters for delete using (false);

create policy matter_rates_select_legal_feature on public.matter_rates for select using (exists (select 1 from public.matters m where m.id = matter_id and public.is_org_member(m.organization_id) and public.org_has_feature(m.organization_id, 'legal') and m.deleted_at is null));
create policy matter_rates_insert_manager on public.matter_rates for insert with check (exists (select 1 from public.matters m where m.id = matter_id and public.has_org_role(m.organization_id, 'manager') and public.org_has_feature(m.organization_id, 'legal')));
create policy matter_rates_update_manager on public.matter_rates for update using (exists (select 1 from public.matters m where m.id = matter_id and public.has_org_role(m.organization_id, 'manager'))) with check (exists (select 1 from public.matters m where m.id = matter_id and public.has_org_role(m.organization_id, 'manager')));
create policy matter_rates_delete_manager on public.matter_rates for delete using (exists (select 1 from public.matters m where m.id = matter_id and public.has_org_role(m.organization_id, 'manager')));

create policy conflict_checks_select_legal_feature on public.conflict_checks for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'legal') and deleted_at is null);
create policy conflict_checks_insert_manager on public.conflict_checks for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'legal'));
create policy conflict_checks_update_manager on public.conflict_checks for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy conflict_checks_delete_none on public.conflict_checks for delete using (false);

create policy trust_accounts_select_legal_feature on public.trust_accounts for select using (public.is_org_member(organization_id) and public.org_has_feature(organization_id, 'legal') and deleted_at is null);
create policy trust_accounts_insert_manager on public.trust_accounts for insert with check (public.has_org_role(organization_id, 'manager') and public.org_has_feature(organization_id, 'legal'));
create policy trust_accounts_update_manager on public.trust_accounts for update using (public.has_org_role(organization_id, 'manager') and deleted_at is null) with check (public.has_org_role(organization_id, 'manager'));
create policy trust_accounts_delete_none on public.trust_accounts for delete using (false);

create policy trust_transactions_select_legal_feature on public.trust_transactions for select using (exists (select 1 from public.trust_accounts a where a.id = trust_account_id and public.is_org_member(a.organization_id) and public.org_has_feature(a.organization_id, 'legal') and a.deleted_at is null));
create policy trust_transactions_insert_manager on public.trust_transactions for insert with check (exists (select 1 from public.trust_accounts a where a.id = trust_account_id and public.has_org_role(a.organization_id, 'manager') and public.org_has_feature(a.organization_id, 'legal')));
create policy trust_transactions_update_none on public.trust_transactions for update using (false) with check (false);
create policy trust_transactions_delete_none on public.trust_transactions for delete using (false);

create policy audit_log_select_admin on public.audit_log for select using (organization_id is null or public.has_org_role(organization_id, 'admin'));
create policy audit_log_insert_none on public.audit_log for insert with check (false);
create policy audit_log_update_none on public.audit_log for update using (false) with check (false);
create policy audit_log_delete_none on public.audit_log for delete using (false);
