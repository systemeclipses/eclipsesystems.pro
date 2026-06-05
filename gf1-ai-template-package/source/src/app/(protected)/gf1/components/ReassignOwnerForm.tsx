"use client";

import { useState, type ChangeEvent } from 'react';
import { supaClient } from '@/lib/supabase/client';
import type { AssignableUser, ProfileRole } from '@/lib/gf1/types';

type ReassignOwnerFormProps = {
  entityType: 'prospect' | 'client';
  entityId: string;
  currentAssigneeId: string | null;
  users: AssignableUser[];
  viewerRole: ProfileRole | null;
};

const TABLE_MAP: Record<ReassignOwnerFormProps['entityType'], string> = {
  prospect: 'prospects',
  client: 'clients',
};

export default function ReassignOwnerForm({
  entityType,
  entityId,
  currentAssigneeId,
  users,
  viewerRole,
}: ReassignOwnerFormProps) {
  const [selectedId, setSelectedId] = useState(currentAssigneeId ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const canEdit = viewerRole === 'admin';

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextId = event.target.value;
    setSelectedId(nextId);
    if (!canEdit) return;
    setStatus('saving');
    const supabase = supaClient();
    const { error } = await supabase
      .from(TABLE_MAP[entityType])
      .update({ assigned_rep_id: nextId || null })
      .eq('id', entityId);

    if (error) {
      console.error(error);
      setStatus('error');
      return;
    }

    setStatus('success');
  }

  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 p-4">
      <div className="text-sm font-semibold text-neutral-700">Assigned rep</div>
      <select
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-100"
        value={selectedId}
        onChange={handleChange}
        disabled={!canEdit}
      >
        <option value="">Unassigned</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.full_name ?? user.email ?? user.id}
          </option>
        ))}
      </select>
      <p className="text-xs text-neutral-500">
        {canEdit ? 'Changes apply immediately.' : 'Only admins can reassign.'}
      </p>
      {status === 'success' && <p className="text-xs text-emerald-600">Updated.</p>}
      {status === 'error' && <p className="text-xs text-rose-500">Update failed.</p>}
    </div>
  );
}
