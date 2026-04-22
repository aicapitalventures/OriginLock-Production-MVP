import { Router, type IRouter } from "express";
import { eq, and, count, desc } from "drizzle-orm";
import { db, projectsTable, fileRecordsTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { getUserUsage, checkLimit } from "../lib/usage";
import { recordEvent } from "../lib/analytics";

const router: IRouter = Router();

router.get(
  "/projects",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.userId, req.userId!))
      .orderBy(desc(projectsTable.updatedAt));

    const projectIds = projects.map((p) => p.id);
    const fileCounts: Record<string, number> = {};

    if (projectIds.length > 0) {
      for (const project of projects) {
        const [result] = await db
          .select({ count: count() })
          .from(fileRecordsTable)
          .where(eq(fileRecordsTable.projectId, project.id));
        fileCounts[project.id] = Number(result?.count ?? 0);
      }
    }

    res.json(
      projects.map((p) => ({
        ...p,
        fileCount: fileCounts[p.id] ?? 0,
      }))
    );
  }
);

router.post(
  "/projects",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const parsed = CreateProjectBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const usage = await getUserUsage(req.userId!);
    if (!checkLimit(usage.projects.used, usage.projects.limit)) {
      res.status(402).json({
        error: "PLAN_LIMIT_REACHED",
        scope: "projects",
        message: `Your ${usage.plan.name} plan allows ${usage.projects.limit} project${usage.projects.limit === 1 ? "" : "s"}. Upgrade to add more.`,
        plan: usage.plan,
      });
      return;
    }

    const [project] = await db
      .insert(projectsTable)
      .values({
        userId: req.userId!,
        ...parsed.data,
      })
      .returning();

    if (usage.projects.used === 0) {
      await recordEvent("first_project_created", req.userId!, { projectId: project.id });
    } else {
      await recordEvent("project_created", req.userId!, { projectId: project.id });
    }

    res.status(201).json({ ...project, fileCount: 0 });
  }
);

router.get(
  "/projects/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, rawId),
          eq(projectsTable.userId, req.userId!)
        )
      );

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const files = await db
      .select()
      .from(fileRecordsTable)
      .where(eq(fileRecordsTable.projectId, rawId));

    res.json({
      ...project,
      fileCount: files.length,
      files: files.map((f) => ({
        id: f.id,
        userId: f.userId,
        projectId: f.projectId,
        projectTitle: project.title,
        title: f.title,
        originalFilename: f.originalFilename,
        fileType: f.fileType,
        mimeType: f.mimeType,
        fileSizeBytes: f.fileSizeBytes.toString(),
        sha256Hash: f.sha256Hash,
        notes: f.notes,
        privacyMode: f.privacyMode,
        certificateId: null,
        certificateStatus: null,
        verificationUrl: null,
        recordedAtUtc: null,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    });
  }
);

router.patch(
  "/projects/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const parsed = UpdateProjectBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, rawId),
          eq(projectsTable.userId, req.userId!)
        )
      );

    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [project] = await db
      .update(projectsTable)
      .set(parsed.data)
      .where(eq(projectsTable.id, rawId))
      .returning();

    const [result] = await db
      .select({ count: count() })
      .from(fileRecordsTable)
      .where(eq(fileRecordsTable.projectId, rawId));

    res.json({ ...project, fileCount: Number(result?.count ?? 0) });
  }
);

router.delete(
  "/projects/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const [existing] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, rawId),
          eq(projectsTable.userId, req.userId!)
        )
      );

    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await db.delete(projectsTable).where(eq(projectsTable.id, rawId));
    res.sendStatus(204);
  }
);

export default router;
