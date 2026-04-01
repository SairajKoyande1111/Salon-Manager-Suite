import { Router } from "express";
import { Service } from "../models/index.js";

const router = Router();

router.get("/services", async (_req, res) => {
  const services = await Service.find().sort({ category: 1, name: 1 });
  const categories = [...new Set(services.map((s) => s.category))];
  res.json({
    services: services.map((s) => ({ ...s.toObject(), id: s._id.toString() })),
    categories,
  });
});

router.post("/services", async (req, res) => {
  const { name, category, price, duration } = req.body;
  const service = await Service.create({ name, category, price, duration });
  res.status(201).json({ ...service.toObject(), id: service._id.toString() });
});

export default router;
