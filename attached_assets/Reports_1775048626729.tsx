import { useState } from "react";
import { useGetRevenueReport, useGetDashboardStats } from "@workspace/api-client-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Receipt, Star, Download } from "lucide-react";

const COLORS = ["#7c3aed", "#c084fc", "#f472b6", "#fb923c", "#34d399", "#60a5fa"];

const staffRevenue = [
  { name: "Priya", revenue: 220000, services: 148, commission: 44000 },
  { name: "Kavya", revenue: 185000, services: 102, commission: 40700 },
  { name: "Anjali", revenue: 142000, services: 119, commission: 25560 },
  { name: "Sneha", revenue: 98000, services: 89, commission: 16660 },
  { name: "Riya", revenue: 72000, services: 76, commission: 10800 },
];

const serviceRevenue = [
  { name: "Bridal Makeup", revenue: 185000, count: 24, avgTicket: 7708 },
  { name: "Keratin Treatment", revenue: 127500, count: 51, avgTicket: 2500 },
  { name: "Hair Color", revenue: 96000, count: 120, avgTicket: 800 },
  { name: "Gold Facial", revenue: 72000, count: 60, avgTicket: 1200 },
  { name: "Body Massage", revenue: 65000, count: 65, avgTicket: 1000 },
  { name: "Hair Spa", revenue: 42000, count: 70, avgTicket: 600 },
];

const customerAcquisition = [
  { month: "Oct", new: 42, returning: 148 },
  { month: "Nov", new: 58, returning: 162 },
  { month: "Dec", new: 74, returning: 180 },
  { month: "Jan", new: 55, returning: 175 },
  { month: "Feb", new: 63, returning: 188 },
  { month: "Mar", new: 68, returning: 196 },
];

const categoryShare = [
  { name: "Hair", value: 35 },
  { name: "Facial", value: 22 },
  { name: "Spa", value: 18 },
  { name: "Makeup", value: 15 },
  { name: "Nails", value: 10 },
];

export default function Reports() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const { data: revenueData } = useGetRevenueReport({ period });
  const { data: dashData } = useGetDashboardStats();

  const chartData = revenueData?.data?.length
    ? revenueData.data
    : [
        { label: "Mon", revenue: 38200, bills: 19, customers: 15 },
        { label: "Tue", revenue: 52400, bills: 26, customers: 21 },
        { label: "Wed", revenue: 41800, bills: 21, customers: 18 },
        { label: "Thu", revenue: 68900, bills: 34, customers: 28 },
        { label: "Fri", revenue: 89200, bills: 44, customers: 36 },
        { label: "Sat", revenue: 112600, bills: 56, customers: 48 },
        { label: "Sun", revenue: 78400, bills: 39, customers: 32 },
      ];

  const totalRevenue = revenueData?.totalRevenue || 812400;
  const totalBills = revenueData?.totalBills || 524;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Comprehensive business performance insights</p>
        </div>
        <button className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Month Revenue", value: `₹${(totalRevenue).toLocaleString()}`, icon: TrendingUp, trend: "+18.3%", color: "bg-violet-50 text-violet-700" },
          { label: "Total Bills", value: totalBills, icon: Receipt, trend: "+8.2%", color: "bg-rose-50 text-rose-700" },
          { label: "Avg Ticket", value: `₹${Math.round(totalRevenue / (totalBills || 1)).toLocaleString()}`, icon: Star, trend: "+5.1%", color: "bg-amber-50 text-amber-700" },
          { label: "New Customers", value: (dashData?.totalCustomers || 1847).toLocaleString(), icon: Users, trend: "+12.4%", color: "bg-emerald-50 text-emerald-700" },
        ].map((k, i) => (
          <Card key={i} className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                  <p className="text-2xl font-bold font-serif mt-1">{k.value}</p>
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">{k.trend}</span>
                </div>
                <div className={`w-10 h-10 rounded-xl ${k.color} flex items-center justify-center`}>
                  <k.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Trend */}
      <Card className="rounded-2xl border-border/50 shadow-lg mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold font-serif">Revenue Trend</h3>
            <div className="flex bg-muted p-1 rounded-xl gap-1">
              {(["daily", "weekly", "monthly"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${period === p ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,.12)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#rg1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Service Revenue Bar */}
        <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-serif mb-4">Service Revenue Breakdown</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceRevenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `₹${v / 1000}k`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`]} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={18}>
                    {serviceRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card className="rounded-2xl border-border/50 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-serif mb-4">Category Split</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryShare} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {categoryShare.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {categoryShare.map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-xs text-muted-foreground">{c.name} {c.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="rounded-2xl border-border/50 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-serif mb-4">Customer Acquisition</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerAcquisition}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new" name="New" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="returning" name="Returning" fill="#c084fc" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card className="rounded-2xl border-border/50 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-serif mb-4">Staff Performance</h3>
            <div className="space-y-3">
              {staffRevenue.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full rose-gold-gradient text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-muted-foreground">₹{(s.revenue / 1000).toFixed(0)}k · {s.services} svcs</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(s.revenue / staffRevenue[0].revenue) * 100}%`, background: COLORS[i] }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Commission: ₹{s.commission.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
