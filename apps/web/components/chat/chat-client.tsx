"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChatClient({ orgId }: { orgId: string }) {
  const [messages, setMessages] = useState(0);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`chat:${orgId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `organization_id=eq.${orgId}` }, () => setMessages((value) => value + 1)).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [orgId]);
  return <section><h1 className="text-2xl font-semibold">Chat</h1><p className="mt-4 text-muted-foreground">Channels, DMs, presence-ready threads, and reactions. New message events: {messages}</p></section>;
}
