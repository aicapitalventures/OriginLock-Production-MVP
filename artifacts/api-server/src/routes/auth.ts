import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, usersTable, creatorProfilesTable } from "@workspace/db";
import {
  SignupBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { recordEvent } from "../lib/analytics";
import { sendEmail, welcomeEmail, emailEnabled } from "../lib/email";

const router: IRouter = Router();

router.get("/auth/me", async (req, res): Promise<void> => {
  const session = (req as any).session;
  if (!session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [profile] = await db
    .select({ id: creatorProfilesTable.id })
    .from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.userId, user.id));

  res.json({
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    hasProfile: !!profile,
    isAdmin: user.isAdmin,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
  });
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      passwordHash,
    })
    .returning();

  const session = (req as any).session;
  session.userId = user.id;
  session.userEmail = user.email;

  await recordEvent("signup_completed", user.id, { email: user.email });
  if (emailEnabled()) {
    const { subject, html } = welcomeEmail("");
    sendEmail({ to: user.email, subject, html }).catch(() => {});
  }

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      hasProfile: false,
    },
    token: session.id || "session",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const [profile] = await db
    .select({ id: creatorProfilesTable.id })
    .from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.userId, user.id));

  const session = (req as any).session;
  session.userId = user.id;
  session.userEmail = user.email;

  await recordEvent("login_completed", user.id, {});

  res.json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      hasProfile: !!profile,
    },
    token: "session",
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const session = (req as any).session;
  if (session) {
    session.destroy?.(() => {});
  }
  res.json({ success: true, message: "Logged out" });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    await db
      .update(usersTable)
      .set({
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      })
      .where(eq(usersTable.id, user.id));
    req.log.info({ userId: user.id }, "Password reset token generated");
  }

  res.json({
    success: true,
    message:
      "If that email is registered, a reset link has been sent. (Email delivery not configured in MVP — token is stored in DB.)",
  });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { token, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.passwordResetToken, token));

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .update(usersTable)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    })
    .where(eq(usersTable.id, user.id));

  res.json({ success: true, message: "Password reset successfully" });
});

// Account deletion — permanently removes the user and all cascade-deleted data
router.delete(
  "/auth/account",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const session = (req as any).session;
    await db.delete(usersTable).where(eq(usersTable.id, req.userId!));
    session?.destroy?.(() => {});
    res.json({ success: true, message: "Account permanently deleted" });
  }
);

export default router;
