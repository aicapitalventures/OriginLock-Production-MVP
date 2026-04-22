import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  creatorProfilesTable,
  projectsTable,
  fileRecordsTable,
  certificatesTable,
  timestampRecordsTable,
  verificationEventsTable,
} from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/export/account",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, req.userId!));
    const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, req.userId!));
    const files = await db.select().from(fileRecordsTable).where(eq(fileRecordsTable.userId, req.userId!));

    const fileIds = files.map((f) => f.id);
    let certs: any[] = [];
    let timestamps: any[] = [];
    let verifEvents: any[] = [];
    if (fileIds.length > 0) {
      for (const fid of fileIds) {
        const [c] = await db.select().from(certificatesTable).where(eq(certificatesTable.fileId, fid));
        if (c) certs.push({ ...c, pdfData: undefined });
        const [t] = await db.select().from(timestampRecordsTable).where(eq(timestampRecordsTable.fileId, fid));
        if (t) timestamps.push(t);
      }
      // Verification events for this user's certificates
      const certIds = certs.map((c) => c.id);
      for (const cid of certIds) {
        const events = await db.select().from(verificationEventsTable).where(eq(verificationEventsTable.certificateId, cid));
        verifEvents = verifEvents.concat(events);
      }
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      account: user
        ? {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
            subscriptionTier: user.subscriptionTier,
          }
        : null,
      profile: profile
        ? {
            displayName: profile.displayName,
            creatorHandle: profile.creatorHandle,
            bio: profile.bio,
            websiteUrl: profile.websiteUrl,
            claimStatement: profile.claimStatement,
            profileIsPublic: (profile as any).profileIsPublic ?? false,
            createdAt: profile.createdAt,
          }
        : null,
      projects,
      files: files.map((f) => ({ ...f, fileSizeBytes: f.fileSizeBytes.toString() })),
      certificates: certs,
      timestamps,
      verificationEvents: verifEvents,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="originlock_export_${req.userId}.json"`);
    res.send(JSON.stringify(payload, null, 2));
  }
);

export default router;
