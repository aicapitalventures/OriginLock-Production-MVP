import { Router, type IRouter } from "express";
import { sql, eq, desc, count, like, or } from "drizzle-orm";
import {
  db,
  usersTable,
  fileRecordsTable,
  certificatesTable,
  verificationEventsTable,
  analyticsEventsTable,
  creatorProfilesTable,
  projectsTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [users] = await db.select({ c: count() }).from(usersTable);
  const [files] = await db.select({ c: count() }).from(fileRecordsTable);
  const [certs] = await db.select({ c: count() }).from(certificatesTable);
  const [verifs] = await db.select({ c: count() }).from(verificationEventsTable);
  const [exports] = await db
    .select({ c: count() })
    .from(analyticsEventsTable)
    .where(eq(analyticsEventsTable.eventType, "evidence_package_downloaded"));
  const [activeSubs] = await db
    .select({ c: count() })
    .from(usersTable)
    .where(eq(usersTable.subscriptionStatus, "active"));

  // Plan distribution
  const planRows = await db
    .select({
      tier: usersTable.subscriptionTier,
      c: count(),
    })
    .from(usersTable)
    .groupBy(usersTable.subscriptionTier);

  const recentSignups = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
      tier: usersTable.subscriptionTier,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(10);

  const recentFiles = await db
    .select({
      id: fileRecordsTable.id,
      title: fileRecordsTable.title,
      fileType: fileRecordsTable.fileType,
      createdAt: fileRecordsTable.createdAt,
      userId: fileRecordsTable.userId,
    })
    .from(fileRecordsTable)
    .orderBy(desc(fileRecordsTable.createdAt))
    .limit(10);

  res.json({
    totals: {
      users: Number(users.c),
      files: Number(files.c),
      certificates: Number(certs.c),
      verificationEvents: Number(verifs.c),
      evidenceExports: Number(exports.c),
      activeSubscriptions: Number(activeSubs.c),
    },
    planDistribution: planRows.map((r) => ({ tier: r.tier, count: Number(r.c) })),
    recentSignups,
    recentFiles,
  });
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const q = String(req.query.q || "").trim();

  const baseSelect = db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      tier: usersTable.subscriptionTier,
      status: usersTable.subscriptionStatus,
      isAdmin: usersTable.isAdmin,
      createdAt: usersTable.createdAt,
      handle: creatorProfilesTable.creatorHandle,
      displayName: creatorProfilesTable.displayName,
    })
    .from(usersTable)
    .leftJoin(creatorProfilesTable, eq(creatorProfilesTable.userId, usersTable.id));

  const rows = q
    ? await baseSelect
        .where(or(like(usersTable.email, `%${q}%`), like(creatorProfilesTable.creatorHandle, `%${q}%`)))
        .orderBy(desc(usersTable.createdAt))
        .limit(50)
    : await baseSelect.orderBy(desc(usersTable.createdAt)).limit(50);

  res.json(rows);
});

router.get("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, id));
  const [fileCount] = await db.select({ c: count() }).from(fileRecordsTable).where(eq(fileRecordsTable.userId, id));
  const [projectCount] = await db.select({ c: count() }).from(projectsTable).where(eq(projectsTable.userId, id));

  res.json({
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      createdAt: user.createdAt,
    },
    profile: profile
      ? {
          displayName: profile.displayName,
          creatorHandle: profile.creatorHandle,
          profileIsPublic: (profile as any).profileIsPublic ?? false,
        }
      : null,
    counts: {
      files: Number(fileCount.c),
      projects: Number(projectCount.c),
    },
  });
});

router.get("/admin/analytics", requireAdmin, async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(analyticsEventsTable)
    .orderBy(desc(analyticsEventsTable.createdAt))
    .limit(100);

  // Aggregate counts by event type (last 30 days approximation: just full count for simplicity)
  const counts = await db
    .select({
      eventType: analyticsEventsTable.eventType,
      c: count(),
    })
    .from(analyticsEventsTable)
    .groupBy(analyticsEventsTable.eventType)
    .orderBy(desc(count()));

  res.json({
    counts: counts.map((c) => ({ eventType: c.eventType, count: Number(c.c) })),
    recent: events,
  });
});

export default router;
