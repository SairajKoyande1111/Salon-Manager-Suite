import { Router } from "express";
import { addMonths, format, parseISO, isAfter } from "date-fns";
import { Membership, CustomerMembership, Customer } from "../models/index.js";

const router = Router();

// ── Membership Plans ──────────────────────────────────────

router.get("/memberships", async (_req, res) => {
  const memberships = await Membership.find().sort({ price: 1 });
  res.json({
    memberships: memberships.map((m) => ({ ...m.toObject(), id: m._id.toString() })),
  });
});

router.post("/memberships", async (req, res) => {
  const { name, price, duration, benefits, discountPercent } = req.body;
  const membership = await Membership.create({
    name,
    price,
    duration,
    benefits: benefits || "",
    discountPercent: discountPercent || 0,
  });
  res.status(201).json({ ...membership.toObject(), id: membership._id.toString() });
});

router.delete("/memberships/:id", async (req, res) => {
  const { id } = req.params;
  const membership = await Membership.findByIdAndDelete(id);
  if (!membership) return res.status(404).json({ error: "Membership not found" });
  res.status(204).send();
});

// ── Customer Memberships ──────────────────────────────────

// Assign a membership to a customer (revokes existing active membership first)
router.post("/customer-memberships", async (req, res) => {
  const { customerId, membershipId, startDate } = req.body;

  const [customer, membership] = await Promise.all([
    Customer.findById(customerId),
    Membership.findById(membershipId),
  ]);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  if (!membership) return res.status(404).json({ error: "Membership not found" });

  // Deactivate any existing active membership for this customer
  await CustomerMembership.updateMany(
    { customerId: customerId.toString(), isActive: true },
    { isActive: false }
  );

  const start = startDate ? parseISO(startDate) : new Date();
  const end = addMonths(start, membership.duration);

  const cm = await CustomerMembership.create({
    customerId: customerId.toString(),
    customerName: customer.name,
    membershipId: membershipId.toString(),
    membershipName: membership.name,
    price: membership.price,
    discountPercent: membership.discountPercent,
    benefits: membership.benefits,
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
    isActive: true,
  });

  res.status(201).json({ ...cm.toObject(), id: cm._id.toString() });
});

// List all active customer memberships
router.get("/customer-memberships", async (_req, res) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const memberships = await CustomerMembership.find({ isActive: true, endDate: { $gte: today } }).sort({ createdAt: -1 });
  res.json({
    customerMemberships: memberships.map((cm) => ({ ...cm.toObject(), id: cm._id.toString() })),
  });
});

// Get active membership for a specific customer
router.get("/customer-memberships/customer/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const today = format(new Date(), "yyyy-MM-dd");
  const cm = await CustomerMembership.findOne({
    customerId,
    isActive: true,
    endDate: { $gte: today },
  });
  if (!cm) return res.json({ membership: null });
  res.json({ membership: { ...cm.toObject(), id: cm._id.toString() } });
});

// Revoke a customer membership
router.delete("/customer-memberships/:id", async (req, res) => {
  const { id } = req.params;
  const cm = await CustomerMembership.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!cm) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

export default router;
