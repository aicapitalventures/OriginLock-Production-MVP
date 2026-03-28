import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  certificatesTable,
  fileRecordsTable,
  timestampRecordsTable,
  creatorProfilesTable,
  projectsTable,
  verificationEventsTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get(
  "/verify/:certificateId",
  async (req, res): Promise<void> => {
    const rawId = Array.isArray(req.params.certificateId)
      ? req.params.certificateId[0]
      : req.params.certificateId;

    const submittedHash = req.query.submittedHash as string | undefined;

    const [cert] = await db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.certificateId, rawId));

    if (!cert) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    const [f] = await db
      .select()
      .from(fileRecordsTable)
      .where(eq(fileRecordsTable.id, cert.fileId));

    const [ts] = await db
      .select()
      .from(timestampRecordsTable)
      .where(eq(timestampRecordsTable.fileId, cert.fileId));

    const [profile] = await db
      .select()
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.id, f.creatorProfileId));

    let projectTitle: string | null = null;
    if (f.projectId) {
      const [proj] = await db
        .select({ title: projectsTable.title })
        .from(projectsTable)
        .where(eq(projectsTable.id, f.projectId));
      projectTitle = proj?.title ?? null;
    }

    let hashMatchResult: "match" | "mismatch" | null = null;

    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    if (submittedHash) {
      const normalizedSubmitted = submittedHash.toLowerCase().trim();
      const normalizedStored = f.sha256Hash.toLowerCase().trim();
      hashMatchResult =
        normalizedSubmitted === normalizedStored ? "match" : "mismatch";

      await db.insert(verificationEventsTable).values({
        certificateDbId: cert.id,
        eventType: "hash_comparison",
        ipAddress,
        userAgent,
        submittedHash: submittedHash,
        result: hashMatchResult,
      });
    } else {
      await db.insert(verificationEventsTable).values({
        certificateDbId: cert.id,
        eventType: "page_view",
        ipAddress,
        userAgent,
        result: cert.status === "valid" ? "match" : "invalid",
      });
    }

    res.json({
      certificateId: cert.certificateId,
      status: cert.status,
      displayName: profile?.displayName ?? "",
      creatorHandle: profile?.creatorHandle ?? "",
      projectTitle,
      fileTitle: f.title,
      originalFilename: f.originalFilename,
      fileType: f.fileType,
      mimeType: f.mimeType,
      fileSizeBytes: f.fileSizeBytes.toString(),
      sha256Hash: f.sha256Hash,
      recordedAtUtc: ts?.recordedAtUtc ?? f.createdAt,
      hashMatchResult,
    });
  }
);

export default router;
