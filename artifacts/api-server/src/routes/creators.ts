import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, creatorProfilesTable, fileRecordsTable, certificatesTable, projectsTable } from "@workspace/db";

const router: IRouter = Router();

// Public creator profile page (only visible if profileIsPublic = true)
router.get("/creators/:handle", async (req, res): Promise<void> => {
  const handle = Array.isArray(req.params.handle) ? req.params.handle[0] : req.params.handle;

  const [profile] = await db
    .select()
    .from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.creatorHandle, handle));

  if (!profile) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }

  if (!(profile as any).profileIsPublic) {
    res.status(404).json({ error: "Creator profile is private" });
    return;
  }

  // Return only public-safe fields
  const publicProfile = {
    displayName: profile.displayName,
    creatorHandle: profile.creatorHandle,
    bio: profile.bio,
    websiteUrl: profile.websiteUrl,
    claimStatement: profile.claimStatement,
    memberSince: profile.createdAt,
  };

  // Fetch public files (public_verification only)
  const publicFiles = await db
    .select({
      id: fileRecordsTable.id,
      title: fileRecordsTable.title,
      fileType: fileRecordsTable.fileType,
      createdAt: fileRecordsTable.createdAt,
      projectId: fileRecordsTable.projectId,
    })
    .from(fileRecordsTable)
    .where(
      and(
        eq(fileRecordsTable.creatorProfileId, profile.id),
        eq(fileRecordsTable.privacyMode, "public_verification")
      )
    )
    .limit(20);

  // Fetch certificates for public files
  const filesWithCerts = await Promise.all(
    publicFiles.map(async (f) => {
      const [cert] = await db
        .select({ certificateId: certificatesTable.certificateId, publicUrl: certificatesTable.publicUrl })
        .from(certificatesTable)
        .where(eq(certificatesTable.fileId, f.id));

      let projectTitle: string | null = null;
      if (f.projectId) {
        const [proj] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, f.projectId));
        projectTitle = proj?.title ?? null;
      }

      return {
        id: f.id,
        title: f.title,
        fileType: f.fileType,
        createdAt: f.createdAt,
        projectTitle,
        certificateId: cert?.certificateId ?? null,
        verificationUrl: cert?.publicUrl ?? null,
      };
    })
  );

  res.json({
    profile: publicProfile,
    publicProofs: filesWithCerts,
  });
});

export default router;
