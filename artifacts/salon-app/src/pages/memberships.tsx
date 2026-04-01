import { useState } from "react";
import { useListMemberships, useCreateMembership } from "@workspace/api-client-react";
import { Crown, Star, Gem, Plus, X, Check, Users, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const membershipIcons: any = { Silver: Star, Gold: Crown, Platinum: Gem };
const membershipGradients: any = {
  Silver: "from-slate-400 to-slate-600",
  Gold: "from-amber-400 to-yellow-600",
  Platinum: "from-violet-500 to-purple-700",
};
const membershipStats = [
  { label: "Active Members", value: "284", icon: Users, trend: "+12 this month" },
  { label: "Silver Members", value: "142", icon: Star, color: "text-slate-500" },
  { label: "Gold Members", value: "97", icon: Crown, color: "text-amber-500" },
  { label: "Platinum Members", value: "45", icon: Gem, color: "text-violet-600" },
];

const recentMembers = [
  { name: "Meena Krishnan", type: "Gold", since: "Jan 2026", expiry: "Jul 2026", savings: "₹3,840" },
  { name: "Rekha Joshi", type: "Platinum", since: "Mar 2025", expiry: "Mar 2026", savings: "₹18,200" },
  { name: "Sunita Agarwal", type: "Silver", since: "Feb 2026", expiry: "May 2026", savings: "₹980" },
  { name: "Anita Bose", type: "Silver", since: "Jan 2026", expiry: "Apr 2026", savings: "₹1,240" },
  { name: "Pooja Verma", type: "Gold", since: "Dec 2025", expiry: "Jun 2026", savings: "₹5,600" },
];

export default function Memberships() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useListMemberships();
  const createMembership = useCreateMembership();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration: "3", benefits: "", discountPercent: "" });

  const memberships = data?.memberships || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMembership.mutate({
      data: {
        name: form.name,
        price: Number(form.price),
        duration: Number(form.duration),
        benefits: form.benefits,
        discountPercent: Number(form.discountPercent),
      }
    }, {
      onSuccess: () => { toast({ title: "Membership created!" }); setShowModal(false); refetch(); setForm({ name: "", price: "", duration: "3", benefits: "", discountPercent: "" }); },
      onError: () => toast({ title: "Failed to create", variant: "destructive" })
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Memberships</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage loyalty packages and member benefits</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20 text-sm">
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {membershipStats.map((s, i) => (
          <Card key={i} className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color || 'text-primary'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                {s.trend && <p className="text-xs text-emerald-600">{s.trend}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Membership Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isLoading ? (
          <p className="col-span-3 text-center text-muted-foreground py-10">Loading...</p>
        ) : memberships.length === 0 ? (
          <p className="col-span-3 text-center text-muted-foreground py-10">No membership packages yet.</p>
        ) : (
          memberships.map((m: any) => {
            const Icon = membershipIcons[m.name] || Crown;
            const gradient = membershipGradients[m.name] || "from-violet-500 to-purple-700";
            const benefits = m.benefits ? m.benefits.split(",") : [];
            return (
              <div key={m.id || m._id} className={`rounded-2xl bg-gradient-to-br ${gradient} p-[1px] shadow-xl`}>
                <div className="bg-card rounded-2xl p-6 h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">{m.duration} months</span>
                  </div>
                  <h3 className="text-xl font-bold font-serif text-foreground">{m.name}</h3>
                  <p className="text-3xl font-bold text-primary mt-2">₹{Number(m.price).toLocaleString()}</p>
                  {m.discountPercent && m.discountPercent > 0 && (
                    <div className="flex items-center gap-2 mt-2 mb-4">
                      <Tag className="w-3.5 h-3.5 text-secondary" />
                      <span className="text-sm text-secondary font-semibold">{m.discountPercent}% off all services</span>
                    </div>
                  )}
                  <div className="space-y-2 border-t border-border/50 pt-4 mt-4">
                    {benefits.slice(0, 4).map((b: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground">{b.trim()}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-5 py-2.5 rounded-xl border-2 border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors">
                    Assign to Customer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recent Members Table */}
      <Card className="rounded-2xl border-border/50 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold font-serif text-foreground mb-4">Recent Members</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Customer", "Plan", "Member Since", "Expiry", "Total Savings"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentMembers.map((m, i) => {
                  const Icon = membershipIcons[m.type] || Star;
                  const colors: any = { Silver: "text-slate-500 bg-slate-100", Gold: "text-amber-600 bg-amber-100", Platinum: "text-violet-600 bg-violet-100" };
                  return (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-semibold">{m.name}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${colors[m.type]}`}>
                          <Icon className="w-3 h-3" />{m.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{m.since}</td>
                      <td className="py-3 px-3 text-muted-foreground">{m.expiry}</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">{m.savings}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-serif font-bold text-primary">New Membership Package</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {[
                { label: "Package Name", key: "name", placeholder: "e.g. Gold" },
                { label: "Price (₹)", key: "price", placeholder: "3000", type: "number" },
                { label: "Duration (months)", key: "duration", placeholder: "6", type: "number" },
                { label: "Discount (%)", key: "discountPercent", placeholder: "15", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{f.label}</label>
                  <input required type={f.type || "text"} placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Benefits (comma separated)</label>
                <textarea required rows={3} placeholder="10% off all services, Free threading monthly, Priority booking"
                  value={form.benefits} onChange={e => setForm(p => ({ ...p, benefits: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createMembership.isPending}
                  className="flex-1 py-3 rounded-xl rose-gold-gradient text-white font-bold text-sm disabled:opacity-50">
                  {createMembership.isPending ? "Creating..." : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
