import { pgTable, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const notificationPreferencesTable = pgTable("notification_preferences", {
  userId: uuid("user_id").primaryKey(),
  emailWelcome: boolean("email_welcome").notNull().default(true),
  emailBilling: boolean("email_billing").notNull().default(true),
  emailCertGenerated: boolean("email_cert_generated").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;
