import { useState } from "react";
import { useListStaff, useCreateStaff } from "@workspace/api-client-react";
import { Plus, Briefcase, Percent, Phone, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Staff() {
  const { data, isLoading, refetch } = useListStaff();
  const createStaff = useCreateStaff();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: "", specialization: "Hair Stylist", commissionPercent: 10, phone: "" });

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

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Team Members</h1>
          <p className="text-muted-foreground mt-1">Manage staff profiles and commissions.</p>
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
            <div key={s.id} className="bg-card rounded-2xl p-6 border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full rose-gold-gradient text-white flex items-center justify-center font-bold text-xl shadow-inner">
                  {s.avatarInitials}
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
                  <span className="font-bold text-foreground">{s.commissionPercent}%</span>
                </p>
                <p className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4"/> Contact</span>
                  <span className="font-medium text-foreground">{s.phone || 'N/A'}</span>
                </p>
                <div className="pt-4 mt-4 border-t border-border/50">
                  <button className="w-full py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2">
                    <CalendarCheck className="w-4 h-4"/> View Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/20">
            <h2 className="text-2xl font-serif font-bold mb-6 text-primary">New Staff Member</h2>
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
    </div>
  );
}
