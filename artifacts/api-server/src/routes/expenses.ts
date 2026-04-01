import { Router } from "express";
import { Expense } from "../models/index.js";

const router = Router();

router.get("/expenses", async (_req, res) => {
  const expenses = await Expense.find().sort({ date: -1 });
  res.json({
    expenses: expenses.map((e) => ({ ...e.toObject(), id: e._id.toString() })),
  });
});

router.post("/expenses", async (req, res) => {
  const { category, description, amount, date } = req.body;
  const expense = await Expense.create({ category, description, amount, date });
  res.status(201).json({ ...expense.toObject(), id: expense._id.toString() });
});

export default router;
