import Stripe from "stripe";
import { PLAN_NAMES, PLAN_PRICES } from "@eclipsesystems/shared/plans";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia"
});

for (const [code, price] of Object.entries(PLAN_PRICES)) {
  const product = await stripe.products.create({
    name: `${PLAN_NAMES[code as keyof typeof PLAN_NAMES]} Seat`,
    metadata: { plan_code: code }
  });

  const monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: price.monthlyCents,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan_code: code, billing_interval: "month" }
  });

  const annual = await stripe.prices.create({
    product: product.id,
    unit_amount: price.annualCents,
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { plan_code: code, billing_interval: "year" }
  });

  const envName = code.toUpperCase();
  console.log(`STRIPE_PRICE_${envName}_MONTHLY=${monthly.id}`);
  console.log(`STRIPE_PRICE_${envName}_ANNUAL=${annual.id}`);
}
