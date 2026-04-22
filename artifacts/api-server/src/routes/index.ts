import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import projectsRouter from "./projects";
import filesRouter from "./files";
import verificationRouter from "./verification";
import dashboardRouter from "./dashboard";
import creatorsRouter from "./creators";
import planRouter from "./plan";
import billingRouter from "./billing";
import analyticsRouter from "./analytics";
import adminRouter from "./admin";
import exportDataRouter from "./exportData";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(projectsRouter);
router.use(filesRouter);
router.use(verificationRouter);
router.use(dashboardRouter);
router.use(creatorsRouter);
router.use(planRouter);
router.use(billingRouter);
router.use(analyticsRouter);
router.use(adminRouter);
router.use(exportDataRouter);
router.use(notificationsRouter);

export default router;
