import { Router } from "express";
import { Order } from "../models/Order.js";

const router = Router();

/**
 * Helper: DateKey (YYYY-MM-DD) en zona horaria Colombia
 */
function bogotaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-");
  return `${parts[0]}-${parts[1]}-${parts[2]}`;
}

/**
 * Helper: recalcular total desde items
 */
function calcTotal(items = []) {
  return items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 1;
    const unit = Number(item.unitPrice) || 0;
    const line = item.totalPrice != null ? Number(item.totalPrice) : unit * qty;
    return sum + (Number.isFinite(line) ? line : 0);
  }, 0);
}

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

    // Normaliza items (por si viene extraDrinkQty)
    const cleanItems = items.map((it) => ({
      ...it,
      quantity: Number(it.quantity) || 1,
      extraFriesQty: Number(it.extraFriesQty) || 0,
      extraDrinkQty: Number(it.extraDrinkQty) || 0, // ✅ NUEVO
      unitPrice: Number(it.unitPrice) || 0,
      totalPrice: Number(it.totalPrice) || 0,
    }));

    const total = calcTotal(cleanItems);

    const now = new Date();
    const newOrder = await Order.create({
      tableNumber: tableNumber ?? null,
      toGo: !!toGo,
      items: cleanItems,
      total,
      // ✅ clave del día en hora Colombia para consultas por día
      createdDateKey: bogotaDateKey(now),
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("❌ Error creando la orden:", error);
    res.status(500).json({ error: "Error creando la orden" });
  }
});

/**
 * Listar órdenes, opcionalmente filtradas por status
 * GET /api/orders?status=pendiente
 */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter).sort({ createdAt: 1 });
    res.json(orders);
  } catch (error) {
    console.error("❌ Error obteniendo órdenes:", error);
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});

/**
 * Pedidos pendientes (cocina)
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
 * ✅ PUNTO B: Resumen del día para cierre de caja (sin errores por zona horaria)
 *
 * GET /api/orders/today/summary?date=YYYY-MM-DD&by=completed|paid|created
 *
 * - by=completed (DEFAULT): cuenta ventas por cuando cocina puso LISTO (lo que tú pediste)
 * - by=paid: cuenta ventas por cuando caja puso PAGADO
 * - by=created: por fecha de creación (no recomendado para caja, pero se deja)
 */
router.get("/today/summary", async (req, res) => {
  try {
    const { date, by } = req.query;

    const mode = (by || "completed").toString().trim().toLowerCase();
    const dayKey = date ? String(date) : bogotaDateKey(new Date());

    let keyField = "completedDateKey";
    if (mode === "paid") keyField = "paidDateKey";
    if (mode === "created") keyField = "createdDateKey";

    // Traemos órdenes del día según el modo
    const dayOrders = await Order.find({ [keyField]: dayKey }).sort({
      createdAt: 1,
    });

    // Total recomendado:
    // - completed: suma de pedidos que ya están LISTO o PAGADO
    // - paid: suma solo PAGADO
    // - created: suma de TODOS (útil para auditoría, no para caja)
    let validForCash = dayOrders;

    if (mode === "completed") {
      validForCash = dayOrders.filter((o) => ["listo", "pagado"].includes(o.status));
    } else if (mode === "paid") {
      validForCash = dayOrders.filter((o) => o.status === "pagado");
    }

    const total = validForCash.reduce((sum, o) => sum + (o.total || 0), 0);

    res.json({
      date: dayKey,
      by: mode,
      total,
      numOrders: validForCash.length,
      orders: dayOrders, // manda todas las del día (para listado / auditoría)
    });
  } catch (error) {
    console.error("❌ Error obteniendo resumen del día:", error);
    res.status(500).json({ error: "Error obteniendo resumen del día" });
  }
});

/**
 * Actualizar estado de una orden
 * PUT /api/orders/:id/status  { status: "listo" }
 *
 * ✅ AQUÍ se guardan las fechas reales para cierre:
 * - listo  -> completedAt + completedDateKey (hora Colombia)
 * - pagado -> paidAt + paidDateKey (hora Colombia)
 */
router.put("/:id/status", async (req, res) => {
  try {
    let { status } = req.body;

    if (typeof status === "string") {
      status = status.trim().toLowerCase();
    }

    const allowedStatuses = [
      "pendiente",
      "preparando",
      "listo",
      "pagado",
      "cancelado",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const now = new Date();
    const update = { status };

    // ✅ si pasa a LISTO, sellamos completedAt (si no estaba)
    if (status === "listo") {
      update.completedAt = now;
      update.completedDateKey = bogotaDateKey(now);
    }

    // ✅ si pasa a PAGADO, sellamos paidAt
    if (status === "pagado") {
      update.paidAt = now;
      update.paidDateKey = bogotaDateKey(now);

      // Si por alguna razón nunca lo marcaron listo antes,
      // lo sellamos también para no perderlo en cierres por "completed"
      update.completedAt = update.completedAt || now;
      update.completedDateKey = update.completedDateKey || bogotaDateKey(now);
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

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
 * Editar datos básicos de la orden (mesa, para llevar, items)
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
      if (update.toGo) update.tableNumber = null;
    }

    if (items && Array.isArray(items)) {
      // permitimos incluso array vacío si quieres (no obligatorio)
      const cleanItems = items.map((it) => ({
        ...it,
        quantity: Number(it.quantity) || 1,
        extraFriesQty: Number(it.extraFriesQty) || 0,
        extraDrinkQty: Number(it.extraDrinkQty) || 0, // ✅ NUEVO
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: Number(it.totalPrice) || 0,
      }));

      update.items = cleanItems;
      update.total = calcTotal(cleanItems);
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

export default router;
