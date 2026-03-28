import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import {
  db,
  fileRecordsTable,
  projectsTable,
  certificatesTable,
  verificationEventsTable,
} from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/dashboard/stats",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const [filesResult] = await db
      .select({ count: count() })
      .from(fileRecordsTable)
      .where(eq(fileRecordsTable.userId, req.userId!));

    const [projectsResult] = await db
      .select({ count: count() })
      .from(projectsTable)
      .where(eq(projectsTable.userId, req.userId!));

    const userFiles = await db
      .select({ id: fileRecordsTable.id })
      .from(fileRecordsTable)
      .where(eq(fileRecordsTable.userId, req.userId!));

    let certsCount = 0;
    let verificationsCount = 0;

    for (const f of userFiles) {
      const [certResult] = await db
        .select({ id: certificatesTable.id, dbId: certificatesTable.id })
        .from(certificatesTable)
        .where(eq(certificatesTable.fileId, f.id));

      if (certResult) {
        certsCount++;
        const [vResult] = await db
          .select({ count: count() })
          .from(verificationEventsTable)
          .where(eq(verificationEventsTable.certificateDbId, certResult.id));
        verificationsCount += Number(vResult?.count ?? 0);
      }
    }

    res.json({
      protectedFiles: Number(filesResult?.count ?? 0),
      projects: Number(projectsResult?.count ?? 0),
      certificates: certsCount,
      verificationChecks: verificationsCount,
    });
  }
);

export default router;
