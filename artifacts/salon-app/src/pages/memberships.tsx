import { useState, useEffect, useMemo } from "react";
import { Crown, Star, Gem, Plus, X, Check, Users, Tag, Trash2, UserPlus, Search, CalendarDays, BadgeCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

const API_BASE = "/api";

function MembershipBadge({ membership, size = "sm" }: { membership: any; size?: "sm" | "md" }) {
  if (!membership) return null;
  const colors: Record<string, string> = {
    default: "bg-violet-100 text-violet-700 border-violet-200",
  };
  const cls = size === "sm"
    ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
    : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border";
  return (
    <span className={`${cls} bg-violet-100 text-violet-700 border-violet-200`}>
      <BadgeCheck className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {membership.membershipName}
    </span>
  );
}

export default function Memberships() {
  const { toast } = useToast();

  // Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Active members state
  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const [activeMembersLoading, setActiveMembersLoading] = useState(true);

  // Create plan modal
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", price: "", duration: "3", benefits: "", discountPercent: "" });
  const [planSaving, setPlanSaving] = useState(false);

  // Assign modal
  const [assignPlan, setAssignPlan] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [assignSaving, setAssignSaving] = useState(false);

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await fetch(`${API_BASE}/memberships`);
      const data = await res.json();
      setPlans(data.memberships || []);
    } catch {
      toast({ title: "Failed to load plans", variant: "destructive" });
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchActiveMembers = async () => {
    setActiveMembersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customer-memberships`);
      const data = await res.json();
      setActiveMembers(data.customerMemberships || []);
    } catch {
      toast({ title: "Failed to load members", variant: "destructive" });
    } finally {
      setActiveMembersLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {}
  };

  useEffect(() => {
    fetchPlans();
    fetchActiveMembers();
    fetchCustomers();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) return;
    setPlanSaving(true);
    try {
      const res = await fetch(`${API_BASE}/memberships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planForm.name.trim(),
          price: Number(planForm.price),
          duration: Number(planForm.duration),
          benefits: planForm.benefits.trim(),
          discountPercent: Number(planForm.discountPercent) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Plan created!" });
      setShowCreatePlan(false);
      setPlanForm({ name: "", price: "", duration: "3", benefits: "", discountPercent: "" });
      fetchPlans();
    } catch {
      toast({ title: "Failed to create plan", variant: "destructive" });
    } finally {
      setPlanSaving(false);
    }
  };

  const handleDeletePlan = async (plan: any) => {
    if (!confirm(`Delete plan "${plan.name}"? Existing assigned memberships will not be affected.`)) return;
    try {
      const res = await fetch(`${API_BASE}/memberships/${plan.id || plan._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Plan deleted" });
      fetchPlans();
    } catch {
      toast({ title: "Failed to delete plan", variant: "destructive" });
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }
    setAssignSaving(true);
    try {
      const res = await fetch(`${API_BASE}/customer-memberships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id || selectedCustomer._id,
          membershipId: assignPlan.id || assignPlan._id,
          startDate,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Membership assigned!", description: `${selectedCustomer.name} is now on ${assignPlan.name}` });
      setAssignPlan(null);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      fetchActiveMembers();
    } catch {
      toast({ title: "Failed to assign membership", variant: "destructive" });
    } finally {
      setAssignSaving(false);
    }
  };

  const handleRevoke = async (cm: any) => {
    if (!confirm(`Revoke ${cm.customerName}'s ${cm.membershipName} membership?`)) return;
    try {
      const res = await fetch(`${API_BASE}/customer-memberships/${cm.id || cm._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Membership revoked" });
      fetchActiveMembers();
    } catch {
      toast({ title: "Failed to revoke membership", variant: "destructive" });
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const term = customerSearch.toLowerCase();
    return customers.filter((c: any) =>
      c.name?.toLowerCase().includes(term) || c.phone?.includes(term)
    );
  }, [customers, customerSearch]);

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Memberships</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create plans and assign them to your clients</p>
        </div>
        <button
          onClick={() => setShowCreatePlan(true)}
          className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20 text-sm"
        >
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Members</p>
              <p className="text-xl font-bold text-foreground">{activeMembers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Plans</p>
              <p className="text-xl font-bold text-foreground">{plans.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expiring This Month</p>
              <p className="text-xl font-bold text-foreground">
                {activeMembers.filter(m => {
                  const end = m.endDate;
                  const thirtyDays = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
                  return end <= thirtyDays && end >= today;
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-bold font-serif text-foreground mb-4">Membership Plans</h2>
        {plansLoading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
            <Tag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No plans yet</p>
            <p className="text-muted-foreground text-sm mt-1">Create your first membership plan to get started</p>
            <button
              onClick={() => setShowCreatePlan(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan: any) => {
              const benefits = plan.benefits ? plan.benefits.split(",").map((b: string) => b.trim()).filter(Boolean) : [];
              const memberCount = activeMembers.filter(m => m.membershipId === (plan.id || plan._id)).length;
              return (
                <div key={plan.id || plan._id} className="bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.duration} month{plan.duration !== 1 ? "s" : ""} validity</p>
                      </div>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-2xl font-bold text-primary mb-2">₹{Number(plan.price).toLocaleString("en-IN")}</p>

                    {plan.discountPercent > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Tag className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-sm text-secondary font-semibold">{plan.discountPercent}% off all services</span>
                      </div>
                    )}

                    {benefits.length > 0 && (
                      <div className="space-y-1.5 border-t border-border/40 pt-3 mb-4">
                        {benefits.map((b: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-xs text-muted-foreground">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">
                        {memberCount} active member{memberCount !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => { setAssignPlan(plan); setSelectedCustomer(null); setCustomerSearch(""); setStartDate(format(new Date(), "yyyy-MM-dd")); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Assign to Client
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Members Table */}
      <Card className="rounded-2xl border-border/50 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold font-serif text-foreground mb-4">Active Members</h2>
          {activeMembersLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading members...</div>
          ) : activeMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto opacity-20 mb-3" />
              <p className="font-medium">No active members yet</p>
              <p className="text-sm mt-1">Assign a plan to a client to see them here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Customer", "Plan", "Discount", "Start Date", "Expiry", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {activeMembers.map((cm: any) => {
                    const isExpiringSoon = cm.endDate <= format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
                    return (
                      <tr key={cm.id || cm._id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {cm.customerName.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-foreground">{cm.customerName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                            <BadgeCheck className="w-3 h-3" /> {cm.membershipName}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {cm.discountPercent > 0
                            ? <span className="text-secondary font-semibold">{cm.discountPercent}% off</span>
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {cm.startDate ? format(parseISO(cm.startDate), "dd MMM yyyy") : "—"}
                        </td>
                        <td className="py-3 px-3 text-xs">
                          <span className={isExpiringSoon ? "text-amber-600 font-semibold" : "text-muted-foreground"}>
                            {cm.endDate ? format(parseISO(cm.endDate), "dd MMM yyyy") : "—"}
                            {isExpiringSoon && " ⚠"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleRevoke(cm)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors font-medium"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-serif font-bold text-primary">New Membership Plan</h2>
              <button onClick={() => setShowCreatePlan(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Plan Name *</label>
                <input required type="text" placeholder="e.g. Gold, Premium, Basic"
                  value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Price (₹) *</label>
                  <input required type="number" min="0" placeholder="3000"
                    value={planForm.price} onChange={e => setPlanForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Duration (months) *</label>
                  <input required type="number" min="1" placeholder="3"
                    value={planForm.duration} onChange={e => setPlanForm(p => ({ ...p, duration: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Service Discount (%)</label>
                <input type="text" inputMode="decimal" placeholder="e.g. 15"
                  value={planForm.discountPercent} onChange={e => setPlanForm(p => ({ ...p, discountPercent: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none" />
                <p className="text-[11px] text-muted-foreground mt-1">Leave blank if no discount applies</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Benefits</label>
                <textarea rows={3} placeholder="Free threading monthly, Priority booking, 10% off products..."
                  value={planForm.benefits} onChange={e => setPlanForm(p => ({ ...p, benefits: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none resize-none" />
                <p className="text-[11px] text-muted-foreground mt-1">Separate each benefit with a comma</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreatePlan(false)} className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={planSaving}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  {planSaving ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-serif font-bold text-primary">Assign Membership</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Plan: <span className="font-semibold text-foreground">{assignPlan.name}</span> · ₹{Number(assignPlan.price).toLocaleString("en-IN")} · {assignPlan.duration} months</p>
              </div>
              <button onClick={() => setAssignPlan(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              {/* Customer search */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Select Customer *</label>
                {selectedCustomer ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {selectedCustomer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{selectedCustomer.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                      className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors">
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-3 p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                      />
                    </div>
                    <div className="border border-border rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <p className="text-center py-4 text-sm text-muted-foreground">No customers found</p>
                      ) : (
                        filteredCustomers.slice(0, 5).map((c: any) => (
                          <button
                            key={c.id || c._id}
                            type="button"
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/40 last:border-0"
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                              {c.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.phone}</p>
                            </div>
                            {c.activeMembership && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium">
                                {c.activeMembership.membershipName}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Start Date</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full pl-9 p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                  />
                </div>
                {startDate && assignPlan && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Valid until: <span className="font-semibold text-foreground">
                      {format(new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + Number(assignPlan.duration))), "dd MMM yyyy")}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAssignPlan(null)} className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={assignSaving || !selectedCustomer}
                  className="flex-1 py-3 rounded-xl bg-secondary text-white font-bold text-sm disabled:opacity-50 hover:bg-secondary/90 transition-colors">
                  {assignSaving ? "Assigning..." : "Assign Membership"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
