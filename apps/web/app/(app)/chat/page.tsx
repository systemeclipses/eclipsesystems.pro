import { getActiveOrgId } from "@/lib/org";
import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const orgId = await getActiveOrgId();
  return <ChatClient orgId={orgId} />;
}
