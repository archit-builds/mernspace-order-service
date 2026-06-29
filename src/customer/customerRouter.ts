import express, { Request, Response, NextFunction } from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { customerController } from "./customerController";
import { AuthRequest } from "../types";

const router = express.Router();
const c=new customerController()
router.get(
  "/",
  authenticate,
  asyncWrapper((req: Request, res: Response, next: NextFunction) =>
  c.getCustomer(req as AuthRequest, res),
  ),
);
router.patch(
  "/addresses/:id",
  authenticate,
  asyncWrapper((req: Request, res: Response, next: NextFunction) =>
  c.addAddress(req as AuthRequest, res),
  ),
);

export default router;
