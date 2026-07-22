import Razorpay from "razorpay";
import crypto from "crypto";
import config from "config";
import { RazorpayOrderResponse, RazorpayVerifyPayload } from "./paymentTypes";
import createHttpError from "http-errors";

/**
 * Returns a Razorpay client initialised with credentials from the config package.
 * Reads razorpay.keyId and razorpay.keySecret, which are mapped to OS env vars
 * via config/custom-environment-variables.yaml.
 */
function getRazorpayClient(): Razorpay {
    const keyId = config.get<string>("razorpay.keyId");
    const keySecret = config.get<string>("razorpay.keySecret");

    if (!keyId || !keySecret) {
        throw createHttpError(
            500,
            "Razorpay credentials are missing. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars are set.",
        );
    }

    return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * Create a Razorpay order.
 * @param amountInRupees - total in INR (we convert to paise internally)
 * @param receipt - unique receipt string (e.g. the internal order id)
 * @param currency - defaults to "INR"
 */
export const createRazorpayOrder = async (
    amountInRupees: number,
    receipt: string,
    currency = "INR",
): Promise<RazorpayOrderResponse> => {
    const amountInPaise = Math.round(amountInRupees * 100);

    if (amountInPaise < 100) {
        throw createHttpError(400, "Amount must be at least ₹1 (100 paise).");
    }

    try {
        const client = getRazorpayClient();
        const order = await client.orders.create({
            amount: amountInPaise,
            currency,
            receipt,
        });

        return {
            id: order.id,
            amount: Number(order.amount),
            currency: order.currency,
            receipt: order.receipt ?? receipt,
        };
    } catch (err: unknown) {
        // Re-throw http-errors as-is (from getRazorpayClient or our own checks)
        if ((err as { status?: number })?.status) throw err;

        const error = err as { statusCode?: number; error?: { description?: string } };
        if (error?.statusCode === 401) {
            throw createHttpError(401, "Razorpay authentication failed. Check your API credentials.");
        }
        const description =
            error?.error?.description ?? "Failed to create Razorpay order";
        throw createHttpError(500, description);
    }
};

/**
 * Verify a Razorpay payment signature.
 * Returns true if the signature is valid, throws an HTTP 400 error otherwise.
 */
export const verifyRazorpaySignature = (payload: RazorpayVerifyPayload): boolean => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw createHttpError(400, "Missing required payment verification fields.");
    }

    const keySecret = config.get<string>("razorpay.keySecret");
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw createHttpError(400, "Payment signature verification failed. Possible tamper detected.");
    }

    return true;
};

/**
 * Verify a Razorpay webhook signature.
 * Returns true if the signature is valid, throws an HTTP 400 error otherwise.
 */
export const verifyWebhookSignature = (rawBody: string, signature: string): boolean => {
    if (!signature) {
        throw createHttpError(400, "Missing razorpay signature header.");
    }

    const webhookSecret = config.get<string>("razorpay.webhookSecret");
    
    if (!webhookSecret) {
        throw createHttpError(500, "Razorpay webhook secret is missing in configuration.");
    }

    const isValid = Razorpay.validateWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
        throw createHttpError(400, "Webhook signature verification failed.");
    }

    return true;
};
