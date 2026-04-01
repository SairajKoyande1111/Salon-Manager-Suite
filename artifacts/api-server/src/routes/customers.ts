import { Router } from "express";
import { Customer, Appointment } from "../models/index.js";

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

// Get single customer with appointments
router.get("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const customer = await Customer.findById(customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const appointments = await Appointment.find({ customerId }).sort({
    appointmentDate: -1,
  });

  res.json({
    ...customer.toObject(),
    id: customer._id.toString(),
    appointments: appointments.map((a) => ({
      ...a.toObject(),
      id: a._id.toString(),
    })),
  });
});

export default router;
