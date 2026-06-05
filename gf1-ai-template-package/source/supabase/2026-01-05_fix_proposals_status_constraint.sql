do $$
begin
  execute 'alter table public.proposals drop constraint if exists proposals_status_check';

  execute $sql$
    alter table public.proposals
    add constraint proposals_status_check
      check (
        (status::text) in (
          'draft',
          'pending_approval',
          'awaiting_approval',
          'approved',
          'submitted',
          'sent_to_client',
          'sent_to_prospect',
          'accepted',
          'rejected'
        )
      )
  $sql$;
end
$$;
