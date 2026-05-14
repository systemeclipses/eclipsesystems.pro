import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authHeader = req.headers.get("authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { authorization: authHeader } } });
  const { organization_id, email, role, manager_id } = await req.json();
  const { data: allowed } = await supabase.rpc("has_org_role", { org_id: organization_id, required: "admin" });
  if (!allowed) return json({ error: "forbidden" }, 403);
  const { data, error } = await supabase.from("invitations").insert({ organization_id, email, role, manager_id }).select("token").single();
  if (error) return json({ error: error.message }, 400);
  // TODO: send invitation email through Resend; do not log recipient PII.
  return json({ token: data.token });
});
