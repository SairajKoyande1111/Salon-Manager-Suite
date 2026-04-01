import { Router } from "express";
import { Product } from "../models/index.js";

const router = Router();

router.get("/products", async (_req, res) => {
  const products = await Product.find().sort({ category: 1, name: 1 });
  res.json({
    products: products.map((p) => ({ ...p.toObject(), id: p._id.toString() })),
  });
});

router.post("/products", async (req, res) => {
  const { name, category, brand, stockQuantity, costPrice, sellingPrice, lowStockThreshold } =
    req.body;
  const threshold = lowStockThreshold ?? 5;
  const isLowStock = (stockQuantity ?? 0) <= threshold;
  const product = await Product.create({
    name,
    category,
    brand,
    stockQuantity: stockQuantity ?? 0,
    costPrice,
    sellingPrice,
    lowStockThreshold: threshold,
    isLowStock,
  });
  res.status(201).json({ ...product.toObject(), id: product._id.toString() });
});

export default router;
