import { getActiveOrgId } from "@/lib/org";
import { requireFeature } from "@/lib/plan-features";
import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "chat");
  return <ChatClient orgId={orgId} />;
}
