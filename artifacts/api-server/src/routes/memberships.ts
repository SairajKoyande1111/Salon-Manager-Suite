import { Router } from "express";
import { Membership } from "../models/index.js";

const router = Router();

router.get("/memberships", async (_req, res) => {
  const memberships = await Membership.find().sort({ price: 1 });
  res.json({
    memberships: memberships.map((m) => ({ ...m.toObject(), id: m._id.toString() })),
  });
});

router.post("/memberships", async (req, res) => {
  const { name, price, duration, benefits, discountPercent } = req.body;
  const membership = await Membership.create({
    name,
    price,
    duration,
    benefits: benefits || "",
    discountPercent: discountPercent || 0,
  });
  res.status(201).json({ ...membership.toObject(), id: membership._id.toString() });
});

export default router;
