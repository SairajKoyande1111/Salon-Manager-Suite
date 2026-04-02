import { Router } from "express";
import { Product, ProductMeta } from "../models/index.js";

const router = Router();

async function saveMeta(category?: string, brand?: string) {
  let meta = await ProductMeta.findOne();
  if (!meta) meta = await ProductMeta.create({ categories: [], brands: [] });
  if (category && !meta.categories.includes(category)) {
    meta.categories.push(category);
    meta.categories.sort();
  }
  if (brand && !meta.brands.includes(brand)) {
    meta.brands.push(brand);
    meta.brands.sort();
  }
  await meta.save();
}

router.get("/products/meta", async (_req, res) => {
  const meta = await ProductMeta.findOne();
  res.json({ categories: meta?.categories || [], brands: meta?.brands || [] });
});

router.post("/products/meta/category", async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ message: "category required" });
  await saveMeta(category, undefined);
  const meta = await ProductMeta.findOne();
  res.json({ categories: meta?.categories || [] });
});

router.post("/products/meta/brand", async (req, res) => {
  const { brand } = req.body;
  if (!brand) return res.status(400).json({ message: "brand required" });
  await saveMeta(undefined, brand);
  const meta = await ProductMeta.findOne();
  res.json({ brands: meta?.brands || [] });
});

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
  const meta = await ProductMeta.findOne();

  const prodCategories = all.map((p) => p.category).filter(Boolean);
  const prodBrands = all.map((p) => p.brand).filter(Boolean) as string[];
  const categories = [...new Set([...(meta?.categories || []), ...prodCategories])].sort();
  const brands = [...new Set([...(meta?.brands || []), ...prodBrands])].sort();

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
  const { name, category, brand, stockQuantity, sellingPrice, lowStockThreshold } = req.body;
  const threshold = lowStockThreshold ?? 5;
  const qty = stockQuantity ?? 0;
  const isLowStock = qty <= threshold;
  const product = await Product.create({
    name, category, brand,
    stockQuantity: qty,
    sellingPrice,
    lowStockThreshold: threshold,
    isLowStock,
  });
  await saveMeta(category, brand);
  res.status(201).json({ ...product.toObject(), id: product._id.toString() });
});

router.patch("/products/:id", async (req, res) => {
  const { name, category, brand, stockQuantity, sellingPrice, lowStockThreshold } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Not found" });

  if (name !== undefined) product.name = name;
  if (category !== undefined) product.category = category;
  if (brand !== undefined) product.brand = brand;
  if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
  if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
  if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);

  product.isLowStock = product.stockQuantity <= product.lowStockThreshold;
  await product.save();
  await saveMeta(product.category, product.brand);
  res.json({ ...product.toObject(), id: product._id.toString() });
});

router.delete("/products/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
