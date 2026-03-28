import {
  pgTable,
  text,
  timestamp,
  uuid,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { fileRecordsTable } from "./file_records";

export const timestampRecordsTable = pgTable("timestamp_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileId: uuid("file_id")
    .notNull()
    .unique()
    .references(() => fileRecordsTable.id, { onDelete: "cascade" }),
  recordedAtUtc: timestamp("recorded_at_utc", { withTimezone: true }).notNull(),
  providerName: text("provider_name"),
  providerReference: text("provider_reference"),
  providerPayload: json("provider_payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTimestampRecordSchema = createInsertSchema(
  timestampRecordsTable
).omit({
  id: true,
  createdAt: true,
});
export type InsertTimestampRecord = z.infer<typeof insertTimestampRecordSchema>;
export type TimestampRecord = typeof timestampRecordsTable.$inferSelect;
