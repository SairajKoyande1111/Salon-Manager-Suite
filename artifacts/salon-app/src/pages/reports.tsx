import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp, TrendingDown, Users, Receipt, Star, Clock,
  Scissors, Package, CreditCard, BarChart3, UserCheck, Repeat,
} from "lucide-react";
import { format } from "date-fns";

const API_BASE = "/api";

const PALETTE = ["#7c3aed", "#db2777", "#ea580c", "#059669", "#2563eb", "#d97706", "#0891b2", "#7c3aed"];
const PAY_COLORS: Record<string, string> = { cash: "#059669", upi: "#7c3aed", card: "#2563eb", wallet: "#ea580c" };

function StatCard({ label, value, sub, icon: Icon, color, bg, trend }: any) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title, sub }: any) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.name !== "Bills" && p.name !== "Count"
            ? `₹${p.value.toLocaleString("en-IN")}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const [range, setRange] = useState<"month" | "quarter" | "year">("month");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [analytics, setAnalytics] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [aRes, tRes] = await Promise.all([
          fetch(`${API_BASE}/reports/analytics?range=${range}`),
          fetch(`${API_BASE}/reports/revenue?period=${period}`),
        ]);
        setAnalytics(await aRes.json());
        setTrend(await tRes.json());
      } catch {}
      setLoading(false);
    };
    loadAll();
  }, [range, period]);

  const s = analytics?.summary || {};
  const topServices: any[] = analytics?.topServices || [];
  const topProducts: any[] = analytics?.topProducts || [];
  const staffPerf: any[] = analytics?.staffPerformance || [];
  const paymentMix: any[] = analytics?.paymentMix || [];
  const peakHours: any[] = analytics?.peakHours || [];
  const catShare: any[] = analytics?.categoryShare || [];
  const ci = analytics?.customerInsights || {};
  const trendData: any[] = trend?.data || [];

  const rangeLabel = range === "month" ? "This Month" : range === "quarter" ? "Last 3 Months" : "This Year";

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real business insights · {format(new Date(), "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center bg-muted rounded-xl p-1">
          {(["month", "quarter", "year"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${range === r ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {r === "month" ? "This Month" : r === "quarter" ? "Quarter" : "This Year"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={`Revenue (${rangeLabel})`} value={`₹${(s.totalRevenue || 0).toLocaleString("en-IN")}`} sub={`${s.totalBills || 0} bills`} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" trend={s.revGrowth} />
        <StatCard label="Avg Ticket Size" value={`₹${(s.avgTicket || 0).toLocaleString("en-IN")}`} sub="per bill" icon={Receipt} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="Active Customers" value={s.periodCustCount || 0} sub={`of ${s.totalCustomers || 0} total`} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Customer Retention" value={`${ci.retentionRate || 0}%`} sub={`${ci.repeatCustomers || 0} repeat clients`} icon={Repeat} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* Revenue Trend */}
      <Card className="rounded-2xl border-border/50 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <SectionHeader icon={BarChart3} title="Revenue Trend" sub="Track income over time" />
            <div className="flex bg-muted p-1 rounded-xl gap-1">
              {(["daily", "weekly", "monthly"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${period === p ? "bg-card shadow text-primary" : "text-muted-foreground"}`}>
                  {p === "daily" ? "7 Days" : p === "weekly" ? "6 Weeks" : "6 Months"}
                </button>
              ))}
            </div>
          </div>
          {trendData.length === 0 || trendData.every(d => d.revenue === 0) ? (
            <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <BarChart3 className="w-10 h-10 opacity-20" />
              <p className="text-sm">No revenue data yet for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trendData} margin={{ left: 0, right: 10, top: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => v === 0 ? "₹0" : `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: "#7c3aed", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#7c3aed" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {trendData.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">₹{(trend?.totalRevenue || 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{trend?.totalBills || 0}</p>
                <p className="text-xs text-muted-foreground">Total Bills</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">₹{trend?.totalBills > 0 ? Math.round((trend?.totalRevenue || 0) / trend?.totalBills).toLocaleString("en-IN") : 0}</p>
                <p className="text-xs text-muted-foreground">Avg per Bill</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services + Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Service Performance */}
        <Card className="lg:col-span-3 rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={Scissors} title="Service Performance" sub={rangeLabel} />
            {topServices.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Scissors className="w-10 h-10 opacity-20" />
                <p className="text-sm">No service data yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topServices.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => v === 0 ? "₹0" : `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={100} tickFormatter={(v: string) => v.length > 14 ? v.substring(0, 14) + "…" : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} barSize={16}>
                      {topServices.slice(0, 6).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 divide-y divide-border/40">
                  {topServices.slice(0, 5).map((svc: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="flex-1 font-medium text-foreground truncate">{svc.name}</span>
                      <span className="text-muted-foreground">{svc.count}x</span>
                      <span className="font-semibold text-foreground w-20 text-right">₹{svc.revenue.toLocaleString("en-IN")}</span>
                      <span className="text-muted-foreground w-16 text-right">avg ₹{svc.avgTicket.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Category Split */}
        <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={Star} title="Revenue by Category" sub="Service categories" />
            {catShare.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Star className="w-10 h-10 opacity-20" />
                <p className="text-sm">No category data yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={catShare} innerRadius={45} outerRadius={72} dataKey="revenue" paddingAngle={3}>
                      {catShare.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`]} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {catShare.map((c: any, i: number) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="flex-1 text-muted-foreground">{c.name}</span>
                      <span className="font-semibold text-foreground">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff + Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Staff Performance */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={UserCheck} title="Staff Performance" sub="Revenue & commission breakdown" />
            {staffPerf.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <UserCheck className="w-10 h-10 opacity-20" />
                <p className="text-sm">No staff data yet — assign staff while billing</p>
              </div>
            ) : (
              <div className="space-y-4">
                {staffPerf.map((st: any, i: number) => {
                  const maxRev = staffPerf[0]?.revenue || 1;
                  const pct = Math.round((st.revenue / maxRev) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: PALETTE[i % PALETTE.length] }}>
                          {st.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm text-foreground truncate">{st.name}</span>
                            <span className="font-bold text-sm text-foreground shrink-0">₹{st.revenue.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: PALETTE[i % PALETTE.length] }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                            <span>{st.services} service{st.services !== 1 ? "s" : ""}</span>
                            <span>Commission ({st.commissionPct}%): ₹{st.commission.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Mix */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={CreditCard} title="Payment Methods" sub="How customers pay" />
            {paymentMix.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <CreditCard className="w-10 h-10 opacity-20" />
                <p className="text-sm">No payment data yet</p>
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <div className="w-[140px] h-[140px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentMix} dataKey="amount" innerRadius={35} outerRadius={60} paddingAngle={3}>
                        {paymentMix.map((p: any) => <Cell key={p.method} fill={PAY_COLORS[p.method] || "#94a3b8"} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {paymentMix.map((p: any) => {
                    const total = paymentMix.reduce((s: number, x: any) => s + x.amount, 0);
                    const pct = total > 0 ? Math.round((p.amount / total) * 100) : 0;
                    return (
                      <div key={p.method}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PAY_COLORS[p.method] || "#94a3b8" }} />
                            <span className="text-xs font-semibold capitalize text-foreground">{p.method}</span>
                          </div>
                          <span className="text-xs font-bold text-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PAY_COLORS[p.method] || "#94a3b8" }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.count} transactions · ₹{p.amount.toLocaleString("en-IN")}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours + Products + Customer Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Peak Hours */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={Clock} title="Busiest Hours" sub="When you get most customers" />
            {peakHours.every((h: any) => h.count === 0) ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Clock className="w-10 h-10 opacity-20" />
                <p className="text-sm">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={peakHours} margin={{ left: -10, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} interval={1} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))" }} formatter={(v: any) => [v, "Bills"]} />
                  <Bar dataKey="count" name="Bills" radius={[4, 4, 0, 0]}>
                    {peakHours.map((h: any, i: number) => (
                      <Cell key={i} fill={h.count === Math.max(...peakHours.map((x: any) => x.count)) ? "#7c3aed" : "#c4b5fd"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={Package} title="Product Sales" sub={rangeLabel} />
            {topProducts.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Package className="w-10 h-10 opacity-20" />
                <p className="text-sm">No product sales yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p: any, i: number) => {
                  const maxRev = topProducts[0]?.revenue || 1;
                  const pct = Math.round((p.revenue / maxRev) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">{p.count} sold</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PALETTE[i % PALETTE.length] }} />
                      </div>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">₹{p.revenue.toLocaleString("en-IN")}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Health */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={Users} title="Customer Health" sub="Retention & loyalty" />
            <div className="space-y-4 mt-2">
              <div className="text-center py-4 bg-violet-50 rounded-2xl">
                <p className="text-3xl font-bold text-violet-700">{ci.retentionRate || 0}%</p>
                <p className="text-xs text-violet-600 font-medium mt-0.5">Retention Rate</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 text-center">
                  <p className="text-xl font-bold text-foreground">{ci.totalCustomers || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Total Clients</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-center">
                  <p className="text-xl font-bold text-foreground">{ci.repeatCustomers || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Repeat Clients</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-center">
                  <p className="text-xl font-bold text-foreground">{ci.uniqueBilledCustomers || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Billed Clients</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-center">
                  <p className="text-xl font-bold text-emerald-600">{(ci.uniqueBilledCustomers || 0) - (ci.repeatCustomers || 0)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">First-timers</p>
                </div>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                {ci.retentionRate >= 60 ? "Excellent retention — keep rewarding loyal clients" :
                 ci.retentionRate >= 40 ? "Good retention — consider a membership programme" :
                 "Focus on bringing back past customers"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
