import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: {
      type: String,
      required: true,
      unique: true,  // 👈 importante por el índice code_1
      trim: true,
    },
    type: { type: String, required: true }, // 'burger', 'combo', 'side', 'drink'
    price: { type: Number, required: true },
    options: {
      carne: { type: Boolean, default: true },
      lechuga: { type: Boolean, default: true },
      tomate: { type: Boolean, default: true },
      cebolla: { type: Boolean, default: true },
      tocineta: {
        type: String,
        enum: ["asada", "caramelizada", "ninguna"],
        default: "ninguna",
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);

export default Product;
