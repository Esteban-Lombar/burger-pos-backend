// src/routes/orders.routes.js
import { Router } from "express";
import { Order } from "../models/Order.js";

const router = Router();

/**
 * Crear una nueva orden (mesero)
 */
router.post("/", async (req, res) => {
  try {
    const { tableNumber, toGo, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "La orden debe tener al menos un ítem" });
    }

    // Calcular total por seguridad en el backend
    const total = items.reduce((sum, item) => {
      const unit = Number(item.unitPrice) || 0;
      const qty = Number(item.quantity) || 1;
      const lineTotal =
        item.totalPrice != null ? Number(item.totalPrice) : unit * qty;
      return sum + lineTotal;
    }, 0);

    const newOrder = await Order.create({
      tableNumber: tableNumber ?? null,
      toGo: !!toGo,
      items,
      total,
      // status usa el default del schema: "pendiente"
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("❌ Error creando la orden:", error);
    res.status(500).json({ error: "Error creando la orden" });
  }
});

/**
 * Listar órdenes, opcionalmente filtradas por status
 * Ejemplo: GET /api/orders?status=pendiente
 */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status; // pendiente, preparando, listo, etc.

    const orders = await Order.find(filter).sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    console.error("❌ Error obteniendo órdenes:", error);
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});

/**
 * Pedidos pendientes (atajo para cocina)
 * GET /api/orders/pending
 */
router.get("/pending", async (req, res) => {
  try {
    const pendingOrders = await Order.find({
      status: { $in: ["pendiente", "preparando"] },
    }).sort({ createdAt: 1 });

    res.json(pendingOrders);
  } catch (error) {
    console.error("❌ Error obteniendo pedidos pendientes:", error);
    res
      .status(500)
      .json({ error: "Error obteniendo pedidos pendientes" });
  }
});

/**
 * Actualizar estado de una orden
 * PUT /api/orders/:id/status  { status: "listo" }
 */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !["pendiente", "preparando", "listo", "pagado", "cancelado"].includes(
        status
      )
    ) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.json(order);
  } catch (error) {
    console.error("❌ Error actualizando estado de la orden:", error);
    res.status(500).json({ error: "Error actualizando estado de la orden" });
  }
});

/**
 * Resumen del día para cierre de caja
 * GET /api/orders/today/summary
 * Opcional: ?date=YYYY-MM-DD -> trae ese día en específico
 */
router.get("/today/summary", async (req, res) => {
  try {
    const { date } = req.query;

    let start, end;

    if (date) {
      // date viene como "2025-12-01"
      const [year, month, day] = date.split("-").map(Number);
      start = new Date(year, month - 1, day, 0, 0, 0, 0);
      end = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      // por defecto: hoy
      start = new Date();
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    const dayOrders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["listo", "pagado"] },
    }).sort({ createdAt: 1 });

    const total = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    res.json({
      total,
      numOrders: dayOrders.length,
      orders: dayOrders,
    });
  } catch (error) {
    console.error("❌ Error obteniendo resumen del día:", error);
    res.status(500).json({ error: "Error obteniendo resumen del día" });
  }
});

export default router;
