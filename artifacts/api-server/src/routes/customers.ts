import { Router } from "express";
import { Customer, Appointment, Bill } from "../models/index.js";

const router = Router();

// List customers with optional search
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
  res.json({
    customers: customers.map((c) => ({ ...c.toObject(), id: c._id.toString() })),
  });
});

// Create customer
router.post("/customers", async (req, res) => {
  const { name, phone, email, dob, notes } = req.body;
  const customer = await Customer.create({ name, phone, email, dob, notes });
  res.status(201).json({ ...customer.toObject(), id: customer._id.toString() });
});

// Update customer
router.patch("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const { name, phone, dob, notes, email } = req.body;
  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { ...(name && { name }), ...(phone && { phone }), ...(dob !== undefined && { dob }), ...(notes !== undefined && { notes }), ...(email !== undefined && { email }) },
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
router.get("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const customer = await Customer.findById(customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const [bills, appointments] = await Promise.all([
    Bill.find({ customerId: customerId.toString() }).sort({ createdAt: -1 }),
    Appointment.find({ customerId: customerId.toString() }).sort({ appointmentDate: -1 }),
  ]);

  // Compute last visit from most recent bill
  const lastVisit = bills.length > 0 ? bills[0].createdAt : null;

  res.json({
    ...customer.toObject(),
    id: customer._id.toString(),
    lastVisit,
    bills: bills.map((b) => ({ ...b.toObject(), id: b._id.toString() })),
    appointments: appointments.map((a) => ({ ...a.toObject(), id: a._id.toString() })),
  });
});

export default router;
