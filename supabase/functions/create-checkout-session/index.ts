import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authHeader = req.headers.get("authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { authorization: authHeader } } });
  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { organization_id, plan_code, billing_interval, seats } = await req.json();

  const { data: allowed } = await supabase.rpc("has_org_role", { org_id: organization_id, required: "admin" });
  if (!allowed) return json({ error: "forbidden" }, 403);

  const { data: org } = await service.from("organizations").select("id,kind,owner_id,stripe_customer_id,profiles!organizations_owner_id_fkey(email)").eq("id", organization_id).single();
  const normalizedSeats = org.kind === "personal" ? 1 : Math.max(2, Number(seats));
  if (org.kind === "personal" && Number(seats) !== 1) return json({ error: "personal organizations have exactly one seat" }, 400);

  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.profiles?.email,
      metadata: { organization_id }
    });
    customerId = customer.id;
    await service.from("organizations").update({ stripe_customer_id: customerId }).eq("id", organization_id);
  }

  const { data: plan } = await service.from("plans").select("stripe_monthly_price_id,stripe_annual_price_id").eq("code", plan_code).single();
  const price = billing_interval === "year" ? plan.stripe_annual_price_id : plan.stripe_monthly_price_id;
  if (!price?.startsWith("price_")) return json({ error: "Stripe price ID is not configured" }, 400);

  const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: normalizedSeats }],
    subscription_data: { trial_period_days: 14, metadata: { organization_id, plan_code } },
    success_url: `${siteUrl}/settings/billing?checkout=success`,
    cancel_url: `${siteUrl}/settings/billing?checkout=cancel`
  });

  return json({ url: session.url });
});
