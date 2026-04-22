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

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;
          if (userId && tier) {
            await db.update(usersTable).set({
              subscriptionTier: tier,
              subscriptionStatus: "active",
              stripeSubscriptionId: session.subscription,
              stripeCustomerId: session.customer,
            }).where(eq(usersTable.id, userId));
            await recordEvent("checkout_completed", userId, { tier });
            const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
            if (user && emailEnabled()) {
              const { subject, html } = billingConfirmationEmail(tier);
              await sendEmail({ to: user.email, subject, html });
            }
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as any;
          const customerId = sub.customer;
          const status = sub.status;
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

          // Map price id -> tier
          const priceId = sub.items?.data?.[0]?.price?.id;
          let tier: string | null = null;
          if (priceId === process.env.STRIPE_PRICE_CREATOR) tier = "creator";
          else if (priceId === process.env.STRIPE_PRICE_STUDIO) tier = "studio";

          const update: Record<string, unknown> = {
            subscriptionStatus: status,
            subscriptionCurrentPeriodEnd: periodEnd,
          };
          if (event.type === "customer.subscription.deleted" || status === "canceled") {
            update.subscriptionTier = "free";
            update.stripeSubscriptionId = null;
          } else if (tier) {
            update.subscriptionTier = tier;
          }
          await db.update(usersTable).set(update).where(eq(usersTable.stripeCustomerId, customerId));
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
