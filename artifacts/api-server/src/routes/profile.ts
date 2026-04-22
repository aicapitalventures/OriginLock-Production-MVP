import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, creatorProfilesTable } from "@workspace/db";
import { CreateProfileBody, UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/profile",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const [profile] = await db
      .select()
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.userId, req.userId!));

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json(profile);
  }
);

router.post(
  "/profile",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const parsed = CreateProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select({ id: creatorProfilesTable.id })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.userId, req.userId!));

    if (existing) {
      res.status(409).json({ error: "Profile already exists. Use PATCH to update." });
      return;
    }

    const [handleConflict] = await db
      .select({ id: creatorProfilesTable.id })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.creatorHandle, parsed.data.creatorHandle));

    if (handleConflict) {
      res.status(409).json({ error: "Creator handle is already taken" });
      return;
    }

    const [profile] = await db
      .insert(creatorProfilesTable)
      .values({
        userId: req.userId!,
        ...parsed.data,
      })
      .returning();

    res.status(201).json(profile);
  }
);

router.patch(
  "/profile",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const parsed = UpdateProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.userId, req.userId!));

    if (!existing) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    if (parsed.data.creatorHandle && parsed.data.creatorHandle !== existing.creatorHandle) {
      const [handleConflict] = await db
        .select({ id: creatorProfilesTable.id })
        .from(creatorProfilesTable)
        .where(eq(creatorProfilesTable.creatorHandle, parsed.data.creatorHandle));

      if (handleConflict) {
        res.status(409).json({ error: "Creator handle is already taken" });
        return;
      }
    }

    // profileIsPublic is not in the generated schema — handle it separately
    const extraFields: Record<string, unknown> = {};
    if (typeof req.body.profileIsPublic === "boolean") {
      extraFields.profileIsPublic = req.body.profileIsPublic;
    }

    const [profile] = await db
      .update(creatorProfilesTable)
      .set({ ...parsed.data, ...extraFields })
      .where(eq(creatorProfilesTable.userId, req.userId!))
      .returning();

    res.json(profile);
  }
);

export default router;
