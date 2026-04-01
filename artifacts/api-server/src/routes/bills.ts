import { Router } from "express";
import { Bill, Customer } from "../models/index.js";

const router = Router();

// Generate sequential bill number
async function generateBillNumber(): Promise<string> {
  const count = await Bill.countDocuments();
  const num = String(count + 1).padStart(5, "0");
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `BILL-${yy}${mm}-${num}`;
}

router.get("/bills", async (_req, res) => {
  const bills = await Bill.find().sort({ createdAt: -1 }).limit(100);
  res.json({
    bills: bills.map((b) => ({ ...b.toObject(), id: b._id.toString() })),
  });
});

router.post("/bills", async (req, res) => {
  const {
    customerId,
    customerName,
    customerPhone,
    items,
    subtotal,
    taxPercent,
    taxAmount,
    discountAmount,
    finalAmount,
    paymentMethod,
    status,
  } = req.body;

  const billNumber = await generateBillNumber();

  const bill = await Bill.create({
    billNumber,
    customerId: customerId || undefined,
    customerName: customerName || "Walk-in",
    customerPhone: customerPhone || "",
    items: items || [],
    subtotal: subtotal || 0,
    taxPercent: taxPercent || 0,
    taxAmount: taxAmount || 0,
    discountAmount: discountAmount || 0,
    finalAmount,
    paymentMethod,
    status: status || "paid",
  });

  // Update customer totalSpend and totalVisits if linked
  if (customerId) {
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalSpend: finalAmount, totalVisits: 1 },
    });
  }

  res.status(201).json({ ...bill.toObject(), id: bill._id.toString(), billNumber });
});

export default router;
