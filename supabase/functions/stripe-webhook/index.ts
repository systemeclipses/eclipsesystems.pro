import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });
const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function fromUnix(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch {
    return json({ error: "invalid signature" }, 400);
  }

  const inserted = await service.from("stripe_events").insert({ id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> });
  if (inserted.error?.code === "23505") return json({ received: true, duplicate: true });

  try {
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const item = subscription.items.data[0];
      const organization_id = subscription.metadata.organization_id
        ?? (await service.from("organizations").select("id").eq("stripe_customer_id", subscription.customer as string).single()).data?.id;
      const plan = subscription.metadata.plan_code ?? item.price.metadata.plan_code;
      const interval = item.price.recurring?.interval === "year" ? "year" : "month";
      await service.from("subscriptions").upsert({
        organization_id,
        plan,
        billing_interval: interval,
        status: subscription.status,
        stripe_subscription_id: subscription.id,
        stripe_price_id: item.price.id,
        seats: item.quantity ?? 1,
        current_period_start: fromUnix(subscription.current_period_start),
        current_period_end: fromUnix(subscription.current_period_end),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: fromUnix(subscription.canceled_at),
        trial_start: fromUnix(subscription.trial_start),
        trial_end: fromUnix(subscription.trial_end)
      }, { onConflict: "stripe_subscription_id" });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await service.from("subscriptions").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("stripe_subscription_id", subscription.id);
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.id) {
        const { data: internal } = await service.from("invoices").select("id").eq("stripe_invoice_id", invoice.id).maybeSingle();
        if (internal) {
          await service.from("invoice_payments").upsert({
            invoice_id: internal.id,
            amount: ((invoice.amount_paid ?? 0) / 100).toFixed(2),
            method: "stripe",
            stripe_payment_intent_id: invoice.payment_intent as string
          }, { onConflict: "stripe_payment_intent_id" });
        }
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (subscriptionId) await service.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", subscriptionId);
    }

    if (event.type === "payment_method.attached") {
      const method = event.data.object as Stripe.PaymentMethod;
      const customerId = method.customer as string;
      const { data: org } = await service.from("organizations").select("id").eq("stripe_customer_id", customerId).maybeSingle();
      if (org && method.card) {
        await service.from("payment_methods").upsert({
          organization_id: org.id,
          stripe_payment_method_id: method.id,
          brand: method.card.brand,
          last4: method.card.last4,
          exp_month: method.card.exp_month,
          exp_year: method.card.exp_year
        }, { onConflict: "stripe_payment_method_id" });
      }
    }

    if (event.type === "payment_method.detached") {
      const method = event.data.object as Stripe.PaymentMethod;
      await service.from("payment_methods").delete().eq("stripe_payment_method_id", method.id);
    }

    if (event.type === "customer.subscription.trial_will_end") {
      // TODO: send a trial-ending transactional email through Resend without logging PII.
    }

    await service.from("stripe_events").update({ processed_at: new Date().toISOString(), error: null }).eq("id", event.id);
    return json({ received: true });
  } catch (error) {
    await service.from("stripe_events").update({ error: error instanceof Error ? error.message : "unknown error" }).eq("id", event.id);
    return json({ error: "processing failed" }, 500);
  }
});
