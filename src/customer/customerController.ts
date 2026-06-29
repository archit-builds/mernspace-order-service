import { Response } from "express";
import { AuthRequest } from "../types";
import customerModel from "./customerModel";
import { Request } from "express-jwt";

export class customerController {
  getCustomer = async (req: Request, res: Response) => {
    const { sub: userId, firstName, lastName, email, address } = req.auth;

    const existingCustomer = await customerModel.findOne({ userId });
    if (!existingCustomer) {
      const customer = await customerModel.create({
        userId,
        firstName,
        lastName,
        email,
        address:[],
      });
      res.json(customer);
      return;
    }
    res.json(existingCustomer);
  }
}