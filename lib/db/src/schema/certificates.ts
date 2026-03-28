import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { fileRecordsTable } from "./file_records";

export const certificateStatusEnum = pgEnum("certificate_status", [
  "valid",
  "revoked",
  "superseded",
]);

export const certificatesTable = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileId: uuid("file_id")
    .notNull()
    .unique()
    .references(() => fileRecordsTable.id, { onDelete: "cascade" }),
  certificateId: text("certificate_id").notNull().unique(),
  status: certificateStatusEnum("status").notNull().default("valid"),
  verificationToken: text("verification_token").notNull().unique(),
  publicUrl: text("public_url").notNull(),
  pdfData: text("pdf_data"),
  qrCodeData: text("qr_code_data"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertCertificateSchema = createInsertSchema(
  certificatesTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificatesTable.$inferSelect;
