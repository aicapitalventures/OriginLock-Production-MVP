import { db, analyticsEventsTable } from "@workspace/db";
import { logger } from "./logger";

export async function recordEvent(
  eventType: string,
  userId: string | null,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    await db.insert(analyticsEventsTable).values({
      eventType,
      userId,
      properties: properties as any,
    });
  } catch (err) {
    logger.warn({ err, eventType }, "Failed to record analytics event");
  }
}
