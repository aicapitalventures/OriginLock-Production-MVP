import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { certificatesTable } from "./certificates";

export const verificationResultEnum = pgEnum("verification_result", [
  "match",
  "mismatch",
  "not_found",
  "invalid",
]);

export const verificationEventsTable = pgTable("verification_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  certificateDbId: uuid("certificate_db_id")
    .notNull()
    .references(() => certificatesTable.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  submittedHash: text("submitted_hash"),
  result: verificationResultEnum("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVerificationEventSchema = createInsertSchema(
  verificationEventsTable
).omit({
  id: true,
  createdAt: true,
});
export type InsertVerificationEvent = z.infer<
  typeof insertVerificationEventSchema
>;
export type VerificationEvent = typeof verificationEventsTable.$inferSelect;
