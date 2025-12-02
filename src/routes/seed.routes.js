// src/routes/seed.routes.js
import { Router } from "express";
import { seedProducts } from "../seed/products.seed.js";

const router = Router();

// Ejecutar seed de productos (desde navegador o Postman)
router.get("/products", seedProducts);

export default router;
