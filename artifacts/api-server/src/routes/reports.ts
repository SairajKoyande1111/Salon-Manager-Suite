import { Router } from "express";
import { Bill } from "../models/index.js";
import { format, subDays, startOfWeek, addDays } from "date-fns";

const router = Router();

router.get("/reports/revenue", async (req, res) => {
  const period = (req.query.period as string) || "daily";

  const bills = await Bill.find().sort({ createdAt: 1 });

  let data: { label: string; revenue: number; bills: number; customers: number }[] = [];

  if (period === "daily") {
    // Last 7 days
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    data = days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayBills = bills.filter(
        (b) => format(new Date(b.createdAt), "yyyy-MM-dd") === dateStr
      );
      const customerIds = new Set(dayBills.map((b) => b.customerId).filter(Boolean));
      return {
        label: format(day, "EEE"),
        revenue: dayBills.reduce((s, b) => s + b.finalAmount, 0),
        bills: dayBills.length,
        customers: customerIds.size,
      };
    });
  } else if (period === "weekly") {
    // Last 6 weeks
    for (let i = 5; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7));
      const weekEnd = addDays(weekStart, 6);
      const weekBills = bills.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= weekStart && d <= weekEnd;
      });
      const customerIds = new Set(weekBills.map((b) => b.customerId).filter(Boolean));
      data.push({
        label: `W${6 - i}`,
        revenue: weekBills.reduce((s, b) => s + b.finalAmount, 0),
        bills: weekBills.length,
        customers: customerIds.size,
      });
    }
  } else {
    // Monthly — last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthBills = bills.filter((b) => {
        const bd = new Date(b.createdAt);
        return bd.getFullYear() === year && bd.getMonth() === month;
      });
      const customerIds = new Set(monthBills.map((b) => b.customerId).filter(Boolean));
      data.push({
        label: format(d, "MMM"),
        revenue: monthBills.reduce((s, b) => s + b.finalAmount, 0),
        bills: monthBills.length,
        customers: customerIds.size,
      });
    }
  }

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalBills = data.reduce((s, d) => s + d.bills, 0);

  res.json({ period, totalRevenue, totalBills, data });
});

export default router;
