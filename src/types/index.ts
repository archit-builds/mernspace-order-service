import { Request } from "express";

export type AuthCookie = {
  accessToken: string;
};

export interface AuthRequest extends Request {
  auth: {
    sub: string;
    role: string;
    id?: string;
    tenant: string;
    firstName: string;
    lastName: string;
    email: string;
    address?: string;
  };
}


export interface PriceConfiguration {
  priceType: "base" | "aditional";
  availableOptions: {
    [key: string]: number;
  };
}
export interface ProductPricingCache {
  productId: string;
  priceConfiguration: { [key: string]: PriceConfiguration };
}


export interface ProductMessage {
  id: string;
  priceConfiguration: { [key: string]: PriceConfiguration };
}

export interface ToppingPriceCache {
  toppingId: string;
  price: number;
}

// Alias used by the Mongoose model
export type ToppingPricingCache = ToppingPriceCache;


export interface ToppingMessage {
  id: string;
  price: number;
}


export interface ProductPriceConfiguration {
  [key: string]: {
    priceType: "base" | "aditional";
    availableOptions: {
      [key: string]: number;
    };
  };
}

export type Product = {
  _id: string;
  name: string;
  image: string;
  description: string;
  priceConfiguration: ProductPriceConfiguration;
};

export type Topping = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export interface CartItem
  extends Pick<Product, "_id" | "name" | "image" | "priceConfiguration"> {
  chosenConfiguration: {
    priceConfiguration: {
      [key: string]: string;
    };
    selectedToppings: Topping[];
  };
  qty: number;
}