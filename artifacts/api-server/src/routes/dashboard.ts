import { Router } from "express";
import { Bill, Customer, Appointment, Product, Service } from "../models/index.js";
import { format } from "date-fns";

const router = Router();

router.get("/dashboard/stats", async (_req, res) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Today's bills
  const todayBillDocs = await Bill.find({
    createdAt: { $gte: new Date(today), $lt: new Date(today + "T23:59:59.999Z") },
  });
  const todayRevenue = todayBillDocs.reduce((s, b) => s + b.finalAmount, 0);
  const todayBills = todayBillDocs.length;
  const todayCustomerIds = new Set(todayBillDocs.map((b) => b.customerId).filter(Boolean));
  const todayCustomers = todayCustomerIds.size;

  // Month bills
  const monthBillDocs = await Bill.find({ createdAt: { $gte: firstOfMonth } });
  const monthRevenue = monthBillDocs.reduce((s, b) => s + b.finalAmount, 0);
  const monthBills = monthBillDocs.length;

  // Total customers
  const totalCustomers = await Customer.countDocuments();

  // Pending appointments
  const pendingAppointments = await Appointment.countDocuments({
    status: { $in: ["scheduled", "confirmed"] },
    appointmentDate: { $gte: today },
  });

  // Low stock
  const lowStockCount = await Product.countDocuments({ isLowStock: true });

  // Top services (from bills)
  const serviceRevMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const bill of monthBillDocs) {
    for (const item of bill.items) {
      if (item.type === "service") {
        if (!serviceRevMap[item.itemId]) {
          serviceRevMap[item.itemId] = { name: item.name, revenue: 0, count: 0 };
        }
        serviceRevMap[item.itemId].revenue += item.total;
        serviceRevMap[item.itemId].count += item.quantity;
      }
    }
  }
  const topServices = Object.values(serviceRevMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top staff (from bills)
  const staffRevMap: Record<string, { name: string; revenue: number }> = {};
  for (const bill of monthBillDocs) {
    for (const item of bill.items) {
      if (item.staffId && item.staffName) {
        if (!staffRevMap[item.staffId]) {
          staffRevMap[item.staffId] = { name: item.staffName, revenue: 0 };
        }
        staffRevMap[item.staffId].revenue += item.total;
      }
    }
  }
  const topStaff = Object.values(staffRevMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Recent bills
  const recentBills = await Bill.find().sort({ createdAt: -1 }).limit(10);

  res.json({
    todayRevenue,
    todayBills,
    todayCustomers,
    totalCustomers,
    monthRevenue,
    monthBills,
    pendingAppointments,
    lowStockCount,
    topServices,
    topStaff,
    recentBills: recentBills.map((b) => ({ ...b.toObject(), id: b._id.toString() })),
  });
});

export default router;
