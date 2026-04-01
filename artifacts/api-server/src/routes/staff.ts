import { Router } from "express";
import { Staff } from "../models/index.js";

const router = Router();

router.get("/staff", async (_req, res) => {
  const staff = await Staff.find().sort({ name: 1 });
  res.json({ staff: staff.map((s) => ({ ...s.toObject(), id: s._id.toString() })) });
});

router.post("/staff", async (req, res) => {
  const { name, specialization, commissionPercent, phone } = req.body;
  const avatarInitials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const member = await Staff.create({
    name,
    specialization,
    commissionPercent: commissionPercent ?? 10,
    phone,
    avatarInitials,
  });
  res.status(201).json({ ...member.toObject(), id: member._id.toString() });
});

export default router;
