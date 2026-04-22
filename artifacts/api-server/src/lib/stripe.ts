// Stripe helper. Gracefully degrades when STRIPE_SECRET_KEY is missing.
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export function stripeEnabled(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");
  if (!_stripe) _stripe = new Stripe(STRIPE_SECRET_KEY);
  return _stripe;
}

export function priceIdForTier(tier: string): string | null {
  if (tier === "creator") return process.env.STRIPE_PRICE_CREATOR || null;
  if (tier === "studio") return process.env.STRIPE_PRICE_STUDIO || null;
  return null;
}
