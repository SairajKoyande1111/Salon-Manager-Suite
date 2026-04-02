import { useState, useEffect, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { ChevronLeft, Search, Calendar, Filter, Receipt, Eye, Clock, IndianRupee, Scissors, Package, User, Phone } from "lucide-react";
import { InvoiceModal } from "@/components/InvoiceModal";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function StaffHistory() {
  const [, params] = useRoute("/staff/:staffId/history");
  const staffId = params?.staffId;
  const { toast } = useToast();

  const [staffMember, setStaffMember] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [filterYear, setFilterYear] = useState<number>(now.getFullYear());
  const [filterService, setFilterService] = useState("");
  const [viewingBill, setViewingBill] = useState<any>(null);
  const [billLoading, setBillLoading] = useState(false);

  useEffect(() => {
    if (!staffId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [staffRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/staff`),
          fetch(`${API_BASE}/staff/${staffId}/work-history`),
        ]);
        const staffData = await staffRes.json();
        const historyData = await historyRes.json();
        const member = (staffData.staff || []).find((s: any) => (s.id || s._id) === staffId);
        setStaffMember(member || null);
        setHistory(historyData.history || []);
      } catch {
        toast({ title: "Failed to load history", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [staffId]);

  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      const d = new Date(entry.date);
      const matchMonth = d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      const matchService = !filterService || entry.items.some((item: any) =>
        item.name.toLowerCase().includes(filterService.toLowerCase())
      );
      return matchMonth && matchService;
    });
  }, [history, filterMonth, filterYear, filterService]);

  const stats = useMemo(() => ({
    bills: filteredHistory.length,
    services: filteredHistory.reduce((a: number, h: any) => a + h.items.length, 0),
    revenue: filteredHistory.reduce((a: number, h: any) => a + h.totalEarned, 0),
  }), [filteredHistory]);

  const openInvoice = async (billId: string) => {
    setBillLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bills/${billId}`);
      if (!res.ok) throw new Error();
      const bill = await res.json();
      setViewingBill(bill);
    } catch {
      toast({ title: "Failed to load invoice", variant: "destructive" });
    } finally {
      setBillLoading(false);
    }
  };

  const yearOptions = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/staff">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        {staffMember ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full rose-gold-gradient text-white flex items-center justify-center font-bold text-sm">
              {staffMember.avatarInitials || staffMember.name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-base">{staffMember.name}</h1>
              <p className="text-xs text-muted-foreground">{staffMember.specialization} · Work History</p>
            </div>
          </div>
        ) : (
          <h1 className="font-bold text-base">Work History</h1>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Bills Served", value: stats.bills, suffix: "" },
              { label: "Services Done", value: stats.services, suffix: "" },
              { label: "Revenue Earned", value: `₹${stats.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, suffix: "" },
            ].map(stat => (
              <div key={stat.label} className="bg-card rounded-2xl border border-border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

          {/* Month */}
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          {/* Year */}
          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Service Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by service name..."
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          {(filterService) && (
            <button
              onClick={() => setFilterService("")}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >Clear</button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {filteredHistory.length} record{filteredHistory.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm">Loading work history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground bg-card border border-border rounded-2xl">
            <Receipt className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">No records found</p>
            <p className="text-xs text-center text-muted-foreground/60">
              No work history for {MONTHS[filterMonth]} {filterYear}
              {filterService ? ` matching "${filterService}"` : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((entry, i) => {
              const date = new Date(entry.date);
              return (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  {/* Row Header */}
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-border/50">
                    {/* Bill # */}
                    <div className="shrink-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Bill</p>
                      <p className="font-bold text-primary text-sm">{entry.billNumber}</p>
                    </div>

                    <div className="w-px h-8 bg-border shrink-0" />

                    {/* Client */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="font-semibold text-sm truncate">{entry.customerName}</p>
                      </div>
                      {entry.customerPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground">{entry.customerPhone}</p>
                        </div>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">
                        {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">Bill</p>
                      <p className="font-bold text-primary">₹{entry.totalEarned.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                    </div>

                    {/* View Invoice */}
                    <button
                      onClick={() => openInvoice(entry.billId)}
                      disabled={billLoading}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-semibold disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5" /> Invoice
                    </button>
                  </div>

                  {/* Services */}
                  <div className="px-5 py-3 flex flex-wrap gap-2">
                    {entry.items.map((item: any, j: number) => (
                      <div key={j} className="bg-muted/50 rounded-lg px-3 py-1.5 text-xs font-medium text-foreground">
                        {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
                      </div>
                    ))}
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="capitalize px-2 py-1 bg-muted rounded-lg">{entry.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {viewingBill && (
        <InvoiceModal bill={viewingBill} onClose={() => setViewingBill(null)} />
      )}
    </div>
  );
}
