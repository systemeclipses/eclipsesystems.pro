'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './CompanyInventory.module.css';
import type { InventoryCategory, InventoryItem, InventoryStatus } from '@/lib/gf1/types';

type CategoryFilter = 'all' | InventoryCategory;
type EmployeeFilter = 'all' | 'unassigned' | string;

const categoryOrder: InventoryCategory[] = [
  'computers',
  'monitors',
  'docking_stations',
  'attachable_monitors',
  'keyboards_mice',
  'phones',
  'chairs',
  'webcams',
  'printers_scanners',
];

const categoryMeta: Record<InventoryCategory, { label: string; icon: string }> = {
  computers: { label: 'Computers', icon: 'fa-solid fa-laptop' },
  monitors: { label: 'Monitors', icon: 'fa-solid fa-display' },
  docking_stations: { label: 'Docking Stations', icon: 'fa-solid fa-link' },
  attachable_monitors: { label: 'Attachable Monitors', icon: 'fa-solid fa-tablet-screen-button' },
  keyboards_mice: { label: 'Keyboards & Mice', icon: 'fa-solid fa-keyboard' },
  phones: { label: 'Phones', icon: 'fa-solid fa-phone' },
  chairs: { label: 'Chairs', icon: 'fa-solid fa-chair' },
  webcams: { label: 'Webcams', icon: 'fa-solid fa-video' },
  printers_scanners: { label: 'Printers & Scanners', icon: 'fa-solid fa-print' },
};

const statusLabels: Record<InventoryStatus, string> = {
  in_use: 'In Use',
  available: 'Available',
  repair: 'Needs Repair',
  retiring: 'Retiring',
  expired: 'Expired',
};

const statusClassMap: Record<InventoryStatus, string> = {
  in_use: styles.statusInUse,
  available: styles.statusAvailable,
  repair: styles.statusRepair,
  retiring: styles.statusRetiring,
  expired: styles.statusExpired,
};

const navFilters: Array<{ key: CategoryFilter; label: string; icon: string }> = [
  { key: 'all', label: 'All Assets', icon: 'fa-solid fa-layer-group' },
  ...categoryOrder.map((category) => ({
    key: category,
    label: categoryMeta[category].label,
    icon: categoryMeta[category].icon,
  })),
];

const manualEmployees = [
  'Blan',
  'Vanessa',
  'Morgan',
  'Jenny',
  'Jennifer',
  'Apryl',
  'Jack',
  'Stormie',
  'Kat',
  'Garrett',
  'Matt',
  'John',
  'Niyah',
  'James',
  'Amelia',
  'Ana',
  'Emily',
  'David',
  'Rick',
  'Charles',
];

