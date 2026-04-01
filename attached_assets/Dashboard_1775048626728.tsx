import { useGetDashboardStats } from "@workspace/api-client-react";
import { Users, Receipt, TrendingUp, AlertCircle, Star, Zap, Award, ShoppingBag } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const s = stats || {};
  const todayRevenue = s.todayRevenue || 0;
  const todayBills = s.todayBills || 0;
  const todayCustomers = s.todayCustomers || 0;
  const totalCustomers = s.totalCustomers || 0;
  const monthRevenue = s.monthRevenue || 0;
  const monthBills = s.monthBills || 0;
  const pendingAppointments = s.pendingAppointments || 0;
  const lowStockCount = s.lowStockCount || 0;
  const topServices = s.topServices || [];
  const topStaff = s.topStaff || [];
  const recentBills = s.recentBills || [];

  const metricCards = [
    { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString("en-IN")}`, sub: `${todayBills} bills today`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Today's Customers", value: todayCustomers, sub: `${totalCustomers} total clients`, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Month Revenue", value: `₹${monthRevenue.toLocaleString("en-IN")}`, sub: `${monthBills} bills this month`, icon: Award, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Pending Appointments", value: pendingAppointments, sub: `${lowStockCount} low stock products`, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const paymentMix = [
    { name: "UPI", value: recentBills.filter((b: any) => b.paymentMethod === "upi").length, color: "#7c3aed" },
    { name: "Card", value: recentBills.filter((b: any) => b.paymentMethod === "card").length, color: "#c084fc" },
    { name: "Cash", value: recentBills.filter((b: any) => b.paymentMethod === "cash").length, color: "#f472b6" },
    { name: "Wallet", value: recentBills.filter((b: any) => b.paymentMethod === "wallet").length, color: "#fb923c" },
  ].filter(p => p.value > 0);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricCards.map(card => (
          <Card key={card.label} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Services */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" /> Top Services
            </h3>
            {topServices.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No service data yet. Start billing to see analytics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Staff */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-secondary" /> Top Staff by Revenue
            </h3>
            {topStaff.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No staff revenue data yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topStaff.map((member: any, i: number) => {
                  const maxRev = topStaff[0]?.revenue || 1;
                  const pct = Math.round((member.revenue / maxRev) * 100);
                  return (
                    <div key={member.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-muted-foreground">₹{member.revenue.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills */}
        <Card className="lg:col-span-2 rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-secondary" /> Recent Bills
            </h3>
            {recentBills.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No bills yet. Create your first bill from the POS.
              </div>
            ) : (
              <div className="space-y-2">
                {recentBills.map((bill: any) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{bill.billNumber}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(bill.createdAt), "dd MMM, hh:mm a")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">₹{Number(bill.finalAmount).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground capitalize">{bill.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Mix */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-secondary" /> Payment Mix
            </h3>
            {paymentMix.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm text-center">
                No payment data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={paymentMix} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {paymentMix.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
