import { Router } from "express";
import { Appointment, Customer, Service, Staff } from "../models/index.js";

const router = Router();

router.get("/appointments", async (req, res) => {
  const { date, month } = req.query as Record<string, string>;

  let query: any = {};
  if (month) {
    query = { appointmentDate: { $regex: `^${month}` } };
  } else if (date) {
    query = { appointmentDate: date };
  }

  const appointments = await Appointment.find(query).sort({ appointmentTime: 1 });
  res.json({
    appointments: appointments.map((a) => ({
      ...a.toObject(),
      id: a._id.toString(),
    })),
  });
});

router.post("/appointments", async (req, res) => {
  const { customerId, staffId, serviceId, appointmentDate, appointmentTime, notes } = req.body;

  let customerName = "Walk-in";
  let customerPhone = "";
  if (customerId) {
    const customer = await Customer.findById(customerId);
    if (customer) {
      customerName = customer.name;
      customerPhone = customer.phone;
    }
  }

  const staffMember = await Staff.findById(staffId);
  const service = await Service.findById(serviceId);

  const appointment = await Appointment.create({
    customerId: customerId || undefined,
    customerName,
    customerPhone,
    staffId,
    staffName: staffMember?.name || "Unknown",
    serviceId,
    serviceName: service?.name || "Unknown",
    serviceCategory: service?.category || "General",
    duration: service?.duration || 30,
    appointmentDate,
    appointmentTime,
    status: "scheduled",
    notes,
  });

  res.status(201).json({ ...appointment.toObject(), id: appointment._id.toString() });
});

router.put("/appointments/:appointmentId", async (req, res) => {
  const { appointmentId } = req.params;
  const { status, notes, customerId, staffId, serviceId, appointmentDate, appointmentTime } = req.body;

  const update: any = {};
  if (status !== undefined) update.status = status;
  if (notes !== undefined) update.notes = notes;
  if (appointmentDate !== undefined) update.appointmentDate = appointmentDate;
  if (appointmentTime !== undefined) update.appointmentTime = appointmentTime;

  if (customerId !== undefined) {
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        update.customerId = customerId;
        update.customerName = customer.name;
        update.customerPhone = customer.phone;
      }
    } else {
      update.customerId = null;
      update.customerName = "Walk-in";
      update.customerPhone = "";
    }
  }
  if (staffId) {
    const staffMember = await Staff.findById(staffId);
    if (staffMember) {
      update.staffId = staffId;
      update.staffName = staffMember.name;
    }
  }
  if (serviceId) {
    const service = await Service.findById(serviceId);
    if (service) {
      update.serviceId = serviceId;
      update.serviceName = service.name;
      update.serviceCategory = service.category;
      update.duration = service.duration;
    }
  }

  const appointment = await Appointment.findByIdAndUpdate(appointmentId, update, { new: true });
  if (!appointment) return res.status(404).json({ error: "Appointment not found" });
  res.json({ ...appointment.toObject(), id: appointment._id.toString() });
});

router.delete("/appointments/:appointmentId", async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findByIdAndDelete(appointmentId);
  if (!appointment) return res.status(404).json({ error: "Appointment not found" });
  res.status(204).send();
});

export default router;
