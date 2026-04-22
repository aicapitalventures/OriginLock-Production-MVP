import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationPreferencesTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { emailEnabled } from "../lib/email";

const router: IRouter = Router();

router.get(
  "/notifications/preferences",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const [pref] = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, req.userId!));
    res.json({
      emailEnabled: emailEnabled(),
      preferences: pref ?? {
        userId: req.userId,
        emailWelcome: true,
        emailBilling: true,
        emailCertGenerated: false,
      },
    });
  }
);

router.patch(
  "/notifications/preferences",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const { emailWelcome, emailBilling, emailCertGenerated } = req.body || {};
    const update: Record<string, unknown> = {};
    if (typeof emailWelcome === "boolean") update.emailWelcome = emailWelcome;
    if (typeof emailBilling === "boolean") update.emailBilling = emailBilling;
    if (typeof emailCertGenerated === "boolean") update.emailCertGenerated = emailCertGenerated;

    const [existing] = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, req.userId!));

    if (existing) {
      const [updated] = await db
        .update(notificationPreferencesTable)
        .set(update)
        .where(eq(notificationPreferencesTable.userId, req.userId!))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(notificationPreferencesTable)
        .values({ userId: req.userId!, ...update })
        .returning();
      res.json(created);
    }
  }
);

export default router;
