import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import multer from "multer";
import {
  db,
  fileRecordsTable,
  timestampRecordsTable,
  certificatesTable,
  creatorProfilesTable,
  projectsTable,
} from "@workspace/db";
import { UpdateFileBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import {
  generateCertificateId,
  generateVerificationToken,
  generateCertificatePdf,
} from "../lib/certificate";

const router: IRouter = Router();

const ALLOWED_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "video/mp4": "mp4",
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported: ${file.mimetype}`));
    }
  },
});

function buildFileResponse(
  f: typeof fileRecordsTable.$inferSelect,
  cert: typeof certificatesTable.$inferSelect | null,
  ts: typeof timestampRecordsTable.$inferSelect | null,
  projectTitle?: string | null
) {
  return {
    id: f.id,
    userId: f.userId,
    projectId: f.projectId,
    projectTitle: projectTitle ?? null,
    title: f.title,
    originalFilename: f.originalFilename,
    fileType: f.fileType,
    mimeType: f.mimeType,
    fileSizeBytes: f.fileSizeBytes.toString(),
    sha256Hash: f.sha256Hash,
    notes: f.notes,
    privacyMode: f.privacyMode,
    certificateId: cert?.certificateId ?? null,
    certificateStatus: cert?.status ?? null,
    verificationUrl: cert?.publicUrl ?? null,
    recordedAtUtc: ts?.recordedAtUtc ?? null,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

router.get(
  "/files",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const files = await db
      .select()
      .from(fileRecordsTable)
      .where(eq(fileRecordsTable.userId, req.userId!))
      .orderBy(desc(fileRecordsTable.createdAt));

    const result = await Promise.all(
      files.map(async (f) => {
        const [cert] = await db
          .select()
          .from(certificatesTable)
          .where(eq(certificatesTable.fileId, f.id));

        const [ts] = await db
          .select()
          .from(timestampRecordsTable)
          .where(eq(timestampRecordsTable.fileId, f.id));

        let projectTitle: string | null = null;
        if (f.projectId) {
          const [proj] = await db
            .select({ title: projectsTable.title })
            .from(projectsTable)
            .where(eq(projectsTable.id, f.projectId));
          projectTitle = proj?.title ?? null;
        }

        return buildFileResponse(f, cert ?? null, ts ?? null, projectTitle);
      })
    );

    res.json(result);
  }
);

router.post(
  "/files/upload",
  requireAuth,
  upload.single("file"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const [profile] = await db
      .select()
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.userId, req.userId!));

    if (!profile) {
      res
        .status(400)
        .json({ error: "Creator profile required before uploading files" });
      return;
    }

    const { title, notes, projectId, privacyMode } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    if (projectId) {
      const [proj] = await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(
          and(
            eq(projectsTable.id, projectId),
            eq(projectsTable.userId, req.userId!)
          )
        );
      if (!proj) {
        res.status(400).json({ error: "Project not found" });
        return;
      }
    }

    const mimeType = req.file.mimetype;
    const fileType = ALLOWED_TYPES[mimeType] || "unknown";
    const fileBuffer = req.file.buffer;

    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const recordedAtUtc = new Date();

    const [fileRecord] = await db
      .insert(fileRecordsTable)
      .values({
        userId: req.userId!,
        projectId: projectId || null,
        creatorProfileId: profile.id,
        originalFilename: req.file.originalname,
        fileType,
        mimeType,
        fileSizeBytes: BigInt(req.file.size),
        sha256Hash: hash,
        title: title.trim(),
        notes: notes || null,
        privacyMode: privacyMode || "private",
      })
      .returning();

    await db.insert(timestampRecordsTable).values({
      fileId: fileRecord.id,
      recordedAtUtc,
      providerName: "originlock-internal",
    });

    const certId = generateCertificateId();
    const token = generateVerificationToken();

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:80";

    const verificationUrl = `${baseUrl}/verify/${certId}`;

    let projectTitle: string | null = null;
    if (projectId) {
      const [proj] = await db
        .select({ title: projectsTable.title })
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId));
      projectTitle = proj?.title ?? null;
    }

    let pdfData: string | null = null;
    try {
      const pdfBuffer = await generateCertificatePdf({
        certificateId: certId,
        status: "valid",
        displayName: profile.displayName,
        creatorHandle: profile.creatorHandle,
        projectTitle,
        fileTitle: fileRecord.title,
        originalFilename: fileRecord.originalFilename,
        fileType: fileRecord.fileType,
        fileSizeBytes: fileRecord.fileSizeBytes,
        sha256Hash: hash,
        recordedAtUtc,
        verificationUrl,
      });
      pdfData = pdfBuffer.toString("base64");
    } catch (err) {
      req.log.error({ err }, "Failed to generate PDF");
    }

    await db.insert(certificatesTable).values({
      fileId: fileRecord.id,
      certificateId: certId,
      status: "valid",
      verificationToken: token,
      publicUrl: verificationUrl,
      pdfData,
    });

    res.status(201).json({
      fileId: fileRecord.id,
      certificateId: certId,
      verificationUrl,
      sha256Hash: hash,
      recordedAtUtc,
    });
  }
);

router.get(
  "/files/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const [f] = await db
      .select()
      .from(fileRecordsTable)
      .where(
        and(
          eq(fileRecordsTable.id, rawId),
          eq(fileRecordsTable.userId, req.userId!)
        )
      );

    if (!f) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const [cert] = await db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.fileId, rawId));

    const [ts] = await db
      .select()
      .from(timestampRecordsTable)
      .where(eq(timestampRecordsTable.fileId, rawId));

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

    res.json({
      id: f.id,
      userId: f.userId,
      projectId: f.projectId,
      projectTitle,
      creatorProfileId: f.creatorProfileId,
      displayName: profile?.displayName ?? "",
      creatorHandle: profile?.creatorHandle ?? "",
      title: f.title,
      originalFilename: f.originalFilename,
      fileType: f.fileType,
      mimeType: f.mimeType,
      fileSizeBytes: f.fileSizeBytes.toString(),
      sha256Hash: f.sha256Hash,
      notes: f.notes,
      privacyMode: f.privacyMode,
      certificateId: cert?.certificateId ?? null,
      certificateStatus: cert?.status ?? null,
      verificationUrl: cert?.publicUrl ?? null,
      recordedAtUtc: ts?.recordedAtUtc ?? null,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    });
  }
);

router.patch(
  "/files/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const parsed = UpdateFileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(fileRecordsTable)
      .where(
        and(
          eq(fileRecordsTable.id, rawId),
          eq(fileRecordsTable.userId, req.userId!)
        )
      );

    if (!existing) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const [f] = await db
      .update(fileRecordsTable)
      .set(parsed.data)
      .where(eq(fileRecordsTable.id, rawId))
      .returning();

    const [cert] = await db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.fileId, rawId));

    const [ts] = await db
      .select()
      .from(timestampRecordsTable)
      .where(eq(timestampRecordsTable.fileId, rawId));

    let projectTitle: string | null = null;
    if (f.projectId) {
      const [proj] = await db
        .select({ title: projectsTable.title })
        .from(projectsTable)
        .where(eq(projectsTable.id, f.projectId));
      projectTitle = proj?.title ?? null;
    }

    res.json(buildFileResponse(f, cert ?? null, ts ?? null, projectTitle));
  }
);

router.get(
  "/files/:id/certificate/download",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const [f] = await db
      .select()
      .from(fileRecordsTable)
      .where(
        and(
          eq(fileRecordsTable.id, rawId),
          eq(fileRecordsTable.userId, req.userId!)
        )
      );

    if (!f) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const [cert] = await db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.fileId, rawId));

    if (!cert) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    if (cert.pdfData) {
      const pdfBuffer = Buffer.from(cert.pdfData, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="certificate-${cert.certificateId}.pdf"`
      );
      res.send(pdfBuffer);
      return;
    }

    const [profile] = await db
      .select()
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.id, f.creatorProfileId));

    const [ts] = await db
      .select()
      .from(timestampRecordsTable)
      .where(eq(timestampRecordsTable.fileId, rawId));

    let projectTitle: string | null = null;
    if (f.projectId) {
      const [proj] = await db
        .select({ title: projectsTable.title })
        .from(projectsTable)
        .where(eq(projectsTable.id, f.projectId));
      projectTitle = proj?.title ?? null;
    }

    const pdfBuffer = await generateCertificatePdf({
      certificateId: cert.certificateId,
      status: cert.status,
      displayName: profile?.displayName ?? "",
      creatorHandle: profile?.creatorHandle ?? "",
      projectTitle,
      fileTitle: f.title,
      originalFilename: f.originalFilename,
      fileType: f.fileType,
      fileSizeBytes: f.fileSizeBytes,
      sha256Hash: f.sha256Hash,
      recordedAtUtc: ts?.recordedAtUtc ?? new Date(),
      verificationUrl: cert.publicUrl,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${cert.certificateId}.pdf"`
    );
    res.send(pdfBuffer);
  }
);

export default router;
