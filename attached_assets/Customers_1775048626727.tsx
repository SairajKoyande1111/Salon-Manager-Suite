import { useState } from "react";
import { useListCustomers, useCreateCustomer } from "@workspace/api-client-react";
import { Search, Plus, User, Phone, Calendar, TrendingUp, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api";

export default function Customers() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useListCustomers({ search });
  const createCustomer = useCreateCustomer();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", dob: "", notes: "" });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const validatePhone = (phone: string) => {
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) return;

    createCustomer.mutate({ data: { ...formData, email: "" } as any }, {
      onSuccess: () => {
        toast({ title: "Customer Added", description: `${formData.name} has been registered.` });
        setShowAdd(false);
        setFormData({ name: "", phone: "", dob: "", notes: "" });
        setPhoneError("");
        refetch();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add customer.", variant: "destructive" });
      }
    });
  };

  const openCustomerDetail = async (customerId: string) => {
    setDetailLoading(true);
    setSelectedCustomer(customerId);
    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}`);
      const data = await res.json();
      setCustomerDetail(data);
    } catch {
      toast({ title: "Error", description: "Failed to load customer details.", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCustomer(null);
    setCustomerDetail(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your clients and their history.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-secondary text-white px-6 py-3 rounded-xl font-semibold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                <th className="p-4 pl-6">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Date of Birth</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Total Visits</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : !data?.customers || data.customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No customers yet. Add your first customer!</p>
                  </td>
                </tr>
              ) : (
                data.customers.map((c: any) => (
                  <tr key={c.id || c._id} className="hover:bg-muted/20 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {c.dob ? format(new Date(c.dob), "dd MMM yyyy") : <span className="italic">—</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-emerald-600">
                        ₹{Number(c.totalSpend || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                        <TrendingUp className="w-3 h-3" /> {c.totalVisits || 0} visits
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openCustomerDetail(c.id || c._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-primary">New Customer</h2>
              <button onClick={() => { setShowAdd(false); setPhoneError(""); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Full Name *</label>
                <input
                  required
                  autoFocus
                  placeholder="Enter full name"
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Phone Number * (10 digits)</label>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className={`w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 outline-none ${phoneError ? "border-red-400 focus:ring-red-200" : "focus:ring-primary/20"}`}
                  value={formData.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, phone: val });
                    if (val.length === 10) setPhoneError("");
                  }}
                  onBlur={e => validatePhone(e.target.value)}
                />
                {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Date of Birth</label>
                <input
                  type="date"
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any special preferences or notes..."
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowAdd(false); setPhoneError(""); }}
                  className="flex-1 py-3 rounded-xl border hover:bg-muted font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createCustomer.isPending}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createCustomer.isPending ? "Saving..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-primary">Customer Profile</h2>
              <button onClick={closeDetail} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {detailLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading profile...</div>
              ) : customerDetail ? (
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                      {customerDetail.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{customerDetail.name}</h3>
                      <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5" /> {customerDetail.phone}
                      </p>
                      {customerDetail.dob && (
                        <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" /> DOB: {format(new Date(customerDetail.dob), "dd MMM yyyy")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">₹{Number(customerDetail.totalSpend || 0).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Spent</p>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{customerDetail.totalVisits || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Visits</p>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-secondary">
                        {customerDetail.lastVisit ? format(new Date(customerDetail.lastVisit), "dd MMM") : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Last Visit</p>
                    </div>
                  </div>

                  {/* Visit History */}
                  <div>
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Visit History</h4>
                    {!customerDetail.bills || customerDetail.bills.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">
                        No visits yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerDetail.bills.map((bill: any) => (
                          <div key={bill.id || bill._id} className="bg-muted/20 rounded-xl p-4 border border-border/40">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-sm">{bill.billNumber}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(bill.createdAt), "dd MMM yyyy, hh:mm a")}</p>
                              </div>
                              <span className="font-bold text-emerald-600">₹{Number(bill.finalAmount).toLocaleString("en-IN")}</span>
                            </div>
                            {bill.items && bill.items.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {bill.items.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${item.type === "service" ? "bg-primary" : "bg-secondary"}`} />
                                      {item.name} {item.staffName ? `(by ${item.staffName})` : ""}
                                    </span>
                                    <span>₹{Number(item.total).toLocaleString("en-IN")}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 pt-2 border-t border-border/30 flex gap-4 text-xs text-muted-foreground">
                              <span className="capitalize">💳 {bill.paymentMethod}</span>
                              <span className={`capitalize font-medium ${bill.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                                {bill.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
