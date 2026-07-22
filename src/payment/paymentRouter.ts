import express from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./paymentController";

const router = express.Router();

const paymentController = new PaymentController();

// All payment routes are protected — user must be authenticated
router.post("/create-order", authenticate, asyncWrapper(paymentController.createOrder));
router.post("/verify", authenticate, asyncWrapper(paymentController.verifyPayment));

// Webhook route must NOT be protected by authenticate
// because Razorpay's servers call it directly
router.post("/webhook", asyncWrapper(paymentController.webhookHandler));

export default router;
