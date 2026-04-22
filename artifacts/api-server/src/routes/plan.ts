import { Router, type IRouter } from "express";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { getUserUsage } from "../lib/usage";
import { PLANS } from "../lib/plans";

const router: IRouter = Router();

router.get("/plans", async (_req, res): Promise<void> => {
  res.json(Object.values(PLANS));
});

router.get(
  "/plan/usage",
  requireAuth,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const usage = await getUserUsage(req.userId!);
    res.json(usage);
  }
);

export default router;
