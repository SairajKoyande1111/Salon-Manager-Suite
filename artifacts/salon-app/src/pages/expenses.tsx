import { useState } from "react";
import { useListExpenses, useCreateExpense } from "@workspace/api-client-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const COLORS = ["#7c3aed", "#f472b6", "#fb923c", "#34d399", "#60a5fa", "#e879f9"];

const DUMMY_EXPENSES = [
  { id: "1", category: "Rent", description: "Monthly salon rent - March", amount: 45000, date: "2026-03-01", createdAt: "2026-03-01T09:00:00Z" },
  { id: "2", category: "Salaries", description: "Staff salaries - February", amount: 125000, date: "2026-02-28", createdAt: "2026-02-28T10:00:00Z" },
  { id: "3", category: "Products", description: "L'Oreal & Wella product restock", amount: 28500, date: "2026-03-05", createdAt: "2026-03-05T11:00:00Z" },
  { id: "4", category: "Utilities", description: "Electricity & water bill", amount: 12800, date: "2026-03-10", createdAt: "2026-03-10T09:00:00Z" },
  { id: "5", category: "Marketing", description: "Instagram promotions", amount: 8500, date: "2026-03-08", createdAt: "2026-03-08T14:00:00Z" },
  { id: "6", category: "Equipment", description: "Hair steamer repair", amount: 5200, date: "2026-03-12", createdAt: "2026-03-12T10:00:00Z" },
];

const categories = ["Rent", "Salaries", "Products", "Utilities", "Marketing", "Equipment", "Miscellaneous"];

export default function Expenses() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useListExpenses();
  const createExpense = useCreateExpense();
  const [showModal, setShowModal] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [form, setForm] = useState({ category: "Rent", description: "", amount: "", date: format(new Date(), 'yyyy-MM-dd') });

  const apiExpenses = data?.expenses || [];
  const expenses = apiExpenses.length > 0 ? apiExpenses : DUMMY_EXPENSES;

  const filtered = filterCat === "All" ? expenses : expenses.filter((e: any) => e.category === filterCat);
  const total = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const filteredTotal = filtered.reduce((s: number, e: any) => s + Number(e.amount), 0);

  const byCategory = categories.map(cat => ({
    name: cat,
    value: expenses.filter((e: any) => e.category === cat).reduce((s: number, e: any) => s + Number(e.amount), 0)
  })).filter(c => c.value > 0);

  const monthlyTrend = [
    { month: "Oct", amount: 198000 },
    { month: "Nov", amount: 215000 },
    { month: "Dec", amount: 248000 },
    { month: "Jan", amount: 202000 },
    { month: "Feb", amount: 229000 },
    { month: "Mar", amount: total },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate({
      data: { category: form.category, description: form.description, amount: Number(form.amount), date: form.date }
    }, {
      onSuccess: () => { toast({ title: "Expense added!" }); setShowModal(false); refetch(); setForm({ category: "Rent", description: "", amount: "", date: format(new Date(), 'yyyy-MM-dd') }); },
      onError: () => toast({ title: "Failed to add", variant: "destructive" })
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track and manage all salon expenditures</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20 text-sm">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl border-border/50 shadow-sm col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total This Month</p>
            <p className="text-2xl font-bold font-serif mt-1 text-destructive">₹{total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{expenses.length} transactions</p>
          </CardContent>
        </Card>
        {byCategory.slice(0, 3).map((c, i) => (
          <Card key={i} className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{c.name}</p>
              <p className="text-xl font-bold font-serif mt-1">₹{c.value.toLocaleString()}</p>
              <div className="h-1.5 bg-muted rounded-full mt-2">
                <div className="h-full rounded-full" style={{ width: `${(c.value / total) * 100}%`, background: COLORS[i] }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-serif mb-4">6-Month Trend</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ borderRadius: 12, border: "none" }} />
                  <Bar dataKey="amount" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-serif mb-4">By Category</h3>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {byCategory.map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                  <span className="text-[10px] text-muted-foreground truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card className="rounded-2xl border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h3 className="text-lg font-bold font-serif">All Expenses</h3>
            <div className="flex gap-2 flex-wrap">
              {["All", ...categories].map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterCat === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Date", "Category", "Description", "Amount"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((e: any, i: number) => {
                  const catIdx = categories.indexOf(e.category);
                  return (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 text-muted-foreground text-xs">{e.date}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: COLORS[catIdx % COLORS.length] + "20", color: COLORS[catIdx % COLORS.length] }}>
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-foreground">{e.description}</td>
                      <td className="py-3 px-3 font-bold text-destructive">₹{Number(e.amount).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td colSpan={3} className="py-3 px-3 font-bold text-sm">Total ({filterCat})</td>
                  <td className="py-3 px-3 font-bold text-destructive text-base">₹{filteredTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-serif font-bold text-primary">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
                <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none appearance-none">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
                <input required type="text" placeholder="What was this expense for?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                  <input required type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
                  <input required type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createExpense.isPending} className="flex-1 py-3 rounded-xl rose-gold-gradient text-white font-bold text-sm disabled:opacity-50">
                  {createExpense.isPending ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
