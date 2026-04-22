import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import multer from "multer";
import archiver from "archiver";
import {
  db,
  fileRecordsTable,
  timestampRecordsTable,
  certificatesTable,
  creatorProfilesTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { UpdateFileBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import {
  generateCertificateId,
  generateVerificationToken,
  generateCertificatePdf,
} from "../lib/certificate";
import { getUserUsage, checkLimit } from "../lib/usage";
import { recordEvent } from "../lib/analytics";
import { getPlan } from "../lib/plans";

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

    // Plan enforcement: file count + size
    const usage = await getUserUsage(req.userId!);
    if (!checkLimit(usage.files.used, usage.files.limit)) {
      res.status(402).json({
        error: "PLAN_LIMIT_REACHED",
        scope: "files",
        message: `Your ${usage.plan.name} plan allows ${usage.files.limit} files. Upgrade to add more.`,
        plan: usage.plan,
      });
      return;
    }
    const sizeMb = req.file.size / (1024 * 1024);
    if (sizeMb > usage.plan.maxFileSizeMb) {
      res.status(402).json({
        error: "PLAN_FILE_SIZE_EXCEEDED",
        scope: "fileSize",
        message: `Your ${usage.plan.name} plan allows files up to ${usage.plan.maxFileSizeMb}MB. This file is ${sizeMb.toFixed(1)}MB.`,
        plan: usage.plan,
      });
      return;
    }

    const { title, notes, projectId, privacyMode, parentFileId } = req.body;

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

    // Version chain feature gating
    if (parentFileId && !usage.plan.versionChainEnabled) {
      res.status(402).json({
        error: "PLAN_FEATURE_LOCKED",
        scope: "versionChain",
        message: `Version chains require the Creator plan or higher.`,
        plan: usage.plan,
      });
      return;
    }

    // Validate parentFileId belongs to this user (if provided)
    if (parentFileId) {
      const [parentFile] = await db
        .select({ id: fileRecordsTable.id })
        .from(fileRecordsTable)
        .where(
          and(
            eq(fileRecordsTable.id, parentFileId),
            eq(fileRecordsTable.userId, req.userId!)
          )
        );
      if (!parentFile) {
        res.status(400).json({ error: "Parent file not found or not owned by you" });
        return;
      }
    }

    const [fileRecord] = await db
      .insert(fileRecordsTable)
      .values({
        userId: req.userId!,
        projectId: projectId || null,
        creatorProfileId: profile.id,
        parentFileId: parentFileId || null,
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

    if (usage.files.used === 0) {
      await recordEvent("first_file_protected", req.userId!, { fileId: fileRecord.id, fileType });
    } else {
      await recordEvent("file_protected", req.userId!, { fileId: fileRecord.id, fileType });
    }

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
      parentFileId: f.parentFileId ?? null,
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

    await recordEvent("certificate_downloaded", req.userId!, { fileId: rawId, certificateId: cert.certificateId });

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

// Evidence Package: ZIP containing cert PDF + metadata JSON + instructions
router.get(
  "/files/:id/evidence-package",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Plan gating: evidence package is Creator+ only
    const [u] = await db.select({ tier: usersTable.subscriptionTier }).from(usersTable).where(eq(usersTable.id, req.userId!));
    const plan = getPlan(u?.tier);
    if (!plan.evidencePackageEnabled) {
      res.status(402).json({
        error: "PLAN_FEATURE_LOCKED",
        scope: "evidencePackage",
        message: "Evidence Packages are available on the Creator plan and above.",
        plan,
      });
      return;
    }

    const [f] = await db
      .select()
      .from(fileRecordsTable)
      .where(and(eq(fileRecordsTable.id, rawId), eq(fileRecordsTable.userId, req.userId!)));

    if (!f) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.fileId, rawId));
    const [ts] = await db.select().from(timestampRecordsTable).where(eq(timestampRecordsTable.fileId, rawId));
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.id, f.creatorProfileId));
    let projectTitle: string | null = null;
    if (f.projectId) {
      const [proj] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, f.projectId));
      projectTitle = proj?.title ?? null;
    }

    const metadata = {
      exportedAt: new Date().toISOString(),
      originlock: {
        certificateId: cert?.certificateId ?? null,
        certificateStatus: cert?.status ?? null,
        verificationUrl: cert?.publicUrl ?? null,
      },
      file: {
        title: f.title,
        originalFilename: f.originalFilename,
        fileType: f.fileType,
        mimeType: f.mimeType,
        fileSizeBytes: f.fileSizeBytes.toString(),
        sha256Hash: f.sha256Hash,
      },
      timestamp: {
        recordedAtUtc: ts?.recordedAtUtc?.toISOString() ?? null,
        providerName: ts?.providerName ?? "originlock-internal",
      },
      creator: {
        displayName: profile?.displayName ?? "",
        creatorHandle: profile?.creatorHandle ?? "",
        claimStatement: profile?.claimStatement ?? null,
        websiteUrl: profile?.websiteUrl ?? null,
      },
      project: projectTitle ? { title: projectTitle } : null,
    };

    const instructions = `OriginLock Evidence Package
===========================

What this package contains:
  - certificate.pdf : Formally formatted PDF certificate of your proof record
  - metadata.json   : Machine-readable proof record (certificate ID, hash, timestamp, creator)

How to verify this record:
  1. Note the SHA-256 hash in metadata.json (file.sha256Hash)
  2. Compute the SHA-256 hash of your original file using any standard tool (e.g. sha256sum on Linux/macOS, CertUtil on Windows)
  3. Confirm the two hashes are identical
  4. Visit the verification URL below to independently confirm the certificate record is intact

Verification URL:
  ${cert?.publicUrl ?? "(unavailable)"}

Certificate ID:
  ${cert?.certificateId ?? "(unavailable)"}

Recorded (UTC):
  ${ts?.recordedAtUtc?.toISOString() ?? "(unavailable)"}

Important notices:
  - OriginLock provides cryptographic proof of existence at a specific point in time
  - It is NOT a copyright registration service
  - It does NOT provide legal advice
  - The hash proves the file content existed and was recorded at the timestamp above
  - Any modification to the file, however minor, will produce a different hash

Creator Attribution:
  ${profile?.displayName ?? "(unknown)"} (@${profile?.creatorHandle ?? "unknown"})
${profile?.claimStatement ? `\nClaim Statement:\n  ${profile.claimStatement}` : ""}

OriginLock — https://originlock.app
`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="OriginLock_Evidence_${cert?.certificateId ?? rawId}.zip"`);

    await recordEvent("evidence_package_downloaded", req.userId!, { fileId: rawId, certificateId: cert?.certificateId });

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.pipe(res as any);

    // Metadata JSON
    archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });

    // Verification instructions
    archive.append(instructions, { name: "verification-instructions.txt" });

    // Certificate PDF
    if (cert?.pdfData) {
      const pdfBuffer = Buffer.from(cert.pdfData, "base64");
      archive.append(pdfBuffer, { name: "certificate.pdf" });
    } else {
      try {
        const pdfBuffer = await generateCertificatePdf({
          certificateId: cert?.certificateId ?? rawId,
          status: cert?.status ?? "valid",
          displayName: profile?.displayName ?? "",
          creatorHandle: profile?.creatorHandle ?? "",
          projectTitle,
          fileTitle: f.title,
          originalFilename: f.originalFilename,
          fileType: f.fileType,
          fileSizeBytes: f.fileSizeBytes,
          sha256Hash: f.sha256Hash,
          recordedAtUtc: ts?.recordedAtUtc ?? new Date(),
          verificationUrl: cert?.publicUrl ?? "",
        });
        archive.append(pdfBuffer, { name: "certificate.pdf" });
      } catch {
        // proceed without PDF if generation fails
      }
    }

    await archive.finalize();
  }
);

export default router;
