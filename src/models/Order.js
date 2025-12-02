// src/models/Order.js
import mongoose from 'mongoose';

const burgerConfigSchema = new mongoose.Schema(
  {
    // Número de carnes de la hamburguesa
    meatQty: { type: Number, default: 1 },

    // Tipo de carne (por si luego quieres "res", "pollo", etc.)
    meatType: { type: String, default: 'carne' },

    // Tocineta base del producto: asada / caramelizada / ninguna
    baconType: { type: String, default: 'asada' },

    // Adición extra de tocineta
    extraBacon: { type: Boolean, default: false },

    // Opciones de lechuga: normal | wrap | sin
    lettuceOption: { type: String, default: 'normal' },

    // Verduras
    tomato: { type: Boolean, default: true },
    onion: { type: Boolean, default: true },

    // Si el cliente dijo “sin verduras”
    noVeggies: { type: Boolean, default: false },

    // Nota libre para cocina
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: String,
    productCode: String,

    // Cuántas hamburguesas de ese tipo
    quantity: { type: Number, required: true },

    // Combo y papas extra
    includesFries: { type: Boolean, default: false },
    extraFriesQty: { type: Number, default: 0 },

    // Código de bebida: none | coca | coca_zero | etc.
    drinkCode: { type: String, default: 'none' },

    // Configuración detallada de la hamburguesa
    burgerConfig: burgerConfigSchema,

    // Precios
    unitPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
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
