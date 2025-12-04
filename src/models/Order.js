import mongoose from "mongoose";

const burgerConfigSchema = new mongoose.Schema(
  {
    meatType: { type: String, default: "carne" },      // tipo general
    meatQty: { type: Number, default: 1 },             // nº de carnes
    baconType: { type: String, default: "asada" },     // asada | caramelizada
    extraBacon: { type: Boolean, default: false },     // adición de tocineta
    extraCheese: { type: Boolean, default: false },    // adición de queso
    lettuceOption: { type: String, default: "normal" },// normal | wrap | sin
    tomato: { type: Boolean, default: true },
    onion: { type: Boolean, default: true },
    noVeggies: { type: Boolean, default: false },
    notes: { type: String, default: "" },              // notas para cocina
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: String,
    productCode: String,

    quantity: { type: Number, required: true },

    // Extras de combo
    includesFries: { type: Boolean, default: false },  // combo con papas
    extraFriesQty: { type: Number, default: 0 },       // adición de papas
    drinkCode: { type: String, default: "none" },      // none | coca | coca_zero

    // Config específica de la hamburguesa
    burgerConfig: burgerConfigSchema,

    // Precios
    unitPrice: Number,   // precio por hamburguesa con sus extras
    totalPrice: Number,  // unitPrice * quantity
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, default: null },
    toGo: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pendiente", "preparando", "listo", "pagado", "cancelado"],
      default: "pendiente",
    },
    items: [orderItemSchema],
    total: { type: Number, default: 0 }, // suma de totalPrice de items
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
