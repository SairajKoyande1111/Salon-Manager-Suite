import { Router } from "express";
import { Bill, Customer, Appointment, Product } from "../models/index.js";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const router = Router();

router.get("/dashboard/stats", async (_req, res) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const firstOfMonth = startOfMonth(now);

  // Today's bills (for metric + list)
  const todayBillDocs = await Bill.find({
    createdAt: { $gte: new Date(today), $lt: new Date(today + "T23:59:59.999Z") },
  }).sort({ createdAt: -1 });

  const todayRevenue = todayBillDocs.reduce((s, b) => s + b.finalAmount, 0);
  const todayBills = todayBillDocs.length;
  const todayCustomerIds = new Set(todayBillDocs.map((b) => b.customerId).filter(Boolean));
  const todayCustomers = todayCustomerIds.size + todayBillDocs.filter(b => !b.customerId).length;

  // Total customers
  const totalCustomers = await Customer.countDocuments();

  // Pending appointments
  const pendingAppointments = await Appointment.countDocuments({
    status: { $in: ["scheduled", "confirmed"] },
    appointmentDate: { $gte: today },
  });

  // Low stock
  const lowStockCount = await Product.countDocuments({ isLowStock: true });

  // Month bills for analytics
  const monthBillDocs = await Bill.find({ createdAt: { $gte: firstOfMonth } });

  // Top services
  const serviceRevMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const bill of monthBillDocs) {
    for (const item of bill.items) {
      if (item.type === "service") {
        if (!serviceRevMap[item.itemId]) serviceRevMap[item.itemId] = { name: item.name, revenue: 0, count: 0 };
        serviceRevMap[item.itemId].revenue += item.total;
        serviceRevMap[item.itemId].count += item.quantity;
      }
    }
  }
  const topServices = Object.values(serviceRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Top products
  const productRevMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const bill of monthBillDocs) {
    for (const item of bill.items) {
      if (item.type === "product") {
        if (!productRevMap[item.itemId]) productRevMap[item.itemId] = { name: item.name, revenue: 0, count: 0 };
        productRevMap[item.itemId].revenue += item.total;
        productRevMap[item.itemId].count += item.quantity;
      }
    }
  }
  const topProducts = Object.values(productRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Appointments - today, this week, this month
  const [todayAppts, weekAppts, monthAppts] = await Promise.all([
    Appointment.find({ appointmentDate: today }).sort({ appointmentTime: 1 }),
    Appointment.find({ appointmentDate: { $gte: weekStart, $lte: weekEnd } }).sort({ appointmentDate: 1, appointmentTime: 1 }),
    Appointment.find({ appointmentDate: { $gte: monthStart, $lte: monthEnd } }).sort({ appointmentDate: 1, appointmentTime: 1 }),
  ]);

  const mapAppt = (a: any) => ({ ...a.toObject(), id: a._id.toString() });

  res.json({
    todayRevenue,
    todayBills,
    todayCustomers,
    totalCustomers,
    pendingAppointments,
    lowStockCount,
    topServices,
    topProducts,
    todayBillsList: todayBillDocs.map((b) => ({ ...b.toObject(), id: b._id.toString() })),
    todayAppointments: todayAppts.map(mapAppt),
    weekAppointments: weekAppts.map(mapAppt),
    monthAppointments: monthAppts.map(mapAppt),
  });
});

export default router;
