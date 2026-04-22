import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { stripeEnabled, getStripe, priceIdForTier } from "../lib/stripe";
import { recordEvent } from "../lib/analytics";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/billing/status", async (_req, res): Promise<void> => {
  res.json({ stripeEnabled: stripeEnabled() });
});

router.post(
  "/billing/checkout-session",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    if (!stripeEnabled()) {
      res.status(503).json({ error: "Billing temporarily unavailable. Please try again later." });
      return;
    }
    const tier = String(req.body?.tier || "");
    const priceId = priceIdForTier(tier);
    if (!priceId) {
      res.status(400).json({ error: "Invalid plan tier" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const origin = req.headers.origin || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;

    try {
      const stripe = getStripe();
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await db.update(usersTable).set({ stripeCustomerId: customerId }).where(eq(usersTable.id, user.id));
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/billing/cancel`,
        metadata: { userId: user.id, tier },
      });

      await recordEvent("checkout_started", user.id, { tier });
      res.json({ url: session.url });
    } catch (err) {
      logger.error({ err }, "checkout_session_failed");
      res.status(500).json({ error: "Could not create checkout session" });
    }
  }
);

router.post(
  "/billing/portal-session",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    if (!stripeEnabled()) {
      res.status(503).json({ error: "Billing temporarily unavailable" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No subscription on file" });
      return;
    }
    const origin = req.headers.origin || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;
    try {
      const stripe = getStripe();
      const portal = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${origin}/dashboard/settings`,
      });
      res.json({ url: portal.url });
    } catch (err) {
      logger.error({ err }, "portal_session_failed");
      res.status(500).json({ error: "Could not open billing portal" });
    }
  }
);

export default router;
