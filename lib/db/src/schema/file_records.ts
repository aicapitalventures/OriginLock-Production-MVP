import {
  pgTable,
  text,
  timestamp,
  uuid,
  bigint,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { creatorProfilesTable } from "./creator_profiles";
import { projectsTable } from "./projects";

export const privacyModeEnum = pgEnum("privacy_mode", [
  "private",
  "shareable_certificate",
  "public_verification",
]);

export const fileRecordsTable = pgTable("file_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projectsTable.id, {
    onDelete: "set null",
  }),
  creatorProfileId: uuid("creator_profile_id")
    .notNull()
    .references(() => creatorProfilesTable.id, { onDelete: "cascade" }),
  // Version chain: optional reference to the prior version of this asset
  parentFileId: uuid("parent_file_id"),
  originalFilename: text("original_filename").notNull(),
  storedFilename: text("stored_filename"),
  fileType: text("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "bigint" }).notNull(),
  sha256Hash: text("sha256_hash").notNull(),
  storagePath: text("storage_path"),
  title: text("title").notNull(),
  notes: text("notes"),
  privacyMode: privacyModeEnum("privacy_mode").notNull().default("private"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertFileRecordSchema = createInsertSchema(fileRecordsTable).omit(
  {
    id: true,
    createdAt: true,
    updatedAt: true,
  }
);
export type InsertFileRecord = z.infer<typeof insertFileRecordSchema>;
export type FileRecord = typeof fileRecordsTable.$inferSelect;
