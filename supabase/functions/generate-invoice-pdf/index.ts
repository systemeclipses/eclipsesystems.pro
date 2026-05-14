import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return json({ path: null, todo: "Render invoice HTML to PDF and upload to private Supabase Storage." });
});
