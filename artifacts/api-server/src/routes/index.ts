import { Router, type IRouter } from "express";
import healthRouter from "./health";
import downloadRouter from "./download";
import sohbaRouter from "./sohba";
import counterRouter from "./counter";
import hadithRouter from "./hadith";
import audioProxyRouter from "./audio-proxy";
import designFilesRouter from "./design-files";

const router: IRouter = Router();

router.use(healthRouter);
router.use(downloadRouter);
router.use(sohbaRouter);
router.use(counterRouter);
router.use(hadithRouter);
router.use(audioProxyRouter);
router.use(designFilesRouter);

export default router;
