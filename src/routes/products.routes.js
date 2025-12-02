import { Router } from "express";
import Product from "../models/Product.js";

const router = Router();

// Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ type: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo productos" });
  }
});

// Obtener productos por tipo
router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const products = await Product.find({ type });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error filtrando productos" });
  }
});

export default router;
