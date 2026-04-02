import { useState } from "react";
import { useListStaff, useCreateStaff } from "@workspace/api-client-react";
import { Plus, Percent, Phone, CalendarCheck, X, Briefcase, Receipt, ChevronRight, Clock, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api";

export default function Staff() {
  const { data, isLoading, refetch } = useListStaff();
  const createStaff = useCreateStaff();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: "", specialization: "Hair Stylist", commissionPercent: 10, phone: "" });

  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createStaff.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Staff Member Added" });
        setShowAdd(false);
        setFormData({ name: "", specialization: "Hair Stylist", commissionPercent: 10, phone: "" });
        refetch();
      }
    });
  };

  const openWorkHistory = async (s: any) => {
    setSelectedStaff(s);
    setHistoryLoading(true);
    setWorkHistory([]);
    try {
      const res = await fetch(`${API_BASE}/staff/${s.id || s._id}/work-history`);
      const data = await res.json();
      setWorkHistory(data.history || []);
    } catch {
      toast({ title: "Failed to load work history", variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  };

  const totalEarned = workHistory.reduce((acc, h) => acc + h.totalEarned, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Team Members</h1>
          <p className="text-muted-foreground mt-1">Manage staff profiles and work history.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Staff
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.staff.map((s: any) => (
            <div key={s.id || s._id} className="bg-card rounded-2xl p-6 border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full rose-gold-gradient text-white flex items-center justify-center font-bold text-xl shadow-inner">
                  {s.avatarInitials || s.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{s.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium mt-1 inline-block">
                    {s.specialization}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <p className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-2"><Percent className="w-4 h-4"/> Commission</span>
                  <span className="font-bold text-foreground">{s.commissionPercent || 0}%</span>
                </p>
                <p className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4"/> Contact</span>
                  <span className="font-medium text-foreground">{s.phone || 'N/A'}</span>
                </p>
                <div className="pt-4 mt-4 border-t border-border/50">
                  <button
                    onClick={() => openWorkHistory(s)}
                    className="w-full py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2">
                    <Briefcase className="w-4 h-4"/> Work History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-primary">New Staff Member</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Specialization</label>
                <input required className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Commission %</label>
                  <input type="number" required min="0" max="100" className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.commissionPercent || ''} onChange={e => setFormData({...formData, commissionPercent: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border hover:bg-muted font-medium">Cancel</button>
                <button type="submit" disabled={createStaff.isPending} className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/20">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work History Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl w-full max-w-2xl shadow-2xl shadow-black/20 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full rose-gold-gradient text-white flex items-center justify-center font-bold text-base">
                  {selectedStaff.avatarInitials || selectedStaff.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedStaff.specialization}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Stats */}
            {!historyLoading && workHistory.length > 0 && (
              <div className="px-6 py-3 bg-muted/20 border-b border-border grid grid-cols-3 gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{workHistory.length}</p>
                  <p className="text-xs text-muted-foreground">Bills Served</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{workHistory.reduce((a, h) => a + h.items.length, 0)}</p>
                  <p className="text-xs text-muted-foreground">Services Done</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">₹{totalEarned.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            )}

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {historyLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading work history...</p>
                  </div>
                </div>
              ) : workHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                  <CalendarCheck className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-medium">No work history yet</p>
                  <p className="text-xs text-center">Services assigned to {selectedStaff.name} will appear here after billing.</p>
                </div>
              ) : (
                workHistory.map((entry, i) => (
                  <div key={i} className="bg-background rounded-xl border border-border p-4">
                    {/* Bill Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">{entry.billNumber}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{entry.paymentMethod}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-sm">₹{entry.totalEarned.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {/* Customer */}
                    <p className="text-xs text-muted-foreground mb-2">Customer: <span className="text-foreground font-medium">{entry.customerName}</span></p>
                    {/* Services */}
                    <div className="space-y-1.5">
                      {entry.items.map((item: any, j: number) => (
                        <div key={j} className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-2">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.quantity > 1 && <span className="text-muted-foreground ml-1">×{item.quantity}</span>}
                            {item.discount > 0 && (
                              <span className="ml-2 text-orange-500">{item.discount}% off</span>
                            )}
                          </div>
                          <span className="font-semibold text-primary">₹{(item.total || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
