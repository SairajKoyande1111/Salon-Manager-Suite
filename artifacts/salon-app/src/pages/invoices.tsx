import { useState, useMemo } from "react";
import { Search, FileText, Filter, X, Eye, Calendar, Phone } from "lucide-react";
import { format } from "date-fns";
import { InvoiceModal } from "@/components/InvoiceModal";
import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api";

async function fetchBills() {
  const res = await fetch(`${API_BASE}/bills`);
  if (!res.ok) throw new Error("Failed to fetch bills");
  return res.json();
}

const PAY_METHODS = ["all", "cash", "card", "upi", "online"];
const PAY_COLORS: Record<string, string> = {
  cash: "bg-emerald-100 text-emerald-700",
  card: "bg-blue-100 text-blue-700",
  upi: "bg-violet-100 text-violet-700",
  online: "bg-sky-100 text-sky-700",
};

export default function Invoices() {
  const { data, isLoading } = useQuery({ queryKey: ["bills"], queryFn: fetchBills });

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [viewBill, setViewBill] = useState<any>(null);

  const bills: any[] = data?.bills || [];

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      const term = search.toLowerCase();
      const matchSearch =
        !term ||
        b.customerName?.toLowerCase().includes(term) ||
        b.customerPhone?.includes(term) ||
        b.billNumber?.toLowerCase().includes(term);
      const matchPay = payFilter === "all" || b.paymentMethod === payFilter;
      const date = new Date(b.createdAt);
      const matchFrom = !fromDate || date >= new Date(fromDate);
      const matchTo = !toDate || date <= new Date(toDate + "T23:59:59");
      return matchSearch && matchPay && matchFrom && matchTo;
    });
  }, [bills, search, fromDate, toDate, payFilter]);

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPayFilter("all");
  };

  const hasFilters = search || fromDate || toDate || payFilter !== "all";

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            All generated bills — view, filter & download invoices.
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-semibold text-sm">
          {filtered.length} Invoice{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone or invoice no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-muted/30"
            />
          </div>

          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium px-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-muted/30"
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium px-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-muted/30"
            />
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium px-1">Payment</label>
            <select
              value={payFilter}
              onChange={(e) => setPayFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-muted/30 capitalize"
            >
              {PAY_METHODS.map((m) => (
                <option key={m} value={m} className="capitalize">{m === "all" ? "All Methods" : m.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm text-muted-foreground"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                <th className="p-4 pl-6">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    Loading invoices...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No invoices found</p>
                    {hasFilters && (
                      <p className="text-muted-foreground/60 text-sm mt-1">Try clearing your filters</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((bill: any) => (
                  <tr key={bill.id || bill._id} className="hover:bg-muted/20 transition-colors group">
                    {/* Invoice # */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary/50" />
                        <span className="font-mono font-semibold text-sm text-primary">
                          {bill.billNumber}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {(bill.customerName || "WI").substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{bill.customerName || "Walk-in"}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4">
                      {bill.customerPhone ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          {bill.customerPhone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-sm italic">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {bill.createdAt ? format(new Date(bill.createdAt), "dd MMM yyyy, hh:mm a") : "—"}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PAY_COLORS[bill.paymentMethod] || "bg-muted text-muted-foreground"}`}>
                        {bill.paymentMethod}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="p-4">
                      <span className="font-bold text-emerald-600 text-sm">
                        ₹{Number(bill.finalAmount).toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${bill.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {bill.status === "paid" ? "✓" : "⏳"} {bill.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setViewBill(bill)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold ml-auto"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex justify-between items-center text-sm text-muted-foreground">
            <span>Showing {filtered.length} of {bills.length} invoices</span>
            <span className="font-semibold text-foreground">
              Total: ₹{filtered.reduce((sum: number, b: any) => sum + Number(b.finalAmount || 0), 0).toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {viewBill && (
        <InvoiceModal bill={viewBill} onClose={() => setViewBill(null)} />
      )}
    </div>
  );
}
