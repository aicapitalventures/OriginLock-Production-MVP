import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import projectsRouter from "./projects";
import filesRouter from "./files";
import verificationRouter from "./verification";
import dashboardRouter from "./dashboard";
import creatorsRouter from "./creators";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(projectsRouter);
router.use(filesRouter);
router.use(verificationRouter);
router.use(dashboardRouter);
router.use(creatorsRouter);

export default router;
