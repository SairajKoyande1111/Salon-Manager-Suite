import { X, Download, Printer, Scissors, Package, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const SALON = {
  name: "AT SALON",
  tagline: "Beauty & Wellness Studio",
  address: "123, MG Road, Koramangala, Bengaluru – 560034",
  phone: "+91 98765 43210",
  email: "hello@atsalon.in",
  gstin: "29AABCT1332L1ZU",
};

interface BillItem {
  type: string;
  name: string;
  staffName?: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
}

interface Bill {
  id?: string;
  _id?: string;
  billNumber: string;
  customerName: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string | Date;
}

interface InvoiceModalProps {
  bill: Bill;
  onClose: () => void;
}

const PAY_ICONS: Record<string, string> = {
  cash: "💵",
  card: "💳",
  upi: "📱",
  online: "🌐",
};

export function InvoiceModal({ bill, onClose }: InvoiceModalProps) {
  const handlePrint = () => {
    const el = document.getElementById("invoice-print-area");
    if (!el) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice – ${bill.billNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; }
          .page { max-width: 720px; margin: 0 auto; padding: 40px; }
          /* header */
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
          .brand-name { font-size: 28px; font-weight: 800; letter-spacing: 3px; color: #7c3aed; font-family: Georgia, serif; }
          .brand-tag { font-size: 11px; color: #9f7aea; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
          .salon-info { font-size: 11px; color: #666; line-height: 1.7; text-align: right; }
          .divider { border: none; border-top: 2px solid #7c3aed; margin: 20px 0; }
          .divider-thin { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
          /* invoice meta */
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
          .meta-block h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 6px; }
          .meta-block p { font-size: 14px; font-weight: 600; color: #111; }
          .meta-block .sub { font-size: 12px; color: #666; font-weight: 400; }
          .badge { display: inline-block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; margin-top: 4px; }
          /* table */
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .items-table thead th { background: #f5f3ff; color: #7c3aed; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px; text-align: left; }
          .items-table thead th:last-child { text-align: right; }
          .items-table tbody td { padding: 11px 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
          .items-table tbody td:last-child { text-align: right; font-weight: 600; }
          .item-type { font-size: 10px; color: #9ca3af; text-transform: uppercase; }
          .item-staff { font-size: 11px; color: #6b7280; margin-top: 2px; }
          .strike { text-decoration: line-through; color: #9ca3af; font-size: 11px; }
          /* totals */
          .totals { margin-left: auto; width: 260px; margin-top: 8px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #555; }
          .totals-row.grand { font-size: 17px; font-weight: 800; color: #7c3aed; border-top: 2px solid #7c3aed; padding-top: 10px; margin-top: 4px; }
          /* payment */
          .payment-row { margin-top: 20px; display: flex; align-items: center; gap: 10px; }
          .pay-badge { background: #ede9fe; color: #6d28d9; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; text-transform: capitalize; }
          /* footer */
          .footer { margin-top: 36px; text-align: center; border-top: 1px dashed #e5e7eb; padding-top: 20px; }
          .footer p { font-size: 12px; color: #9ca3af; line-height: 1.7; }
          .footer strong { color: #7c3aed; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  };

  const invoiceDate = bill.createdAt ? new Date(bill.createdAt) : new Date();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-card rounded-3xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-serif font-bold text-primary">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow shadow-primary/20"
            >
              <Download className="w-4 h-4" /> Download / Print
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Invoice */}
        <div className="overflow-y-auto flex-1 p-6">
          <div id="invoice-print-area" className="page" style={{ maxWidth: 720, margin: "0 auto", padding: 40, fontFamily: "'Segoe UI', Arial, sans-serif", color: "#1a1a2e", background: "#fff" }}>

            {/* Salon Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 3, color: "#7c3aed", fontFamily: "Georgia, serif" }}>
                  {SALON.name}
                </div>
                <div style={{ fontSize: 11, color: "#9f7aea", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>
                  {SALON.tagline}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#666", lineHeight: 1.7, textAlign: "right" }}>
                <div>{SALON.address}</div>
                <div>{SALON.phone}</div>
                <div>{SALON.email}</div>
                <div style={{ marginTop: 2 }}>GSTIN: {SALON.gstin}</div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "2px solid #7c3aed", margin: "0 0 20px 0" }} />

            {/* Invoice Meta + Customer */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#9ca3af", marginBottom: 4 }}>Bill To</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{bill.customerName}</div>
                {bill.customerPhone && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>📞 {bill.customerPhone}</div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#9ca3af", marginBottom: 4 }}>Invoice Details</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#7c3aed" }}>#{bill.billNumber}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  {format(invoiceDate, "dd MMM yyyy, hh:mm a")}
                </div>
                <div style={{ display: "inline-block", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, marginTop: 6 }}>
                  ✓ {bill.status?.toUpperCase() || "PAID"}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr style={{ background: "#f5f3ff" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#7c3aed" }}>#</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#7c3aed" }}>Description</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#7c3aed" }}>Qty</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#7c3aed" }}>Rate</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#7c3aed" }}>Disc</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#7c3aed" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "11px 12px", fontSize: 13, color: "#9ca3af" }}>{i + 1}</td>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12 }}>{item.type === "service" ? "✂️" : "📦"}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{item.name}</div>
                          {item.staffName && (
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>by {item.staffName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px", textAlign: "center", fontSize: 13 }}>{item.quantity}</td>
                    <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 13 }}>₹{Number(item.price).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 13, color: item.discount > 0 ? "#dc2626" : "#9ca3af" }}>
                      {item.discount > 0 ? `−₹${Number(item.discount).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#111" }}>
                      ₹{Number(item.total).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginLeft: "auto", width: 260, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "#555" }}>
                <span>Subtotal</span>
                <span>₹{Number(bill.subtotal).toLocaleString("en-IN")}</span>
              </div>
              {bill.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "#dc2626" }}>
                  <span>Discount</span>
                  <span>− ₹{Number(bill.discountAmount).toLocaleString("en-IN")}</span>
                </div>
              )}
              {bill.taxAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "#555" }}>
                  <span>Tax ({bill.taxPercent}%)</span>
                  <span>₹{Number(bill.taxAmount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 17, fontWeight: 800, color: "#7c3aed", borderTop: "2px solid #7c3aed", marginTop: 6 }}>
                <span>Total</span>
                <span>₹{Number(bill.finalAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Payment */}
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Payment via</span>
              <span style={{ background: "#ede9fe", color: "#6d28d9", borderRadius: 8, padding: "5px 14px", fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                {PAY_ICONS[bill.paymentMethod] || "💳"} {bill.paymentMethod}
              </span>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 40, textAlign: "center", borderTop: "1px dashed #e5e7eb", paddingTop: 20 }}>
              <p style={{ fontSize: 14, color: "#7c3aed", fontWeight: 700, fontFamily: "Georgia, serif" }}>
                Thank you for choosing AT Salon! 🌸
              </p>
              <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.7, marginTop: 6 }}>
                All services are non-refundable. Products may be exchanged within 7 days of purchase with receipt.<br />
                For queries: {SALON.phone} | {SALON.email}
              </p>
              <p style={{ fontSize: 10, color: "#c4b5fd", marginTop: 12, letterSpacing: 1 }}>
                Powered by AT SALON Management Suite
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
