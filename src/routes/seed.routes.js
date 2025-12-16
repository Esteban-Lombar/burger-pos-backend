// src/routes/seed.routes.js
import { Router } from "express";
import { seedProducts } from "../seed/products.seed.js";

const router = Router();

// ✅ Seed SOLO productos
// URL: GET /api/seed/products
router.get("/products", seedProducts);

// ✅ (Opcional) Salud del seed
// URL: GET /api/seed
router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "Seed routes OK. Usa GET /api/seed/products para cargar productos.",
  });
});

export default router;
