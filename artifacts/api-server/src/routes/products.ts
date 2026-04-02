import { Router } from "express";
import { Product } from "../models/index.js";

const router = Router();

router.get("/products", async (req, res) => {
  const { category, brand, stockStatus, search } = req.query as Record<string, string>;

  const filter: Record<string, any> = {};
  if (category && category !== "all") filter.category = category;
  if (brand && brand !== "all") filter.brand = brand;
  if (search) filter.name = { $regex: search, $options: "i" };
  if (stockStatus === "low") filter.isLowStock = true;
  else if (stockStatus === "out") filter.stockQuantity = 0;
  else if (stockStatus === "ok") filter.$expr = { $gt: ["$stockQuantity", "$lowStockThreshold"] };

  const products = await Product.find(filter).sort({ category: 1, name: 1 });
  const all = await Product.find();
  const categories = [...new Set(all.map((p) => p.category))].filter(Boolean).sort();
  const brands = [...new Set(all.map((p) => p.brand).filter(Boolean))].sort();

  const totalStockValue = all.reduce((sum, p) => sum + (p.stockQuantity * (p.sellingPrice || 0)), 0);
  const lowStockCount = all.filter((p) => p.isLowStock).length;
  const outOfStockCount = all.filter((p) => p.stockQuantity === 0).length;

  res.json({
    products: products.map((p) => ({ ...p.toObject(), id: p._id.toString() })),
    categories,
    brands,
    stats: { total: all.length, totalStockValue, lowStockCount, outOfStockCount },
  });
});

router.post("/products", async (req, res) => {
  const { name, category, brand, description, stockQuantity, costPrice, sellingPrice, lowStockThreshold, expiryDate } = req.body;
  const threshold = lowStockThreshold ?? 5;
  const qty = stockQuantity ?? 0;
  const isLowStock = qty <= threshold;
  const product = await Product.create({
    name,
    category,
    brand,
    description,
    stockQuantity: qty,
    costPrice,
    sellingPrice,
    lowStockThreshold: threshold,
    isLowStock,
    expiryDate,
  });
  res.status(201).json({ ...product.toObject(), id: product._id.toString() });
});

router.patch("/products/:id", async (req, res) => {
  const { name, category, brand, description, stockQuantity, costPrice, sellingPrice, lowStockThreshold, expiryDate } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Not found" });

  if (name !== undefined) product.name = name;
  if (category !== undefined) product.category = category;
  if (brand !== undefined) product.brand = brand;
  if (description !== undefined) product.description = description;
  if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
  if (costPrice !== undefined) product.costPrice = Number(costPrice);
  if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
  if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
  if (expiryDate !== undefined) product.expiryDate = expiryDate;

  product.isLowStock = product.stockQuantity <= product.lowStockThreshold;
  await product.save();
  res.json({ ...product.toObject(), id: product._id.toString() });
});

router.delete("/products/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
