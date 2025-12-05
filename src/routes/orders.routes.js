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
      return res.status(400).json({ error: "La orden debe tener al menos un ítem" });
    }

    const total = items.reduce((sum, item) => {
      if (item.totalPrice != null) return sum + item.totalPrice;
      const unit = item.unitPrice || 0;
      const qty = item.quantity || 1;
      return sum + unit * qty;
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
 * Pedidos pendientes (alternativa para cocina)
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
    res.status(500).json({ error: "Error obteniendo pedidos pendientes" });
  }
});

/**
 * Resumen del día para cierre de caja
 */
router.get("/today/summary", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todayOrders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["listo", "pagado"] },
    });

    const total = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    res.json({
      total,
      numOrders: todayOrders.length,
      orders: todayOrders,
    });
  } catch (error) {
    console.error("❌ Error obteniendo resumen del día:", error);
    res.status(500).json({ error: "Error obteniendo resumen del día" });
  }
});

/**
 * Actualizar estado de una orden
 * PUT /api/orders/:id/status  { status: "listo" }
 */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pendiente", "preparando", "listo", "pagado", "cancelado"].includes(status)) {
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
 * Editar datos básicos de la orden (ej: mesa, para llevar, items)
 * PUT /api/orders/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { tableNumber, toGo, items } = req.body;

    const update = {};

    if (tableNumber !== undefined) {
      update.tableNumber =
        tableNumber === null || tableNumber === "" ? null : Number(tableNumber);
    }

    if (toGo !== undefined) {
      update.toGo = !!toGo;
      // si es para llevar, mesa queda null
      if (update.toGo) {
        update.tableNumber = null;
      }
    }

    // si mandas items, recalculamos total en el back
    if (items && Array.isArray(items) && items.length > 0) {
      update.items = items;
      update.total = items.reduce((sum, item) => {
        if (item.totalPrice != null) return sum + item.totalPrice;
        const unit = item.unitPrice || 0;
        const qty = item.quantity || 1;
        return sum + unit * qty;
      }, 0);
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.json(order);
  } catch (error) {
    console.error("❌ Error editando la orden:", error);
    res.status(500).json({ error: "Error editando la orden" });
  }
});

/**
 * 🧹 Borrar órdenes del día de hoy (solo en pruebas)
 * DELETE /api/orders/clear-today
 */
router.delete("/clear-today", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const result = await Order.deleteMany({
      createdAt: { $gte: start, $lte: end }
    });

    res.json({
      message: "Órdenes del día actual eliminadas",
      totalEliminadas: result.deletedCount
    });
  } catch (error) {
    console.error("❌ Error borrando órdenes de hoy:", error);
    res.status(500).json({ error: "Error borrando órdenes" });
  }
});


export default router;
