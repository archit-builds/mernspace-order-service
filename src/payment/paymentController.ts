import { Request, Response } from "express";
import createHttpError from "http-errors";
import { createRazorpayOrder, verifyRazorpaySignature } from "./razorpayGateway";
import orderModel from "../order/orderModel";
import { PaymentStatus } from "../order/orderTypes";
import { RazorpayVerifyPayload } from "./paymentTypes";

export class PaymentController {
    /**
     * POST /payment/create-order
     * Creates a Razorpay order for an existing internal order.
     * Body: { orderId: string }
     */
    createOrder = async (req: Request, res: Response) => {
        const { orderId } = req.body as { orderId?: string };

        if (!orderId) {
            throw createHttpError(400, "orderId is required.");
        }

        // Look up the internal order to get its total
        const order = await orderModel.findById(orderId);
        if (!order) {
            throw createHttpError(404, `Order not found: ${orderId}`);
        }

        if (order.paymentStatus === PaymentStatus.PAID) {
            throw createHttpError(409, "This order has already been paid.");
        }

        // total is stored in INR in our DB
        const razorpayOrder = await createRazorpayOrder(
            order.total,
            orderId,
        );

        return res.json({
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        });
    };

    /**
     * POST /payment/verify
     * Verifies the Razorpay payment signature and marks the order as PAID.
     * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
     */
    verifyPayment = async (req: Request, res: Response) => {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        } = req.body as RazorpayVerifyPayload & { orderId?: string };

        if (!orderId) {
            throw createHttpError(400, "orderId is required.");
        }

        // This throws a 400 if the signature is invalid
        verifyRazorpaySignature({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });

        // Mark order as paid and store the payment id
        const updated = await orderModel.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: PaymentStatus.PAID,
                paymentId: razorpay_payment_id,
            },
            { new: true },
        );

        if (!updated) {
            throw createHttpError(404, `Order not found: ${orderId}`);
        }

        return res.json({
            success: true,
            message: "Payment verified successfully.",
            paymentId: razorpay_payment_id,
        });
    };

    /**
     * POST /payment/webhook
     * Handles Razorpay webhook events to asynchronously update order statuses.
     */
    webhookHandler = async (req: Request, res: Response) => {
        const signature = req.headers["x-razorpay-signature"] as string;
        
        // We use req.rawBody populated by our express.json({ verify: ... }) middleware
        // to ensure the exact raw buffer is used for signature validation.
        const rawBody = (req as any).rawBody?.toString("utf8");

        if (!rawBody) {
            throw createHttpError(400, "Raw body missing for webhook validation.");
        }

        const { verifyWebhookSignature } = await import("./razorpayGateway");
        
        // This throws if the signature is invalid
        verifyWebhookSignature(rawBody, signature);

        const event = req.body;

        if (event.event === "order.paid") {
            const paymentEntity = event.payload.payment.entity;
            // We stored orderId in receipt when creating the Razorpay order
            const orderId = paymentEntity.notes?.orderId || event.payload.order?.entity?.receipt;

            if (orderId) {
                await orderModel.findByIdAndUpdate(
                    orderId,
                    {
                        paymentStatus: PaymentStatus.PAID,
                        paymentId: paymentEntity.id,
                    }
                );
                // Also could handle updating status based on payment.failed, etc.
            }
        }

        // Always return 200 OK so Razorpay knows we received it
        return res.status(200).json({ success: true });
    };
}
