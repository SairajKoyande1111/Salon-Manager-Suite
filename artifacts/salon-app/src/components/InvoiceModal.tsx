import { X, Download } from "lucide-react";
import { format } from "date-fns";

const SALON = {
  name: "thetouch",
  tagline: "Unisex Salon",
  slogan: "Where Style Meets Perfection",
  address: "Shop B 11, Chanakya building kalubai chowk,\nLodha Casario road Dombivali East",
  phone: "+91 90210 64849",
  email: "thetouch@gmail.com",
};

const LOGO_URL = "/thetouch-logo.jpg";

const poppins = "'Poppins', sans-serif";

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

export function InvoiceModal({ bill, onClose }: InvoiceModalProps) {
  const handlePrint = () => {
    const el = document.getElementById("invoice-print-area");
    if (!el) return;
    const win = window.open("", "_blank", "width=820,height=960");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice – ${bill.billNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Poppins', sans-serif; color: #111; background: #fff; }
          .page { max-width: 720px; margin: 0 auto; padding: 48px 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
          .logo-circle { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; border: 2px solid #111; background: #000; flex-shrink: 0; }
          .logo-circle img { width: 100%; height: 100%; object-fit: cover; }
          .brand-block { margin-left: 14px; }
          .brand-name { font-size: 22px; font-weight: 800; color: #111; letter-spacing: 1px; }
          .brand-tag { font-size: 10px; color: #555; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
          .invoice-label { text-align: right; }
          .invoice-word { font-size: 32px; font-weight: 800; color: #111; letter-spacing: 4px; text-transform: uppercase; }
          .invoice-num { font-size: 13px; font-weight: 500; color: #555; margin-top: 4px; }
          .divider { border: none; border-top: 2px solid #111; margin: 0 0 24px 0; }
          .divider-thin { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
          .meta-block h4 { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 6px; font-weight: 600; }
          .meta-block p { font-size: 14px; font-weight: 700; color: #111; }
          .meta-block .sub { font-size: 12px; color: #555; font-weight: 400; margin-top: 2px; }
          .meta-block .addr { font-size: 11px; color: #555; line-height: 1.7; margin-top: 2px; }
          .badge-paid { display: inline-block; border: 1.5px solid #111; border-radius: 20px; padding: 2px 12px; font-size: 10px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .items-table thead th { background: #111; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; padding: 10px 14px; text-align: left; font-weight: 600; }
          .items-table thead th:last-child { text-align: right; }
          .items-table thead th.center { text-align: center; }
          .items-table tbody td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; vertical-align: top; color: #111; }
          .items-table tbody td:last-child { text-align: right; font-weight: 600; }
          .items-table tbody td.center { text-align: center; }
          .item-staff { font-size: 11px; color: #888; margin-top: 3px; }
          .totals { margin-left: auto; width: 280px; margin-top: 16px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #555; }
          .totals-row.discount { color: #111; }
          .totals-grand { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 800; color: #111; border-top: 2px solid #111; margin-top: 6px; }
          .payment-section { margin-top: 24px; display: flex; align-items: center; gap: 10px; }
          .pay-label { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; font-weight: 600; }
          .pay-value { border: 1.5px solid #111; border-radius: 6px; padding: 4px 14px; font-size: 12px; font-weight: 700; text-transform: capitalize; color: #111; }
          .footer { margin-top: 48px; text-align: center; border-top: 1px dashed #ccc; padding-top: 24px; }
          .footer-main { font-size: 15px; font-weight: 700; color: #111; }
          .footer-sub { font-size: 11px; color: #888; line-height: 1.8; margin-top: 8px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  const invoiceDate = bill.createdAt ? new Date(bill.createdAt) : new Date();
  const f = poppins;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col" style={{ fontFamily: f }}>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: f }}>Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" /> Download / Print
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Invoice */}
        <div className="overflow-y-auto flex-1 p-6 bg-gray-50">
          <div id="invoice-print-area" className="page" style={{ maxWidth: 720, margin: "0 auto", padding: "48px 40px", fontFamily: f, color: "#111", background: "#fff", borderRadius: 12 }}>

            {/* ── HEADER: Logo + Invoice label ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              {/* Logo + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "2px solid #111", background: "#000", flexShrink: 0 }}>
                  <img src={LOGO_URL} alt="thetouch logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: 1, fontFamily: f }}>{SALON.name}</div>
                  <div style={{ fontSize: 10, color: "#777", letterSpacing: 3, textTransform: "uppercase", marginTop: 2, fontFamily: f }}>{SALON.tagline}</div>
                </div>
              </div>
              {/* INVOICE label + number */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#111", letterSpacing: 5, textTransform: "uppercase", fontFamily: f }}>INVOICE</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#555", marginTop: 4, fontFamily: f }}>#{bill.billNumber}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2, fontFamily: f }}>{format(invoiceDate, "dd MMM yyyy, hh:mm a")}</div>
              </div>
            </div>

            {/* Divider */}
            <hr style={{ border: "none", borderTop: "2px solid #111", margin: "0 0 24px 0" }} />

            {/* ── Salon info + Bill To ── */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
              {/* Salon contact */}
              <div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "#999", marginBottom: 6, fontWeight: 600, fontFamily: f }}>From</div>
                <div style={{ fontSize: 11, color: "#444", lineHeight: 1.8, fontFamily: f, whiteSpace: "pre-line" }}>{SALON.address}</div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 4, fontFamily: f }}>{SALON.phone}</div>
                <div style={{ fontSize: 11, color: "#444", fontFamily: f }}>{SALON.email}</div>
              </div>
              {/* Bill To */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "#999", marginBottom: 6, fontWeight: 600, fontFamily: f }}>Bill To</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111", fontFamily: f }}>{bill.customerName}</div>
                {bill.customerPhone && (
                  <div style={{ fontSize: 12, color: "#555", marginTop: 4, fontFamily: f }}>{bill.customerPhone}</div>
                )}
                <div style={{ display: "inline-block", border: "1.5px solid #111", borderRadius: 20, padding: "2px 12px", fontSize: 10, fontWeight: 700, color: "#111", marginTop: 8, textTransform: "uppercase", letterSpacing: 1, fontFamily: f }}>
                  ✓ {bill.status?.toUpperCase() || "PAID"}
                </div>
              </div>
            </div>

            {/* ── Items Table ── */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={{ background: "#111", color: "#fff", padding: "10px 14px", textAlign: "left", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, fontFamily: f }}>#</th>
                  <th style={{ background: "#111", color: "#fff", padding: "10px 14px", textAlign: "left", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, fontFamily: f }}>Description</th>
                  <th style={{ background: "#111", color: "#fff", padding: "10px 14px", textAlign: "center", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, fontFamily: f }}>Qty</th>
                  <th style={{ background: "#111", color: "#fff", padding: "10px 14px", textAlign: "right", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, fontFamily: f }}>Rate</th>
                  <th style={{ background: "#111", color: "#fff", padding: "10px 14px", textAlign: "right", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, fontFamily: f }}>Disc</th>
                  <th style={{ background: "#111", color: "#fff", padding: "10px 14px", textAlign: "right", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, fontFamily: f }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#999", fontFamily: f }}>{i + 1}</td>
                    <td style={{ padding: "12px 14px", fontFamily: f }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{item.name}</div>
                      {item.staffName && (
                        <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>by {item.staffName}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, fontFamily: f }}>{item.quantity}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontFamily: f }}>₹{Number(item.price).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, color: item.discount > 0 ? "#555" : "#bbb", fontFamily: f }}>
                      {item.discount > 0 ? `−₹${Number(item.discount).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#111", fontFamily: f }}>
                      ₹{Number(item.total).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Totals ── */}
            <div style={{ marginLeft: "auto", width: 280, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "#555", fontFamily: f }}>
                <span>Subtotal</span>
                <span>₹{Number(bill.subtotal).toLocaleString("en-IN")}</span>
              </div>
              {bill.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "#111", fontFamily: f }}>
                  <span>Discount</span>
                  <span>− ₹{Number(bill.discountAmount).toLocaleString("en-IN")}</span>
                </div>
              )}
              {bill.taxAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "#555", fontFamily: f }}>
                  <span>GST ({bill.taxPercent}%)</span>
                  <span>₹{Number(bill.taxAmount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 18, fontWeight: 800, color: "#111", borderTop: "2px solid #111", marginTop: 6, fontFamily: f }}>
                <span>Total</span>
                <span>₹{Number(bill.finalAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "#999", fontWeight: 600, fontFamily: f }}>Payment via</span>
              <span style={{ border: "1.5px solid #111", borderRadius: 6, padding: "4px 14px", fontSize: 12, fontWeight: 700, textTransform: "capitalize", color: "#111", fontFamily: f }}>
                {bill.paymentMethod}
              </span>
            </div>

            {/* ── Footer ── */}
            <div style={{ marginTop: 48, textAlign: "center", borderTop: "1px dashed #ccc", paddingTop: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111", fontFamily: f }}>
                Thank you for choosing thetouch!
              </div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.8, marginTop: 8, fontFamily: f }}>
                All services are non-refundable. Products may be exchanged within 7 days with receipt.<br />
                {SALON.phone} &nbsp;|&nbsp; {SALON.email}
              </div>
              <div style={{ fontSize: 10, color: "#bbb", marginTop: 14, letterSpacing: 2, textTransform: "uppercase", fontFamily: f }}>
                {SALON.slogan}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
