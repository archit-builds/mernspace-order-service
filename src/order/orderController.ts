import { Request, Response } from "express";
import createHttpError from "http-errors";
import { CartItem, ProductPricingCache, Topping, ToppingPriceCache } from "../types";
import productCacheModel from "../productCache/productCacheModel";
import toppingCacheModel from "../toppingCache/toppingCacheModel";
import orderModel from "./orderModel";
import { OrderStatus, PaymentStatus } from "./orderTypes";

export class OrderController {
    create = async (req: Request, res: Response) => {
        // todo: validate request data.
         const {
      cart,
      couponCode,
      tenantId,
      paymentMode,
      customerId,
      comment,
      address,
    } = req.body;
        const subTotal = await this.calculateTotal(cart);
        
        const deliveryFee = subTotal > 0 ? 49 : 0;
        const taxes = Math.round(subTotal * 0.18);
        const finalTotal = subTotal + deliveryFee + taxes;

        const newOrder = await orderModel.create({
            cart,
            address,
            comment,
            customerId,
            deliveryCharges: deliveryFee,
            discount: 0,
            taxes,
            tenantId,
            total: finalTotal,
            paymentMode,
            orderStatus: OrderStatus.RECEIVED,
            paymentStatus: PaymentStatus.PENDING,
        })

        return res.json({ newOrder });
    };

    private calculateTotal = async (cart: CartItem[]) => {
        const productIds = cart.map((item) => item._id);

        // todo: proper error handling..
        const productPricings = await productCacheModel.find({
            productId: {
                $in: productIds,
            },
        });

        // todo: What will happen if product does not exists in the cache
        // 1. call catalog service.
        // 2. Use price from cart <- BAD

        const cartToppingIds = cart.reduce((acc, item) => {
            return [
                ...acc,
                ...item.chosenConfiguration.selectedToppings.map(
                    (topping) => topping.id,
                ),
            ];
        }, []);

        // todo: What will happen if topping does not exists in the cache
        const toppingPricings = await toppingCacheModel.find({
            toppingId: {
                $in: cartToppingIds,
            },
        });

        const totalPrice = cart.reduce((acc, curr) => {
            const cachedProductPrice = productPricings.find(
                (product) => product.productId === curr._id,
            );

            if (!cachedProductPrice) {
                throw createHttpError(400, `Product not found in pricing cache: ${curr._id}`);
            }

            return (
                acc +
                curr.qty * this.getItemTotal(curr, cachedProductPrice, toppingPricings)
            );
        }, 0);

        return totalPrice;
    };

    private getItemTotal = (
        item: CartItem,
        cachedProductPrice: ProductPricingCache,
        toppingsPricings: ToppingPriceCache[],
    ) => {
        const toppingsTotal = item.chosenConfiguration.selectedToppings.reduce(
            (acc, curr) => {
                return acc + this.getCurrentToppingPrice(curr, toppingsPricings);
            },
            0,
        );

        const productTotal = Object.entries(
            item.chosenConfiguration.priceConfiguration,
        ).reduce((acc, [key, value]) => {
            const price =
                cachedProductPrice.priceConfiguration[key].availableOptions[value];
            return acc + price;
        }, 0);

        return productTotal + toppingsTotal;
    };

    private getCurrentToppingPrice = (
        topping: Topping,
        toppingPricings: ToppingPriceCache[],
    ) => {
        const currentTopping = toppingPricings.find(
            (current) => topping.id === current.toppingId,
        );

        if (!currentTopping) {
            throw createHttpError(400, `Topping not found in pricing cache: ${topping.id}`);
        }

        return currentTopping.price;
    };
};

