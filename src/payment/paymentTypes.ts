export interface PaymentOptions {
  currency?: "inr";
  amount: number;
  orderId: string;
  tenantId: string;
  idempotenencyKey?: string;
}
type GatewayPaymentStatus = "no_payment_required" | "paid" | "unpaid";

interface PaymentSession {
  id: string;
  paymentUrl: string;
  paymentStatus: GatewayPaymentStatus;
}
interface CustomMetadata {
  orderId: string;
}

interface VerifiedSession {
  id: string;
  metadata: CustomMetadata;
  paymentStatus: GatewayPaymentStatus;
}

export interface PaymentGW {
  createSession: (options: PaymentOptions) => Promise<PaymentSession>;
  getSession: (id: string) => Promise<VerifiedSession>;
}

// ── Razorpay-specific types ───────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  id: string;          // razorpay order id, e.g. "order_xxxxxxxx"
  amount: number;      // amount in paise
  currency: string;
  receipt: string;
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}