import { NextResponse } from 'next/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { supaServer } from '@/lib/supabase/server';
import { hasGf1Access, resolveProfileRole } from '@/lib/gf1/auth';

export async function GET(request: Request) {
  const supabase = await supaServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = await resolveProfileRole(user);
  if (!hasGf1Access(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = supaAdmin();
  try {
    const url = new URL(request.url);
    const debug = url.searchParams.get('debug') === '1';

    // detect which columns exist on profiles so selects don't fail
    const { data: colsData, error: colsErr } = await admin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    const columns = Array.isArray(colsData) ? colsData.map((r: any) => r.column_name) : [];
    const hasColumnMetadata = columns.length > 0;
    const selectColumns = ['user_id', 'email', 'role'];
    const optionalColumns = ['first_name', 'last_name', 'display_name', 'name', 'full_name'] as const;
    optionalColumns.forEach((column) => {
      if (columns.includes(column)) selectColumns.push(column);
    });
    const selectArg = hasColumnMetadata ? selectColumns.join(', ') : '*';

    if (debug) {
      try {
        const debugCols = hasColumnMetadata ? selectColumns : ['user_id', 'email', 'role'];
        const { data, error } = await admin.from('profiles').select(debugCols.join(', '));
        if (error) {
          console.error('Failed to load profiles (debug)', error);
          return NextResponse.json({ error: 'Failed to load profiles', details: error, columns }, { status: 500 });
        }
        return NextResponse.json({ columns, rows: data ?? [] });
      } catch (err) {
        console.error('Debug profiles query error', err);
        return NextResponse.json({ error: 'Debug query failed', details: String(err), columns }, { status: 500 });
      }
    }

    // Load profiles once and filter admins in code to avoid case-sensitivity pitfalls.
    const baseQuery = admin.from('profiles').select(selectArg);
    const { data: profiles, error: profilesErr } = await baseQuery;

    if (profilesErr) {
      console.error('Failed to load profiles', profilesErr);
      return NextResponse.json({ error: 'Failed to load admin users' }, { status: 500 });
    }

    const admins = (profiles ?? [])
      .filter((row: any) => {
        const roleValue = typeof row.role === 'string' ? row.role : null;
        return roleValue ? roleValue.toLowerCase().includes('admin') : false;
      })
      .map((row: any) => {
        const trimmedFirst = typeof row.first_name === 'string' ? row.first_name.trim() : '';
        const trimmedLast = typeof row.last_name === 'string' ? row.last_name.trim() : '';
        const preferredName = typeof row.name === 'string' ? row.name.trim() : '';
        const displayNameFromColumn = typeof row.display_name === 'string' ? row.display_name.trim() : '';
        const fullName = typeof row.full_name === 'string' ? row.full_name.trim() : '';
        const email = typeof row.email === 'string' ? row.email : null;
        const displayName = preferredName
          ? preferredName
          : displayNameFromColumn
            ? displayNameFromColumn
            : (trimmedFirst || trimmedLast)
              ? [trimmedFirst, trimmedLast].filter(Boolean).join(' ').trim()
              : fullName || email || '';

        return {
          user_id: row.user_id,
          first_name: trimmedFirst || null,
          last_name: trimmedLast || null,
          full_name: fullName || null,
          name: preferredName || null,
          display_name: displayName || null,
          email,
          role: row.role ?? null,
        };
      })
      // ensure we only return admins that have a usable email and id
      .filter((row: any) => row && row.user_id && row.email)
      .sort((a: any, b: any) => {
        const aName = (a.display_name || a.email || '').toLowerCase();
        const bName = (b.display_name || b.email || '').toLowerCase();
        return aName.localeCompare(bName);
      });

    return NextResponse.json(admins);
  } catch (err) {
    console.error('admin-users GET error', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
