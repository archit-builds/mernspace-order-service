import mongoose, { mongo } from "mongoose";

export interface ProductPricingSchema{
    productId:string,
    priceConfiguration:{
        priceType :  "base"| "additional"

    },
    availableOptions : { [key: string]: number }
}



const PriceSchema = new mongoose.Schema({
    priceType : {
        type : String,
        enum : ["base" , "additional"]
    },
    availableOptions : {
        type:Object,
        Of:Number
    }
})

const productCacheSchema = new mongoose.Schema<ProductPricingSchema>({
    productId:{
        type:String,
        required:true
    },
    priceConfiguration : {
        type:Object,
        Of:PriceSchema
    }

})

export default mongoose.model<ProductPricingSchema>(
    "ProductPricingCache",
    productCacheSchema,
    "productCache"
)