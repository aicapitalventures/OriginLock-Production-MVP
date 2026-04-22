import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const creatorProfilesTable = pgTable("creator_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  creatorHandle: text("creator_handle").notNull().unique(),
  legalName: text("legal_name"),
  pseudonym: text("pseudonym"),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  claimStatement: text("claim_statement"),
  // Public profile: when true, the profile is visible on /creators/:handle
  profileIsPublic: boolean("profile_is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertCreatorProfileSchema = createInsertSchema(
  creatorProfilesTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCreatorProfile = z.infer<typeof insertCreatorProfileSchema>;
export type CreatorProfile = typeof creatorProfilesTable.$inferSelect;
