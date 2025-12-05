import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

// Rutas
import productsRoutes from "./routes/products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import seedRoutes from "./routes/seed.routes.js"; // seed para cargar productos iniciales

const app = express();

// ==========================
// 🔥 Opción B: Cors completo
// ==========================
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,PATCH,DELETE",
    allowedHeaders: "Content-Type, Authorization",
  })
);

// Middleware para asegurar cabeceras extra
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE"
  );
  next();
});

// ==========================
// ❌ Desactivar caché y ETags
// ==========================
app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// ==========================
// Middlewares principales
// ==========================
app.use(express.json());

// ==========================
// Rutas API
// ==========================
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/seed", seedRoutes);

// Ruta principal
app.get("/", (req, res) => {
  res.send("API POS Hamburguesas funcionando 🍔🔥");
});

// Puerto del servidor
const PORT = process.env.PORT || 5000;

// Inicialización del servidor
async function startServer() {
  try {
    await connectDB();
    console.log("✅ Conectado correctamente a MongoDB");

    app.listen(PORT, () => {
      console.log(
        `🚀 Servidor ejecutándose en http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Error iniciando el servidor:", error);
    process.exit(1); // Detener si hay error grave
  }
}

startServer();
