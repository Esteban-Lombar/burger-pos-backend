import Product from "../models/Product.js";  // 👈 import default

// Productos iniciales
const productsData = [
  {
    name: "Hamburguesa con tocineta asada",
    type: "burger",
    code: "HB-ASADA", // Código único
    price: 18000,
    options: {
      carne: true,
      lechuga: true,
      tomate: true,
      cebolla: true,
      tocineta: "asada",
    },
    active: true,
  },
  {
    name: "Hamburguesa con tocineta caramelizada",
    type: "burger",
    code: "HB-CARAMEL", // Código único
    price: 18000,
    options: {
      carne: true,
      lechuga: true,
      tomate: true,
      cebolla: true,
      tocineta: "caramelizada",
    },
    active: true,
  },
];

export async function seedProducts(req, res) {
  console.log("Ejecutando seed de productos...");

  try {
    // Limpia productos anteriores
    await Product.deleteMany({});

    // Inserta los productos
    await Product.insertMany(productsData);

    console.log("Seed ejecutado con éxito");
    return res
      .status(200)
      .json({
        ok: true,
        message: "Productos cargados correctamente",
        count: productsData.length,
      });
  } catch (error) {
    console.error("Error ejecutando seed de productos:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Error ejecutando seed de productos" });
  }
}
