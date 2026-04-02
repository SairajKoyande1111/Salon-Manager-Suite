import { Router } from "express";
import { Bill, Customer, Appointment, Staff } from "../models/index.js";
import { format, subDays, startOfWeek, addDays, startOfMonth, subMonths, getHours } from "date-fns";

const router = Router();

// Revenue trend (daily / weekly / monthly)
router.get("/reports/revenue", async (req, res) => {
  const period = (req.query.period as string) || "daily";
  const bills = await Bill.find().sort({ createdAt: 1 });

  let data: { label: string; revenue: number; bills: number; customers: number }[] = [];

  if (period === "daily") {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    data = days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayBills = bills.filter((b) => format(new Date(b.createdAt), "yyyy-MM-dd") === dateStr);
      const customerIds = new Set(dayBills.map((b) => b.customerId).filter(Boolean));
      return { label: format(day, "EEE"), revenue: dayBills.reduce((s, b) => s + b.finalAmount, 0), bills: dayBills.length, customers: customerIds.size };
    });
  } else if (period === "weekly") {
    for (let i = 5; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7));
      const weekEnd = addDays(weekStart, 6);
      const weekBills = bills.filter((b) => { const d = new Date(b.createdAt); return d >= weekStart && d <= weekEnd; });
      const customerIds = new Set(weekBills.map((b) => b.customerId).filter(Boolean));
      data.push({ label: `W${6 - i}`, revenue: weekBills.reduce((s, b) => s + b.finalAmount, 0), bills: weekBills.length, customers: customerIds.size });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const year = d.getFullYear(); const month = d.getMonth();
      const monthBills = bills.filter((b) => { const bd = new Date(b.createdAt); return bd.getFullYear() === year && bd.getMonth() === month; });
      const customerIds = new Set(monthBills.map((b) => b.customerId).filter(Boolean));
      data.push({ label: format(d, "MMM"), revenue: monthBills.reduce((s, b) => s + b.finalAmount, 0), bills: monthBills.length, customers: customerIds.size });
    }
  }

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalBills = data.reduce((s, d) => s + d.bills, 0);
  res.json({ period, totalRevenue, totalBills, data });
});

