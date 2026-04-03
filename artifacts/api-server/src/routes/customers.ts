import { Router } from "express";
import { format } from "date-fns";
import { Customer, Appointment, Bill, CustomerMembership } from "../models/index.js";

const router = Router();

// List customers with optional search (includes active membership)
router.get("/customers", async (req, res) => {
  const { search } = req.query;
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }
    : {};
  const customers = await Customer.find(query).sort({ createdAt: -1 });
  const today = format(new Date(), "yyyy-MM-dd");
  const customerIds = customers.map((c) => c._id.toString());
  const activeMemberships = await CustomerMembership.find({
    customerId: { $in: customerIds },
    isActive: true,
    endDate: { $gte: today },
  });
  const membershipMap: Record<string, any> = {};
  for (const cm of activeMemberships) {
    membershipMap[cm.customerId] = { ...cm.toObject(), id: cm._id.toString() };
  }
  res.json({
    customers: customers.map((c) => ({
      ...c.toObject(),
      id: c._id.toString(),
      activeMembership: membershipMap[c._id.toString()] || null,
    })),
  });
});

// Create customer
router.post("/customers", async (req, res) => {
  const { name, phone, email, dob, notes, gender } = req.body;
  const customer = await Customer.create({ name, phone, email, dob, notes, gender });
  res.status(201).json({ ...customer.toObject(), id: customer._id.toString() });
});

// Update customer
router.patch("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const { name, phone, dob, notes, email, gender } = req.body;
  const customer = await Customer.findByIdAndUpdate(
    customerId,
    {
      ...(name && { name }), ...(phone && { phone }),
      ...(dob !== undefined && { dob }), ...(notes !== undefined && { notes }),
      ...(email !== undefined && { email }), ...(gender !== undefined && { gender }),
    },
    { new: true }
  );
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json({ ...customer.toObject(), id: customer._id.toString() });
});

// Delete customer
router.delete("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const customer = await Customer.findByIdAndDelete(customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.status(204).send();
});

// Get single customer with bills and appointments
// Phone is the primary key for all bill/visit calculations
router.get("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const customer = await Customer.findById(customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const today = format(new Date(), "yyyy-MM-dd");
  const phone = customer.phone;

  // Query bills by customerId OR customerPhone so phone is the true primary key
  const billQuery = phone
    ? { $or: [{ customerId: customerId.toString() }, { customerPhone: phone }] }
    : { customerId: customerId.toString() };

  const [bills, appointments, activeMembership] = await Promise.all([
    Bill.find(billQuery).sort({ createdAt: -1 }),
    Appointment.find({
      $or: [{ customerId: customerId.toString() }, { customerPhone: phone }],
    }).sort({ appointmentDate: -1 }),
    CustomerMembership.findOne({ customerId: customerId.toString(), isActive: true, endDate: { $gte: today } }),
  ]);

  // Re-compute spend and visits from actual bills (phone-based)
  const computedTotalSpend = bills.reduce((sum, b) => sum + (b.finalAmount || 0), 0);
  const computedTotalVisits = bills.length;
  const lastVisit = bills.length > 0 ? bills[0].createdAt : null;

  // Sync stored values if drifted
  if (customer.totalSpend !== computedTotalSpend || customer.totalVisits !== computedTotalVisits) {
    await Customer.findByIdAndUpdate(customerId, {
      totalSpend: computedTotalSpend,
      totalVisits: computedTotalVisits,
    });
  }

  res.json({
    ...customer.toObject(),
    id: customer._id.toString(),
    totalSpend: computedTotalSpend,
    totalVisits: computedTotalVisits,
    lastVisit,
    activeMembership: activeMembership ? { ...activeMembership.toObject(), id: activeMembership._id.toString() } : null,
    bills: bills.map((b) => ({ ...b.toObject(), id: b._id.toString() })),
    appointments: appointments.map((a) => ({ ...a.toObject(), id: a._id.toString() })),
  });
});

export default router;
