import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authHeader = req.headers.get("authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { authorization: authHeader } } });
  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { organization_id } = await req.json();
  const { data: allowed } = await supabase.rpc("has_org_role", { org_id: organization_id, required: "admin" });
  if (!allowed) return json({ error: "forbidden" }, 403);
  const { data: org } = await service.from("organizations").select("stripe_customer_id").eq("id", organization_id).single();
  if (!org.stripe_customer_id) return json({ error: "missing customer" }, 400);
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"}/settings/billing`
  });
  return json({ url: session.url });
});
