import { eq, sql, count } from "drizzle-orm";
import { db, usersTable, fileRecordsTable, projectsTable } from "@workspace/db";
import { getPlan, type PlanLimits, isUnlimited } from "./plans";

export interface UsageSnapshot {
  plan: PlanLimits;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  files: { used: number; limit: number };
  projects: { used: number; limit: number };
}

export async function getUserUsage(userId: string): Promise<UsageSnapshot> {
  const [user] = await db
    .select({
      tier: usersTable.subscriptionTier,
      status: usersTable.subscriptionStatus,
      end: usersTable.subscriptionCurrentPeriodEnd,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const plan = getPlan(user?.tier);

  const [fileCountRow] = await db
    .select({ c: count() })
    .from(fileRecordsTable)
    .where(eq(fileRecordsTable.userId, userId));

  const [projectCountRow] = await db
    .select({ c: count() })
    .from(projectsTable)
    .where(eq(projectsTable.userId, userId));

  return {
    plan,
    subscriptionStatus: user?.status ?? null,
    subscriptionCurrentPeriodEnd: user?.end?.toISOString() ?? null,
    files: { used: Number(fileCountRow?.c ?? 0), limit: plan.maxFiles },
    projects: { used: Number(projectCountRow?.c ?? 0), limit: plan.maxProjects },
  };
}

export function checkLimit(used: number, limit: number): boolean {
  if (isUnlimited(limit)) return true;
  return used < limit;
}
