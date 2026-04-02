import { useState } from "react";
import {
  Users, Receipt, TrendingUp, AlertCircle, Star, Package,
  CalendarDays, Clock, CheckCircle2, XCircle, Scissors, ShoppingBag
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, parseISO } from "date-fns";
import { InvoiceModal } from "@/components/InvoiceModal";

const API_BASE = "/api";

function useStats() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`);
      setData(await res.json());
    } catch {}
    setLoading(false);
  };
  useState(() => { refresh(); });
  return { data, loading };
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const PRODUCT_COLORS = ["#7c3aed", "#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff"];
const SERVICE_COLORS = ["#be185d", "#db2777", "#ec4899", "#f472b6", "#fbcfe8"];

export default function Dashboard() {
  const { data: stats, loading } = useStats();
  const [apptTab, setApptTab] = useState<"today" | "week" | "month">("today");
  const [viewInvoiceBill, setViewInvoiceBill] = useState<any>(null);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="col-span-2 h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const s = stats || {} as any;
  const todayRevenue = s.todayRevenue || 0;
  const todayBills = s.todayBills || 0;
  const todayCustomers = s.todayCustomers || 0;
  const totalCustomers = s.totalCustomers || 0;
  const pendingAppointments = s.pendingAppointments || 0;
  const lowStockCount = s.lowStockCount || 0;
  const topServices = s.topServices || [];
  const topProducts = s.topProducts || [];
  const todayBillsList = s.todayBillsList || [];
  const todayAppts = s.todayAppointments || [];
  const weekAppts = s.weekAppointments || [];
  const monthAppts = s.monthAppointments || [];

  const apptList = apptTab === "today" ? todayAppts : apptTab === "week" ? weekAppts : monthAppts;

  const metricCards = [
    {
      label: "Today's Revenue",
      value: `₹${todayRevenue.toLocaleString("en-IN")}`,
      sub: `${todayBills} bill${todayBills !== 1 ? "s" : ""} today`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Today's Customers",
      value: todayCustomers,
      sub: `${totalCustomers} total registered`,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      label: "Pending Appointments",
      value: pendingAppointments,
      sub: lowStockCount > 0 ? `${lowStockCount} low stock alert${lowStockCount !== 1 ? "s" : ""}` : "All stock levels OK",
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {metricCards.map(card => (
          <Card key={card.label} className={`rounded-2xl border ${card.border} shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${card.bg} ${card.color}`}>Live</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Services */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-secondary" /> Top Services This Month
            </h3>
            {topServices.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Scissors className="w-10 h-10 opacity-20" />
                <p className="text-sm">No service data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={topServices} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={85} />
                  <Tooltip
                    formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {topServices.map((_: any, i: number) => (
                      <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Products Analytics */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <ShoppingBag className="w-4 h-4 text-secondary" /> Top Products This Month
            </h3>
            {topProducts.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Package className="w-10 h-10 opacity-20" />
                <p className="text-sm">No product sales yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={topProducts} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.length > 10 ? v.substring(0, 10) + "…" : v} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {topProducts.map((_: any, i: number) => (
                        <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {topProducts.slice(0, 3).map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRODUCT_COLORS[i] }} />
                        <span className="text-muted-foreground">{p.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{p.count} sold · ₹{Number(p.revenue).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Today's Bills */}
        <Card className="lg:col-span-3 rounded-2xl border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Receipt className="w-4 h-4 text-secondary" /> Today's Bills
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {todayBillsList.length} bill{todayBillsList.length !== 1 ? "s" : ""}
              </span>
            </div>
            {todayBillsList.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Receipt className="w-10 h-10 mx-auto opacity-20 mb-2" />
                <p className="text-sm">No bills yet today</p>
                <p className="text-xs mt-1">Bills created from POS will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {todayBillsList.map((bill: any) => (
                  <button
                    key={bill.id || bill._id}
                    onClick={() => setViewInvoiceBill(bill)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{bill.billNumber}</p>
                        <p className="text-xs text-muted-foreground">{bill.customerName} · {bill.createdAt ? format(new Date(bill.createdAt), "hh:mm a") : ""}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-600">₹{Number(bill.finalAmount).toLocaleString("en-IN")}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{bill.paymentMethod}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="lg:col-span-2 rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-secondary" /> Appointments
            </h3>
            {/* Tab */}
            <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
              {(["today", "week", "month"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setApptTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${apptTab === tab ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tab === "today" ? "Today" : tab === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>

            {apptList.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CalendarDays className="w-9 h-9 mx-auto opacity-20 mb-2" />
                <p className="text-xs">No appointments for {apptTab === "today" ? "today" : apptTab === "week" ? "this week" : "this month"}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {apptList.map((appt: any) => (
                  <div key={appt.id || appt._id} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="font-semibold text-xs text-foreground truncate">{appt.customerName}</p>
                          <span className={`inline-block shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[appt.status] || "bg-muted text-muted-foreground"}`}>
                            {appt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Scissors className="w-3 h-3 shrink-0" />
                          <span className="truncate">{appt.serviceName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/70">
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{appt.appointmentTime}</span>
                          {apptTab !== "today" && <span>· {appt.appointmentDate ? format(parseISO(appt.appointmentDate), "dd MMM") : ""}</span>}
                          <span>· {appt.staffName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {apptList.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {apptList.filter((a: any) => a.status === "completed").length} completed</span>
                <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> {apptList.filter((a: any) => a.status === "cancelled").length} cancelled</span>
                <span className="font-medium text-foreground">{apptList.length} total</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Modal */}
      {viewInvoiceBill && (
        <InvoiceModal bill={viewInvoiceBill} onClose={() => setViewInvoiceBill(null)} />
      )}
    </div>
  );
}
