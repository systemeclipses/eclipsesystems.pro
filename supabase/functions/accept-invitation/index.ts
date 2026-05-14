import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authHeader = req.headers.get("authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { authorization: authHeader } } });
  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { token } = await req.json();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  const { data: invitation } = await service.rpc("get_invitation_by_token", { invitation_token: token });
  if (!invitation || invitation.email.toLowerCase() !== user.email?.toLowerCase()) return json({ error: "invalid invitation" }, 400);
  await service.from("memberships").insert({ organization_id: invitation.organization_id, user_id: user.id, role: invitation.role, manager_id: invitation.manager_id, invited_at: invitation.created_at, accepted_at: new Date().toISOString(), status: "active" });
  await service.from("invitations").update({ status: "accepted", accepted_by: user.id, accepted_at: new Date().toISOString() }).eq("id", invitation.id);
  await service.from("profiles").update({ default_organization_id: invitation.organization_id }).eq("id", user.id);
  return json({ accepted: true });
});
