// Transactional email helper. Gracefully degrades when RESEND_API_KEY is missing.
import { logger } from "./logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "OriginLock <noreply@originlock.app>";

export function emailEnabled(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!RESEND_API_KEY) {
    logger.info({ to: opts.to, subject: opts.subject }, "email_skipped_no_provider");
    return { sent: false, reason: "no_provider" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn({ status: res.status, text }, "email_failed");
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    logger.warn({ err }, "email_exception");
    return { sent: false, reason: "exception" };
  }
}

export function welcomeEmail(displayName: string): { subject: string; html: string } {
  return {
    subject: "Welcome to OriginLock",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 16px 0;">Welcome to OriginLock${displayName ? ", " + displayName : ""}.</h2>
        <p>Your account is ready. Three steps to your first proof record:</p>
        <ol>
          <li>Complete your creator profile</li>
          <li>Create your first project</li>
          <li>Protect a file — receive a tamper-evident certificate instantly</li>
        </ol>
        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          OriginLock provides cryptographic proof of file existence at a specific point in time.
          It is not a replacement for formal copyright registration and does not provide legal advice.
        </p>
      </div>
    `,
  };
}

export function billingConfirmationEmail(plan: string): { subject: string; html: string } {
  return {
    subject: `OriginLock — ${plan} plan active`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2>Your ${plan} subscription is active.</h2>
        <p>Thanks for supporting OriginLock. Your new plan limits are now in effect.</p>
        <p>Manage your subscription anytime from Settings → Billing.</p>
      </div>
    `,
  };
}
