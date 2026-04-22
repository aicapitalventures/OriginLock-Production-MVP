import { Router, type IRouter } from "express";
import { recordEvent } from "../lib/analytics";

const router: IRouter = Router();

const ALLOWED_EVENTS = new Set([
  "signup_started",
  "pricing_viewed",
  "upgrade_prompt_shown",
  "public_profile_viewed",
  "first_project_created",
  "first_file_protected",
]);

router.post("/analytics/event", async (req, res): Promise<void> => {
  const eventType = String(req.body?.eventType || "");
  if (!ALLOWED_EVENTS.has(eventType)) {
    res.status(400).json({ error: "Unknown event type" });
    return;
  }
  const session = (req as any).session;
  const userId = session?.userId ?? null;
  const properties = typeof req.body?.properties === "object" ? req.body.properties : {};
  await recordEvent(eventType, userId, properties);
  res.json({ ok: true });
});

export default router;
