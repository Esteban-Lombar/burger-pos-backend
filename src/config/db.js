import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("❌ Falta la variable MONGODB_URI en el .env");
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message);
    process.exit(1);
  }
}
