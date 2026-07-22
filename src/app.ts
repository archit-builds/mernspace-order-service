import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import customerRouter from "./customer/customerRouter";
import authenticate from "./common/middleware/authenticate";
import orderRouter from "./order/orderRouter";
import paymentRouter from "./payment/paymentRouter";
import cors from "cors";


const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  express.json({
    verify: (req: Request, res: Response, buf: Buffer) => {
      // Store the raw, unparsed request body for webhook signature verification
      (req as any).rawBody = buf;
    },
  })
);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use("/customer", customerRouter);
app.use("/orders", orderRouter);
app.use("/payment", paymentRouter);

app.use(globalErrorHandler);

export default app;

