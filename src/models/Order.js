import mongoose from "mongoose";

/**
 * Helpers: DateKey en zona horaria Colombia (America/Bogota)
 * Formato: YYYY-MM-DD
 */
function bogotaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-"); // [YYYY, MM, DD]
  return `${parts[0]}-${parts[1]}-${parts[2]}`;
}

const burgerConfigSchema = new mongoose.Schema(
  {
    meatType: { type: String, default: "carne" },
    meatQty: { type: Number, default: 1 },
    baconType: { type: String, default: "asada" }, // asada | caramelizada
    extraBacon: { type: Boolean, default: false },
    extraCheese: { type: Boolean, default: false },
    lettuceOption: { type: String, default: "normal" }, // normal | wrap | sin
    tomato: { type: Boolean, default: true },
    onion: { type: Boolean, default: true },
    noVeggies: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    includedMeats: { type: Number, default: 1 }, // opcional (sencilla/doble)
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
    includesFries: { type: Boolean, default: false },
    extraFriesQty: { type: Number, default: 0 },
    drinkCode: { type: String, default: "none" }, // none | coca | coca_zero

    // ✅ NUEVO: adición de gaseosa (aparte del combo)
    extraDrinkQty: { type: Number, default: 0 },

    burgerConfig: burgerConfigSchema,

    unitPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    basePrice: { type: Number, default: 0 },
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

    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, default: 0 },

    /**
     * ✅ Claves para cierres por día (en hora Colombia)
     * - createdDateKey: día en que se creó la orden (hora Colombia)
     * - completedDateKey: día en que cocina la marcó LISTO (hora Colombia)
     * - paidDateKey: día en que caja la marcó PAGADO (hora Colombia)
     */
    createdDateKey: { type: String, default: () => bogotaDateKey(new Date()) },
    completedAt: { type: Date, default: null },
    completedDateKey: { type: String, default: null },
    paidAt: { type: Date, default: null },
    paidDateKey: { type: String, default: null },
  },
  { timestamps: true }
);

// Índices útiles para cierres rápidos
orderSchema.index({ createdDateKey: 1 });
orderSchema.index({ completedDateKey: 1 });
orderSchema.index({ paidDateKey: 1 });

export const Order = mongoose.model("Order", orderSchema);
