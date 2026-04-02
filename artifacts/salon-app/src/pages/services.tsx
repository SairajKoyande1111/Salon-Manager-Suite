import { useState, useRef, useEffect } from "react";
import { useListServices, useCreateService } from "@workspace/api-client-react";
import { Plus, Clock, IndianRupee, X, Search, ChevronDown, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Services() {
  const { data, isLoading, refetch } = useListServices();
  const createService = useCreateService();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: "", category: "", price: 0, duration: 30 });

  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [catSearch, setCatSearch] = useState("");
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  const allCategories: string[] = data?.categories || ["Hair Services", "Facial", "Spa", "Makeup", "Nail Care"];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropOpen(false);
        setShowNewCat(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCats = allCategories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()));

  const handleSelectCat = (cat: string) => {
    setFormData({ ...formData, category: cat });
    setCatSearch(cat);
    setCatDropOpen(false);
    setShowNewCat(false);
  };

  const handleAddNewCat = () => {
    if (!newCatInput.trim()) return;
    setFormData({ ...formData, category: newCatInput.trim() });
    setCatSearch(newCatInput.trim());
    setCatDropOpen(false);
    setShowNewCat(false);
    setNewCatInput("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category.trim()) {
      toast({ title: "Please select or add a category", variant: "destructive" });
      return;
    }
    createService.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Service Added" });
        setShowAdd(false);
        setFormData({ name: "", category: "", price: 0, duration: 30 });
        setCatSearch("");
        refetch();
      },
      onError: () => toast({ title: "Failed to add service", variant: "destructive" }),
    });
  };

  const services = data?.services || [];
  const displayCategories = ["All", ...allCategories];

  const filtered = services.filter((s: any) => {
    const matchSearch = !searchFilter || s.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchCat = categoryFilter === "All" || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const grouped: Record<string, any[]> = {};
  filtered.forEach((s: any) => {
    const cat = s.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Services Menu</h1>
          <p className="text-muted-foreground mt-1">Manage your service catalog and pricing.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Service
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search services..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card shadow-sm focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {displayCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                categoryFilter === cat
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 h-36 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Tag className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No services found</p>
          <p className="text-sm mt-1">Try adjusting filters or add a new service</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/70 bg-primary/8 px-3 py-1 rounded-full border border-primary/20">{cat}</span>
                <span className="text-xs text-muted-foreground">{items.length} service{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {items.map((s: any) => (
                  <div key={s.id || s._id} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                    <h3 className="font-bold text-lg mb-4 text-foreground group-hover:text-primary transition-colors">{s.name}</h3>
                    <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                        <Clock className="w-4 h-4" /> {s.duration}m
                      </div>
                      <div className="flex items-center gap-1 text-primary font-bold text-lg">
                        <IndianRupee className="w-4 h-4" /> {s.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
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
              <button onClick={() => { setShowAdd(false); setCatSearch(""); setFormData({ name: "", category: "", price: 0, duration: 30 }); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Service Name *</label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. Deep Conditioning"
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Category *</label>
                <div className="relative" ref={catRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      placeholder="Search or select category..."
                      className="w-full pl-9 pr-10 p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                      value={catSearch}
                      onChange={e => { setCatSearch(e.target.value); setCatDropOpen(true); setFormData({ ...formData, category: e.target.value }); }}
                      onFocus={() => setCatDropOpen(true)}
                    />
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform ${catDropOpen ? "rotate-180" : ""}`} />
                  </div>

                  {catDropOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden">
                      <div className="max-h-44 overflow-y-auto">
                        {filteredCats.length === 0 && !catSearch ? (
                          <p className="p-3 text-sm text-muted-foreground text-center">No categories yet</p>
                        ) : filteredCats.length === 0 ? null : (
                          filteredCats.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors font-medium"
                              onClick={() => handleSelectCat(cat)}
                            >
                              {cat}
                            </button>
                          ))
                        )}
                      </div>
                      <div className="border-t border-border/50">
                        {!showNewCat ? (
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center gap-2"
                            onClick={() => { setShowNewCat(true); setNewCatInput(catSearch); }}
                          >
                            <Plus className="w-4 h-4" /> Add new category
                          </button>
                        ) : (
                          <div className="p-3 flex gap-2">
                            <input
                              autoFocus
                              placeholder="New category name..."
                              className="flex-1 p-2 rounded-lg border text-sm bg-muted/30 outline-none focus:ring-2 focus:ring-primary/20"
                              value={newCatInput}
                              onChange={e => setNewCatInput(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddNewCat())}
                            />
                            <button
                              type="button"
                              onClick={handleAddNewCat}
                              className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.price || ""}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Duration (mins) *</label>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    placeholder="30"
                    className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.duration || ""}
                    onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => { setShowAdd(false); setCatSearch(""); setFormData({ name: "", category: "", price: 0, duration: 30 }); }} className="flex-1 py-3 rounded-xl border hover:bg-muted font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createService.isPending} className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createService.isPending ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
