"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ShiftsClient({ orgId }: { orgId: string }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`shifts:${orgId}`).on("postgres_changes", { event: "*", schema: "public", table: "shift_marketplace_posts", filter: `organization_id=eq.${orgId}` }, () => setPulse((value) => value + 1)).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [orgId]);
  return <section><h1 className="text-2xl font-semibold">Shifts</h1><p className="mt-4 text-muted-foreground">Calendar, schedule editor, my shifts, marketplace, and swaps. Live updates: {pulse}</p></section>;
}