export function CompanyInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<Array<{ user_id: string; name: string | null; full_name: string | null; email: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [activeEmployee, setActiveEmployee] = useState<EmployeeFilter>('all');
  const [ageSort, setAgeSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', purchase_date: '' });
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'computers' as InventoryCategory,
    status: 'available' as InventoryStatus,
    location_type: 'office' as 'home' | 'office',
    assigned_to: '',
    purchase_date: '',
  });

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/inventory', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof payload?.message === 'string' ? payload.message : response.statusText;
        throw new Error(message || 'Unable to load inventory right now. Please try again.');
      }
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (err) {
      console.error('Failed to load inventory', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/inventory-users', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unable to load users.');
      }
      const payload = await response.json();
      setUsers(Array.isArray(payload.users) ? payload.users : []);
    } catch (err) {
      console.error('Failed to load inventory users', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resolveUserLabel = useCallback((userId?: string | null) => {
    if (!userId) return null;
    if (userId.startsWith('manual:')) return userId.replace('manual:', '');
    const manualMatch = manualEmployees.find((name) => name === userId);
    if (manualMatch) return manualMatch;
    const match = users.find((user) => user.user_id === userId);
    if (!match) return null;
    return match.name ?? match.full_name ?? match.email ?? 'Unknown user';
  }, [users]);

  const assignableUsers = useMemo(() => {
    const apiUsers = users.map((user) => ({
      value: user.user_id,
      label: user.name ?? user.full_name ?? user.email ?? 'Unknown',
    }));
    const manualUsers = manualEmployees.map((name) => ({
      value: `manual:${name}`,
      label: name,
    }));
    return [...manualUsers, ...apiUsers];
  }, [users]);

  const employeeFilters = useMemo(() => ([
    { value: 'all', label: 'All Employees' },
    { value: 'unassigned', label: 'Unassigned' },
    ...assignableUsers,
  ]), [assignableUsers]);

  const employeeFilteredItems = useMemo(() => {
    if (activeEmployee === 'all') return items;
    if (activeEmployee === 'unassigned') {
      return items.filter((item) => !item.assigned_to && !item.owner);
    }
    if (activeEmployee.startsWith('manual:')) {
      const name = activeEmployee.replace('manual:', '');
      return items.filter((item) => item.owner === name);
    }
    return items.filter((item) => item.assigned_to === activeEmployee);
  }, [activeEmployee, items]);

  const searchFilteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return employeeFilteredItems;
    return employeeFilteredItems.filter((item) => {
      const assignedLabel = item.assigned_to
        ? resolveUserLabel(item.assigned_to) ?? ''
        : item.owner ?? '';
      const categoryLabel = categoryMeta[item.category]?.label ?? item.category;
      const haystack = [
        item.name,
        item.description,
        item.location,
        item.department,
        item.owner,
        assignedLabel,
        categoryLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [employeeFilteredItems, resolveUserLabel, searchTerm]);

  const sortedItems = useMemo(() => {
    if (ageSort === 'none') return searchFilteredItems;
    const sorted = [...searchFilteredItems];
    sorted.sort((a, b) => {
      const aVal = a.purchase_date ? new Date(a.purchase_date).getTime() : Number.POSITIVE_INFINITY;
      const bVal = b.purchase_date ? new Date(b.purchase_date).getTime() : Number.POSITIVE_INFINITY;
      if (aVal === bVal) return 0;
      return ageSort === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [ageSort, searchFilteredItems]);

  const resolveAssignment = useCallback((value: string) => {
    if (!value) return { assigned_to: null, owner: null };
    if (value.startsWith('manual:')) {
      return { assigned_to: null, owner: value.replace('manual:', '') };
    }
    return { assigned_to: value, owner: null };
  }, []);

  const formatAgeFromPurchase = useCallback((value?: string | null) => {
    if (!value) return '—';
    const purchase = new Date(value);
    if (Number.isNaN(purchase.getTime())) return '—';
    const now = new Date();
    if (now <= purchase) return '0y 0m 0d';

    let years = now.getFullYear() - purchase.getFullYear();
    let months = now.getMonth() - purchase.getMonth();
    let days = now.getDate() - purchase.getDate();

    if (days < 0) {
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
      months -= 1;
    }
    if (months < 0) {
      months += 12;
      years -= 1;
    }

    years = Math.max(years, 0);
    months = Math.max(months, 0);
    days = Math.max(days, 0);

    return `${years}y ${months}m ${days}d`;
  }, []);

  const handleCreate = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const assignment = resolveAssignment(newItem.assigned_to);
      const payload = {
        name: newItem.name,
        category: newItem.category,
        status: newItem.status,
        purchase_date: newItem.purchase_date || null,
        location_type: newItem.location_type || null,
        assigned_to: assignment.assigned_to,
        owner: assignment.owner,
        notes: [],
      };

      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save inventory item.');
      }

      setNewItem({
        name: '',
        category: 'computers',
        status: 'available',
        location_type: 'office',
        assigned_to: '',
        purchase_date: '',
      });
      setShowForm(false);
      await fetchInventory();
    } catch (err) {
      console.error('Failed to create inventory item', err);
      setError(err instanceof Error ? err.message : 'Failed to create inventory item');
    } finally {
      setSaving(false);
    }
  }, [fetchInventory, newItem, resolveAssignment]);

  const handleDelete = useCallback(async (itemId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/inventory?id=${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Unable to delete inventory item.');
      }
      await fetchInventory();
    } catch (err) {
      console.error('Failed to delete inventory item', err);
      setError(err instanceof Error ? err.message : 'Failed to delete inventory item');
    } finally {
      setSaving(false);
    }
  }, [fetchInventory]);

  const handleUpdate = useCallback(async (itemId: string, updates: { assigned_to?: string | null; owner?: string | null; location_type?: string | null; purchase_date?: string | null }) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, ...updates }),
      });
      if (!response.ok) {
        throw new Error('Unable to update inventory item.');
      }
      await fetchInventory();
    } catch (err) {
      console.error('Failed to update inventory item', err);
      setError(err instanceof Error ? err.message : 'Failed to update inventory item');
    } finally {
      setSaving(false);
    }
  }, [fetchInventory]);

  const openEditModal = useCallback((item: InventoryItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      purchase_date: item.purchase_date ?? '',
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingItem(null);
  }, []);

  const handleEditSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          name: editForm.name.trim(),
          purchase_date: editForm.purchase_date || null,
        }),
      });
      if (!response.ok) {
        throw new Error('Unable to update inventory item.');
      }
      setEditingItem(null);
      await fetchInventory();
    } catch (err) {
      console.error('Failed to update inventory item', err);
      setError(err instanceof Error ? err.message : 'Failed to update inventory item');
    } finally {
      setSaving(false);
    }
  }, [editForm.name, editForm.purchase_date, editingItem, fetchInventory]);

  const groupedItems = useMemo(() => {
    const base: Record<InventoryCategory, InventoryItem[]> = {
      computers: [],
      monitors: [],
      docking_stations: [],
      attachable_monitors: [],
      keyboards_mice: [],
      phones: [],
      chairs: [],
      webcams: [],
      printers_scanners: [],
    };
    sortedItems.forEach((item) => {
      base[item.category].push(item);
    });
    return base;
  }, [sortedItems]);

  const navCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: items.length,
      computers: 0,
      monitors: 0,
      docking_stations: 0,
      attachable_monitors: 0,
      keyboards_mice: 0,
      phones: 0,
      chairs: 0,
      webcams: 0,
      printers_scanners: 0,
    };
    sortedItems.forEach((item) => {
      counts[item.category] += 1;
    });
    counts.all = sortedItems.length;
    return counts;
  }, [sortedItems]);

  const visibleCategories: InventoryCategory[] = activeCategory === 'all' ? categoryOrder : [activeCategory];
  const filteredItems = activeCategory === 'all' ? sortedItems : groupedItems[activeCategory];
  const hasVisibleItems = filteredItems.length > 0;
  const totalInUse = useMemo(() => items.filter((item) => item.status === 'in_use').length, [items]);

  return (
    <div className={styles.inventoryShell}>
      <aside className={styles.sideNav}>
        <img className={styles.logoImage} src="/whiteLogowithletters.svg" alt="Inventory" />
        <div className={styles.searchbar}>
          <input
            className={styles.search}
            placeholder="Search inventory"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button className={styles.searchButton} type="button" aria-label="Search inventory">
            <i className="fa-solid fa-magnifying-glass" aria-hidden />
          </button>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="employeeFilter">
            Filter by employee
          </label>
          <select
            id="employeeFilter"
            className={styles.filterSelect}
            value={activeEmployee}
            onChange={(event) => setActiveEmployee(event.target.value)}
          >
            {employeeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="ageSort">
            Sort by age
          </label>
          <select
            id="ageSort"
            className={styles.filterSelect}
            value={ageSort}
            onChange={(event) => setAgeSort(event.target.value as 'none' | 'asc' | 'desc')}
          >
            <option value="none">Default</option>
            <option value="asc">Youngest first</option>
            <option value="desc">Oldest first</option>
          </select>
        </div>
        <div className={styles.spacer} />
        {navFilters.map((filter) => {
          const isActive = activeCategory === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              className={`${styles.sideButton} ${isActive ? styles.sideButtonActive : ''}`}
              onClick={() => setActiveCategory(filter.key)}
            >
              <i className={filter.icon} aria-hidden />
              {filter.label}
            </button>
          );
        })}
      </aside>

      <aside className={`${styles.mobileSideNav} ${menuOpen ? styles.mobileSideNavOpen : ''}`}>
        <img className={styles.logoImage} src="/whiteLogowithletters.svg" alt="Inventory" />
        <div className={styles.searchbar}>
          <input
            className={styles.search}
            placeholder="Search inventory"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button className={styles.searchButton} type="button" aria-label="Search inventory">
            <i className="fa-solid fa-magnifying-glass" aria-hidden />
          </button>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="employeeFilterMobile">
            Filter by employee
          </label>
          <select
            id="employeeFilterMobile"
            className={styles.filterSelect}
            value={activeEmployee}
            onChange={(event) => setActiveEmployee(event.target.value)}
          >
            {employeeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="ageSortMobile">
            Sort by age
          </label>
          <select
            id="ageSortMobile"
            className={styles.filterSelect}
            value={ageSort}
            onChange={(event) => setAgeSort(event.target.value as 'none' | 'asc' | 'desc')}
          >
            <option value="none">Default</option>
            <option value="asc">Youngest first</option>
            <option value="desc">Oldest first</option>
          </select>
        </div>
        <div className={styles.spacer} />
        {navFilters.map((filter) => {
          const isActive = activeCategory === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              className={`${styles.sideButton} ${isActive ? styles.sideButtonActive : ''}`}
              onClick={() => {
                setActiveCategory(filter.key);
                setMenuOpen(false);
              }}
            >
              <i className={filter.icon} aria-hidden />
              {filter.label}
            </button>
          );
        })}
      </aside>

      <div className={styles.contentArea}>
        <div className={styles.mobileBar}>
          <img className={`${styles.logoImage} ${styles.logoImageSmall}`} src="/whiteLogowithletters.svg" alt="Inventory" />
          <button
            className={styles.menuButton}
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <i className="fa-solid fa-bars" aria-hidden />
          </button>
        </div>

        <section className={styles.pageHeader}>
          <div className={styles.summaryMetrics}>
            <div className={styles.metricsHeaderRow}>
              <button
                type="button"
                className={styles.addItemButton}
                onClick={() => setShowForm((prev) => !prev)}
              >
                <i className="fa-solid fa-plus" aria-hidden />
                {showForm ? 'Close' : 'Add item'}
              </button>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total Items</div>
              <div className={styles.metricValue}>{items.length}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>In Use</div>
              <div className={styles.metricValue}>{totalInUse}</div>
            </div>
          </div>
        </section>

        {showForm && (
          <form className={styles.addForm} onSubmit={handleCreate}>
            <div className={styles.formHeader}>
              <div>
                <p className={styles.formTitle}>Add inventory item</p>
                <p className={styles.formSubtitle}>Record a new asset and assign it to a teammate.</p>
              </div>
              <button type="submit" className={styles.primaryButton} disabled={saving}>
                {saving ? 'Saving...' : 'Add item'}
              </button>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.formField}>
                Name
                <input
                  className={styles.formInput}
                  value={newItem.name}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label className={styles.formField}>
                Category
                <select
                  className={styles.formSelect}
                  value={newItem.category}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, category: event.target.value as InventoryCategory }))}
                >
                  {categoryOrder.map((category) => (
                    <option key={category} value={category}>
                      {categoryMeta[category].label}
                    </option>
                  ))}
                </select>
              </label>
            <label className={styles.formField}>
              Status
              <select
                className={styles.formSelect}
                value={newItem.status}
                onChange={(event) => setNewItem((prev) => ({ ...prev, status: event.target.value as InventoryStatus }))}
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.formField}>
              Purchase date
              <input
                className={styles.formInput}
                type="date"
                value={newItem.purchase_date}
                onChange={(event) => setNewItem((prev) => ({ ...prev, purchase_date: event.target.value }))}
              />
            </label>
            <label className={styles.formField}>
              Location
              <select
                className={styles.formSelect}
                value={newItem.location_type}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, location_type: event.target.value as 'home' | 'office' }))}
                >
                  <option value="office">Office</option>
                  <option value="home">Home</option>
                </select>
              </label>
              <label className={styles.formField}>
                Assigned to
                <select
                  className={styles.formSelect}
                  value={newItem.assigned_to}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, assigned_to: event.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map((user) => (
                    <option key={user.value} value={user.value}>
                      {user.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </form>
        )}

        <div className={styles.sectionsWrapper}>
          {loading && (
            <div className={`${styles.stateCard} ${styles.loadingPulse}`}>
              Syncing the asset ledger&hellip;
            </div>
          )}

          {!loading && error && (
            <div className={`${styles.stateCard} ${styles.errorState}`}>
              {error}
              <br />
              <button type="button" onClick={fetchInventory}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && !hasVisibleItems && (
            <div className={styles.stateCard}>
              No records in this category yet. When a new asset is assigned, it will appear here automatically.
            </div>
          )}

          {!error &&
            !loading &&
            hasVisibleItems &&
            visibleCategories.map((category) => {
              const sectionItems = groupedItems[category];
              if (!sectionItems.length) {
                return null;
              }
              return (
                <section key={category} className={styles.categorySection} id={`inventory-${category}`}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      <i className={categoryMeta[category].icon} aria-hidden />
                      {categoryMeta[category].label}
                    </h2>
                    <span className={styles.sectionCount}>{sectionItems.length} items</span>
                  </div>

                  <div className={styles.tableHeader}>
                    <span>Item</span>
                    <span>Status</span>
                    <span>Age</span>
                    <span>Assigned</span>
                    <span>Location</span>
                    <span>Actions</span>
                  </div>

                  <div className={styles.cardGrid}>
                    {sectionItems.map((item) => {
                      const assignedValue = item.assigned_to ?? (item.owner ? `manual:${item.owner}` : '');
                      const ageLabel = formatAgeFromPurchase(item.purchase_date);
                      const metadata = [
                        item.department ? { label: item.department, icon: 'fa-solid fa-building' } : null,
                      ].filter(Boolean) as Array<{ label: string; icon: string }>;

                      return (
                        <article key={item.id} className={styles.inventoryCard}>
                          <div className={styles.cardRowMain}>
                            <div className={styles.cardTitleRow}>
                              <div className={styles.cardIcon}>
                                <i className={item.icon || 'fa-solid fa-box'} aria-hidden />
                              </div>
                              <div>
                                <p className={styles.cardTitle}>{item.name}</p>
                                {item.description && <p className={styles.cardBody}>{item.description}</p>}
                              </div>
                            </div>
                            <div className={`${styles.statusPill} ${statusClassMap[item.status]}`}>
                              <i className="fa-solid fa-circle" style={{ fontSize: '0.5rem' }} aria-hidden />
                              {statusLabels[item.status]}
                            </div>
                            <div className={styles.cardValue}>{ageLabel}</div>
                            <select
                              className={styles.inlineSelect}
                              value={assignedValue}
                              onChange={(event) =>
                                handleUpdate(item.id, resolveAssignment(event.target.value))
                              }
                              disabled={saving}
                              aria-label="Assigned to"
                            >
                              <option value="">Unassigned</option>
                              {assignableUsers.map((user) => (
                                <option key={user.value} value={user.value}>
                                  {user.label}
                                </option>
                              ))}
                            </select>
                            <select
                              className={styles.inlineSelect}
                              value={item.location_type ?? ''}
                              onChange={(event) =>
                                handleUpdate(item.id, { location_type: event.target.value || null })
                              }
                              disabled={saving}
                              aria-label="Location"
                            >
                              <option value="">Unspecified</option>
                              <option value="office">Office</option>
                              <option value="home">Home</option>
                            </select>
                            <div className={styles.cardActions}>
                              <button
                                type="button"
                                className={styles.editButton}
                                onClick={() => openEditModal(item)}
                                disabled={saving}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={() => handleDelete(item.id)}
                                disabled={saving}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {metadata.length > 0 && (
                            <div className={styles.metaChips}>
                              {metadata.map((chip) => (
                                <span key={`${item.id}-${chip.label}`} className={styles.metaChip}>
                                  <i className={chip.icon} aria-hidden />
                                  {chip.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>
      </div>
      {editingItem && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Edit Item</h3>
              <button type="button" className={styles.modalClose} onClick={closeEditModal}>
                ✕
              </button>
            </div>
            <form className={styles.modalBody} onSubmit={handleEditSubmit}>
              <label className={styles.formField}>
                Item name
                <input
                  className={styles.formInput}
                  value={editForm.name}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label className={styles.formField}>
                Purchase date
                <input
                  className={styles.formInput}
                  type="date"
                  value={editForm.purchase_date}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, purchase_date: event.target.value }))}
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
