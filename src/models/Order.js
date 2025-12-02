import mongoose from 'mongoose';

const burgerConfigSchema = new mongoose.Schema(
  {
    meatType: String,
    baconType: String,
    extraBacon: Boolean,
    lettuceOption: String,
    tomato: Boolean,
    onion: Boolean,
    noVeggies: Boolean,
    notes: String,
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: String,
    productCode: String,
    quantity: { type: Number, required: true },
    includesFries: Boolean,
    extraFriesQty: Number,
    drinkCode: String,
    burgerConfig: burgerConfigSchema,
    unitPrice: Number,
    totalPrice: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, default: null },
    toGo: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pendiente', 'preparando', 'listo', 'pagado', 'cancelado'],
      default: 'pendiente',
    },
    items: [orderItemSchema],
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
