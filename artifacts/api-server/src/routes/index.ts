import { Router, type IRouter } from "express";
import healthRouter from "./health";
import downloadRouter from "./download";
import sohbaRouter from "./sohba";

const router: IRouter = Router();

router.use(healthRouter);
router.use(downloadRouter);
router.use(sohbaRouter);

export default router;