// Full analytics for reports page
router.get("/reports/analytics", async (req, res) => {
  const range = (req.query.range as string) || "month"; // month | quarter | year

  const now = new Date();
  let fromDate: Date;
  if (range === "year") fromDate = new Date(now.getFullYear(), 0, 1);
  else if (range === "quarter") fromDate = subMonths(now, 3);
  else fromDate = startOfMonth(now);

  const [bills, totalCustomers, staffDocs] = await Promise.all([
    Bill.find({ createdAt: { $gte: fromDate } }).sort({ createdAt: 1 }),
    Customer.countDocuments(),
    Staff.find(),
  ]);

  // ── Revenue Summary ──
  const totalRevenue = bills.reduce((s, b) => s + b.finalAmount, 0);
  const totalBills = bills.length;
  const avgTicket = totalBills > 0 ? Math.round(totalRevenue / totalBills) : 0;

  // ── Previous period comparison ──
  const periodLength = now.getTime() - fromDate.getTime();
  const prevFrom = new Date(fromDate.getTime() - periodLength);
  const prevBills = await Bill.find({ createdAt: { $gte: prevFrom, $lt: fromDate } });
  const prevRevenue = prevBills.reduce((s, b) => s + b.finalAmount, 0);
  const revGrowth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

  // ── Service Performance ──
  const serviceMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const bill of bills) {
    for (const item of bill.items) {
      if (item.type === "service") {
        if (!serviceMap[item.itemId]) serviceMap[item.itemId] = { name: item.name, revenue: 0, count: 0 };
        serviceMap[item.itemId].revenue += item.total;
        serviceMap[item.itemId].count += item.quantity;
      }
    }
  }
  const topServices = Object.values(serviceMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map(s => ({ ...s, avgTicket: s.count > 0 ? Math.round(s.revenue / s.count) : 0 }));

  // ── Product Sales ──
  const productMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const bill of bills) {
    for (const item of bill.items) {
      if (item.type === "product") {
        if (!productMap[item.itemId]) productMap[item.itemId] = { name: item.name, revenue: 0, count: 0 };
        productMap[item.itemId].revenue += item.total;
        productMap[item.itemId].count += item.quantity;
      }
    }
  }
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  // ── Staff Performance ──
  const staffMap: Record<string, { name: string; revenue: number; services: number }> = {};
  for (const bill of bills) {
    for (const item of bill.items) {
      if (item.type === "service" && item.staffId && item.staffName) {
        if (!staffMap[item.staffId]) staffMap[item.staffId] = { name: item.staffName, revenue: 0, services: 0 };
        staffMap[item.staffId].revenue += item.total;
        staffMap[item.staffId].services += item.quantity;
      }
    }
  }
  const staffPerformance = Object.entries(staffMap).map(([staffId, data]) => {
    const staffDoc = staffDocs.find(s => s._id.toString() === staffId);
    const commissionPct = staffDoc?.commissionPercent || 10;
    return { ...data, commission: Math.round(data.revenue * commissionPct / 100), commissionPct };
  }).sort((a, b) => b.revenue - a.revenue);

  // ── Payment Mix ──
  const paymentMap: Record<string, { count: number; amount: number }> = {};
  for (const bill of bills) {
    const m = bill.paymentMethod || "cash";
    if (!paymentMap[m]) paymentMap[m] = { count: 0, amount: 0 };
    paymentMap[m].count += 1;
    paymentMap[m].amount += bill.finalAmount;
  }
  const paymentMix = Object.entries(paymentMap).map(([method, d]) => ({ method, ...d })).sort((a, b) => b.amount - a.amount);

  // ── Peak Hours ──
  const hourMap: Record<number, number> = {};
  for (const bill of bills) {
    const hr = getHours(new Date(bill.createdAt));
    hourMap[hr] = (hourMap[hr] || 0) + 1;
  }
  const peakHours = Array.from({ length: 13 }, (_, i) => i + 9).map(hr => ({
    hour: hr <= 12 ? `${hr}am` : hr === 12 ? "12pm" : `${hr - 12}pm`,
    count: hourMap[hr] || 0,
  }));

  // ── Customer Insights ──
  // Repeat customers = customerId appears in > 1 bill overall
  const allBills = await Bill.find({ customerId: { $ne: null, $ne: "" } });
  const custBillCount: Record<string, number> = {};
  for (const b of allBills) {
    if (b.customerId) custBillCount[b.customerId] = (custBillCount[b.customerId] || 0) + 1;
  }
  const repeatCustomers = Object.values(custBillCount).filter(c => c > 1).length;
  const uniqueBilledCustomers = Object.keys(custBillCount).length;

  // Customers who visited in current period
  const periodCustIds = new Set(bills.map(b => b.customerId).filter(Boolean));

  // ── Category Revenue Split ──
  // Derive from service names (naive: use first word as category)
  // Better: group by category from the service name if we had it, but we don't store category in bill items
  // Instead, build from service data and use top service names
  const categoryMap: Record<string, number> = {};
  for (const bill of bills) {
    for (const item of bill.items) {
      if (item.type === "service") {
        // Rough categorization from common keywords
        let cat = "Other";
        const n = item.name.toLowerCase();
        if (n.includes("hair") || n.includes("keratin") || n.includes("color") || n.includes("cut") || n.includes("blow")) cat = "Hair";
        else if (n.includes("facial") || n.includes("skin") || n.includes("cleanup") || n.includes("bleach")) cat = "Skin";
        else if (n.includes("massage") || n.includes("spa") || n.includes("body")) cat = "Spa";
        else if (n.includes("makeup") || n.includes("bridal")) cat = "Makeup";
        else if (n.includes("nail") || n.includes("manicure") || n.includes("pedicure")) cat = "Nails";
        else if (n.includes("threading") || n.includes("wax") || n.includes("eyebrow")) cat = "Threading";
        categoryMap[cat] = (categoryMap[cat] || 0) + item.total;
      }
    }
  }
  const categorySplit = Object.entries(categoryMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const catTotal = categorySplit.reduce((s, c) => s + c.revenue, 0);
  const categoryShare = categorySplit.map(c => ({ ...c, pct: catTotal > 0 ? Math.round((c.revenue / catTotal) * 100) : 0 }));

  res.json({
    summary: { totalRevenue, totalBills, avgTicket, totalCustomers, revGrowth, periodCustCount: periodCustIds.size },
    topServices,
    topProducts,
    staffPerformance,
    paymentMix,
    peakHours,
    customerInsights: { totalCustomers, repeatCustomers, uniqueBilledCustomers, retentionRate: uniqueBilledCustomers > 0 ? Math.round((repeatCustomers / uniqueBilledCustomers) * 100) : 0 },
    categoryShare,
  });
});

export default router;
