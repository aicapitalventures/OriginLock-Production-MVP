import { Router, type IRouter, raw } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { stripeEnabled, getStripe, STRIPE_WEBHOOK_SECRET } from "../lib/stripe";
import { recordEvent } from "../lib/analytics";
import { sendEmail, billingConfirmationEmail, emailEnabled } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Stripe webhook needs raw body
router.post(
  "/webhooks/stripe",
  raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    if (!stripeEnabled()) {
      res.status(503).json({ error: "Webhooks disabled" });
      return;
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      logger.error("webhook_secret_missing — refusing unsigned webhook");
      res.status(503).json({ error: "Webhook secret not configured" });
      return;
    }
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig) {
      res.status(400).send("Missing signature");
      return;
    }
    let event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.error({ err }, "webhook_signature_failed");
      res.status(400).send("Invalid signature");
      return;
    }

    // Normalize raw Stripe subscription status to our compact UI contract.
    // We expose: active | past_due | canceled | unpaid | incomplete
    const normalizeStatus = (s: string | undefined | null): string => {
      switch (s) {
        case "active":
        case "trialing":
          return "active";
        case "past_due":
          return "past_due";
        case "canceled":
        case "incomplete_expired":
          return "canceled";
        case "unpaid":
          return "unpaid";
        case "incomplete":
        case "paused":
          return "incomplete";
        default:
          return s || "incomplete";
      }
    };

    const tierFromPriceId = (priceId: string | undefined): "creator" | "studio" | null => {
      if (!priceId) return null;
      if (priceId === process.env.STRIPE_PRICE_CREATOR) return "creator";
      if (priceId === process.env.STRIPE_PRICE_STUDIO) return "studio";
      return null;
    };

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          // Confirmation/email + link customer/subscription IDs ONLY.
          // Tier + status are owned by customer.subscription.* events to avoid race conditions.
          const session = event.data.object as any;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;
          if (userId) {
            await db.update(usersTable).set({
              stripeSubscriptionId: session.subscription || null,
              stripeCustomerId: session.customer,
            }).where(eq(usersTable.id, userId));
            await recordEvent("checkout_completed", userId, { tier });
            const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
            if (user && emailEnabled() && tier) {
              const { subject, html } = billingConfirmationEmail(tier);
              await sendEmail({ to: user.email, subject, html });
            }
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          // Authoritative source of tier + status. Always derives from the
          // current subscription object, so out-of-order delivery is safe
          // (the latest event always reflects current state).
          const sub = event.data.object as any;
          const customerId = sub.customer;
          if (!customerId) break;
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

          const tier = tierFromPriceId(sub.items?.data?.[0]?.price?.id);
          const normalized = normalizeStatus(sub.status);

          const update: Record<string, unknown> = {
            subscriptionStatus: normalized,
            subscriptionCurrentPeriodEnd: periodEnd,
          };
          if (event.type === "customer.subscription.deleted" || normalized === "canceled") {
            update.subscriptionTier = "free";
            update.stripeSubscriptionId = null;
          } else if (tier) {
            update.subscriptionTier = tier;
            update.stripeSubscriptionId = sub.id;
          }
          await db.update(usersTable).set(update).where(eq(usersTable.stripeCustomerId, customerId));
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as any;
          const customerId = invoice.customer;
          if (customerId) {
            await db
              .update(usersTable)
              .set({ subscriptionStatus: "active" })
              .where(eq(usersTable.stripeCustomerId, customerId));
            const [u] = await db
              .select({ id: usersTable.id })
              .from(usersTable)
              .where(eq(usersTable.stripeCustomerId, customerId));
            if (u) await recordEvent("invoice_paid", u.id, { amount: invoice.amount_paid });
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          const customerId = invoice.customer;
          if (customerId) {
            await db
              .update(usersTable)
              .set({ subscriptionStatus: "past_due" })
              .where(eq(usersTable.stripeCustomerId, customerId));
            const [u] = await db
              .select({ id: usersTable.id })
              .from(usersTable)
              .where(eq(usersTable.stripeCustomerId, customerId));
            if (u) await recordEvent("invoice_failed", u.id, { amount: invoice.amount_due });
          }
          break;
        }
      }
      res.json({ received: true });
    } catch (err) {
      logger.error({ err, type: event.type }, "webhook_handler_failed");
      res.status(500).json({ error: "Handler error" });
    }
  }
);

export default router;
