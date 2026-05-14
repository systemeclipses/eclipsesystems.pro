import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return json({ path: null, todo: "Generate LEDES 1998B text export from invoice and UTBMS-coded line items." });
});
