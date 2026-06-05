"use client";

import { useEffect, useMemo, useState } from 'react';
import { supaClient } from '@/lib/supabase/client';
import type { Gf1PeoService, Gf1ProspectService, ProfileRole } from '@/lib/gf1/types';

type ServicesSelectorProps = {
  prospectId: string;
  canEdit: boolean;
  viewerRole: ProfileRole | null;
  initialCatalog?: Gf1PeoService[];
  initialSelections?: Gf1ProspectService[];
};

type SelectionMap = Record<string, Gf1ProspectService>;

const TABLE_NAME = 'prospect_services';

export default function ServicesSelector({
  prospectId,
  canEdit,
  viewerRole,
  initialCatalog = [],
  initialSelections = [],
}: ServicesSelectorProps) {
  const [catalog, setCatalog] = useState<Gf1PeoService[]>(initialCatalog);
  const [selections, setSelections] = useState<SelectionMap>(() => indexSelections(initialSelections));
  const [configDrafts, setConfigDrafts] = useState<Record<string, string>>(() =>
    buildConfigDrafts(initialSelections)
  );
  const [pendingService, setPendingService] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = viewerRole === 'admin';

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const supabase = supaClient();
      const [servicesResult, selectionsResult] = await Promise.all([
        supabase.from('peo_services').select('*').order('sort_order', { ascending: true }),
        supabase.from(TABLE_NAME).select('*').eq('prospect_id', prospectId),
      ]);

      if (!active) return;
      if (servicesResult.data) {
        setCatalog(servicesResult.data as Gf1PeoService[]);
      }
      if (selectionsResult.data) {
        const list = selectionsResult.data as Gf1ProspectService[];
        setSelections(indexSelections(list));
        setConfigDrafts(buildConfigDrafts(list));
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, [prospectId]);

  const supabase = supaClient();

  async function upsertSelection(serviceId: string, next: Partial<Gf1ProspectService>) {
    setPendingService(serviceId);
    setError(null);
    const payload = {
      prospect_id: prospectId,
      service_id: serviceId,
      selected: true,
      config_json: selections[serviceId]?.config_json ?? null,
      locked: selections[serviceId]?.locked ?? false,
      ...next,
    };

    const { data, error: mutationError } = await supabase
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: 'prospect_id,service_id' })
      .select()
      .maybeSingle();

    setPendingService(null);

    if (mutationError) {
      console.error(mutationError);
      setError('Unable to save changes.');
      return null;
    }

    if (data) {
      setSelections((prev) => ({ ...prev, [serviceId]: data as Gf1ProspectService }));
    }
    return data as Gf1ProspectService | null;
  }

  async function handleToggle(serviceId: string, nextSelected: boolean) {
    if (!canEdit) return;
    const existing = selections[serviceId];
    const locked = existing?.locked ?? false;
    if (locked && !isAdmin) return;

    await upsertSelection(serviceId, { selected: nextSelected });
    if (!nextSelected) {
      setSelections((prev) => ({
        ...prev,
        [serviceId]: { ...(prev[serviceId] ?? { prospect_id: prospectId, service_id: serviceId }), selected: false },
      }));
    }
  }

  async function handleConfigSave(serviceId: string) {
    const draft = configDrafts[serviceId] ?? '';
    if (!draft.trim()) {
      setError('Config cannot be empty. Use {} for blank payloads.');
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError('Config must be valid JSON.');
      return;
    }
    await upsertSelection(serviceId, { config_json: parsed });
  }

  async function handleLockToggle(serviceId: string) {
    if (!isAdmin) return;
    const next = !(selections[serviceId]?.locked ?? false);
    await upsertSelection(serviceId, { locked: next });
  }

  function handleConfigChange(serviceId: string, value: string) {
    setConfigDrafts((prev) => ({ ...prev, [serviceId]: value }));
    setError(null);
  }

  const selectedCount = useMemo(
    () => Object.values(selections).filter((entry) => entry?.selected).length,
    [selections]
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-neutral-700">PEO services</div>
          <p className="text-sm text-neutral-500">{selectedCount} selected</p>
        </div>
        <span className="text-xs uppercase text-neutral-400">
          {canEdit ? 'Editable' : 'View only'}
        </span>
      </header>
      <div className="space-y-4">
        {catalog.map((service) => {
          const selection = selections[service.id];
          const isLocked = selection?.locked ?? false;
          const isSelected = selection?.selected ?? false;
          const disabled = !canEdit || (isLocked && !isAdmin);
          const configValue = configDrafts[service.id] ?? JSON.stringify(selection?.config_json ?? {}, null, 2);

          return (
            <div key={service.id} className="rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label className="flex items-center gap-2 text-base font-semibold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={disabled}
                      onChange={(event) => handleToggle(service.id, event.target.checked)}
                    />
                    {service.name}
                  </label>
                  {service.description && <p className="text-sm text-neutral-500">{service.description}</p>}
                </div>
                <div className="text-right text-xs uppercase text-neutral-400">
                  {isLocked ? 'Locked' : 'Unlocked'}
                </div>
              </div>
              {isSelected && (
                <div className="mt-4 space-y-2">
                  <textarea
                    className="h-28 w-full rounded-lg p-3 text-sm font-mono"
                    value={configValue}
                    disabled={disabled}
                    onChange={(event) => handleConfigChange(service.id, event.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <button
                      type="button"
                      className="rounded-full bg-indigo-600 px-4 py-1.5 text-white disabled:opacity-50"
                      disabled={disabled || pendingService === service.id}
                      onClick={() => handleConfigSave(service.id)}
                    >
                      {pendingService === service.id ? 'Saving...' : 'Save config'}
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="rounded-full px-3 py-1 text-neutral-700"
                        onClick={() => handleLockToggle(service.id)}
                      >
                        {isLocked ? 'Unlock' : 'Lock'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
}

function indexSelections(rows: Gf1ProspectService[]): SelectionMap {
  return rows.reduce<SelectionMap>((acc, row) => {
    acc[row.service_id] = row;
    return acc;
  }, {});
}

function buildConfigDrafts(rows: Gf1ProspectService[]) {
  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.service_id] = JSON.stringify(row.config_json ?? {}, null, 2);
    return acc;
  }, {});
}
