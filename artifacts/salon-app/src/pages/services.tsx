import { useState } from "react";
import { useListServices, useCreateService } from "@workspace/api-client-react";
import { Plus, Sparkles, Clock, IndianRupee, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Services() {
  const { data, isLoading, refetch } = useListServices();
  const createService = useCreateService();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: "", category: "Hair Services", price: 0, duration: 30 });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createService.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Service Added" });
        setShowAdd(false);
        setFormData({ name: "", category: "Hair Services", price: 0, duration: 30 });
        refetch();
      }
    });
  };

  const categories = data?.categories || ["Hair Services", "Facial", "Spa", "Makeup", "Nail Care"];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Services Menu</h1>
          <p className="text-muted-foreground mt-1">Manage your service catalog and pricing.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Service
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.services.map((s: any) => (
            <div key={s.id || s._id} className="bg-card rounded-2xl p-6 border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 text-secondary group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">{s.category}</span>
              <h3 className="font-bold text-lg mb-4 text-foreground">{s.name}</h3>
              
              <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                  <Clock className="w-4 h-4"/> {s.duration}m
                </div>
                <div className="flex items-center gap-1 text-primary font-bold text-lg">
                  <IndianRupee className="w-4 h-4"/> {s.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-primary">New Service</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service Name</label>
                <input required className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map((c:string) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input type="number" required min="0" className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                  <input type="number" required min="5" step="5" className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border hover:bg-muted font-medium">Cancel</button>
                <button type="submit" disabled={createService.isPending} className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/20">
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
