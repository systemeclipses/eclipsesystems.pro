export function ChatClient({ orgId }: { orgId: string }) {
  return <section><h1 className="text-2xl font-semibold">Chat</h1><p className="mt-4 text-muted-foreground">Channels, DMs, presence-ready threads, and reactions for workspace {orgId}.</p></section>;
}
