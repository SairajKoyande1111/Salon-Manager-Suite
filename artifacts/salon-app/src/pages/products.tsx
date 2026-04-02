import { useState, useRef, useEffect } from "react";
import { useListProducts, useCreateProduct } from "@workspace/api-client-react";
import { Plus, Package, AlertTriangle, X, Search, ChevronDown, TrendingUp, ShoppingBag, Layers, Edit2, Trash2, IndianRupee, CalendarDays, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const API_BASE = "/api";

const emptyForm = {
  name: "", category: "", brand: "", description: "",
  stockQuantity: 0, costPrice: 0, sellingPrice: 0,
  lowStockThreshold: 5, expiryDate: "",
};

function CategorySearchInput({ value, onChange, categories }: { value: string; onChange: (v: string) => void; categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [showNew, setShowNew] = useState(false);
  const [newVal, setNewVal] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowNew(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = categories.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          placeholder="Search or select category..."
          className="w-full pl-9 pr-10 p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
          value={search}
          onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-40 overflow-y-auto">
            {filtered.map(c => (
              <button key={c} type="button" className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors font-medium"
                onClick={() => { onChange(c); setSearch(c); setOpen(false); setShowNew(false); }}>
                {c}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">No match — add new below</p>}
          </div>
          <div className="border-t border-border/50">
            {!showNew ? (
              <button type="button" className="w-full text-left px-4 py-2.5 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center gap-2"
                onClick={() => { setShowNew(true); setNewVal(search); }}>
                <Plus className="w-4 h-4" /> Add new category
              </button>
            ) : (
              <div className="p-3 flex gap-2">
                <input autoFocus placeholder="New category..." className="flex-1 p-2 rounded-lg border text-sm bg-muted/30 outline-none focus:ring-2 focus:ring-primary/20"
                  value={newVal} onChange={e => setNewVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onChange(newVal.trim()); setSearch(newVal.trim()); setOpen(false); setShowNew(false); } }} />
                <button type="button" className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
                  onClick={() => { onChange(newVal.trim()); setSearch(newVal.trim()); setOpen(false); setShowNew(false); }}>
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductFormModal({ open, onClose, onSuccess, product, categories, brands }: {
  open: boolean; onClose: () => void; onSuccess: () => void;
  product?: any; categories: string[]; brands: string[];
}) {
  const [form, setForm] = useState(emptyForm);
  const createProduct = useCreateProduct();
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "", category: product.category || "",
        brand: product.brand || "", description: product.description || "",
        stockQuantity: product.stockQuantity ?? 0, costPrice: product.costPrice ?? 0,
        sellingPrice: product.sellingPrice ?? 0, lowStockThreshold: product.lowStockThreshold ?? 5,
        expiryDate: product.expiryDate || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [product, open]);

  if (!open) return null;

  const margin = form.costPrice > 0 && form.sellingPrice > 0
    ? Math.round(((form.sellingPrice - form.costPrice) / form.sellingPrice) * 100)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: form.name, category: form.category, brand: form.brand,
      description: form.description, stockQuantity: Number(form.stockQuantity),
      costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice),
      lowStockThreshold: Number(form.lowStockThreshold),
      expiryDate: form.expiryDate || undefined,
    };
    try {
      if (product) {
        const res = await fetch(`${API_BASE}/products/${product.id || product._id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast({ title: "Product Updated" });
      } else {
        await new Promise<void>((resolve, reject) => {
          createProduct.mutate({ data: body as any }, { onSuccess: () => resolve(), onError: () => reject() });
        });
        toast({ title: "Product Added" });
      }
      onSuccess();
      onClose();
    } catch {
      toast({ title: product ? "Failed to update" : "Failed to add product", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-card rounded-3xl p-8 w-full max-w-lg shadow-2xl my-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-primary">{product ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Product Name *</label>
            <input required placeholder="e.g. L'Oreal Keratin Serum"
              className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <input placeholder="Brief description (optional)"
              className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category *</label>
              <CategorySearchInput value={form.category} onChange={v => setForm({ ...form, category: v })} categories={categories} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Brand</label>
              <div className="relative">
                <input placeholder="e.g. L'Oreal"
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={form.brand}
                  onChange={e => setForm({ ...form, brand: e.target.value })}
                  list="brands-list" />
                <datalist id="brands-list">{brands.map(b => <option key={b} value={b} />)}</datalist>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Stock Qty *</label>
              <input required type="number" min="0" placeholder="0"
                className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                value={form.stockQuantity || ""} onChange={e => setForm({ ...form, stockQuantity: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Low Alert At</label>
              <input type="number" min="0" placeholder="5"
                className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                value={form.lowStockThreshold || ""} onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Expiry Date</label>
              <input type="date"
                className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Cost Price (₹)</label>
              <input type="number" min="0" placeholder="0"
                className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                value={form.costPrice || ""} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Selling Price (₹) *</label>
              <input required type="number" min="0" placeholder="0"
                className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                value={form.sellingPrice || ""} onChange={e => setForm({ ...form, sellingPrice: Number(e.target.value) })} />
            </div>
          </div>

          {margin !== null && (
            <div className={`rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${margin >= 30 ? "bg-green-50 text-green-700 border border-green-200" : margin >= 10 ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              <TrendingUp className="w-4 h-4" />
              Profit margin: {margin}% &nbsp;·&nbsp; Profit per unit: ₹{(form.sellingPrice - form.costPrice).toLocaleString()}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border hover:bg-muted font-medium transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50">
              {product ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const { data, isLoading, refetch } = useListProducts();
  const { toast } = useToast();

  const [searchFilter, setSearchFilter] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const allCategories: string[] = data?.categories || [];
  const allBrands: string[] = data?.brands || [];
  const stats = data?.stats || { total: 0, totalStockValue: 0, lowStockCount: 0, outOfStockCount: 0 };

  const products: any[] = (data?.products || []).filter((p: any) => {
    const matchSearch = !searchFilter || p.name.toLowerCase().includes(searchFilter.toLowerCase()) || (p.brand || "").toLowerCase().includes(searchFilter.toLowerCase());
    const matchCat = catFilter === "all" || p.category === catFilter;
    const matchBrand = brandFilter === "all" || p.brand === brandFilter;
    const matchStock = stockFilter === "all"
      || (stockFilter === "low" && p.isLowStock && p.stockQuantity > 0)
      || (stockFilter === "out" && p.stockQuantity === 0)
      || (stockFilter === "ok" && !p.isLowStock && p.stockQuantity > 0);
    return matchSearch && matchCat && matchBrand && matchStock;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from inventory?`)) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Product removed" });
      refetch();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track, manage and monitor all your products in one place.</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><ShoppingBag className="w-4 h-4" /> Total Products</div>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><IndianRupee className="w-4 h-4" /> Stock Value</div>
          <p className="text-3xl font-bold text-foreground">₹{Number(stats.totalStockValue).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-1"><AlertTriangle className="w-4 h-4" /> Low Stock</div>
          <p className="text-3xl font-bold text-amber-600">{stats.lowStockCount}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-destructive text-sm mb-1"><Layers className="w-4 h-4" /> Out of Stock</div>
          <p className="text-3xl font-bold text-destructive">{stats.outOfStockCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by name or brand..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card shadow-sm focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
          />
        </div>

        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border bg-card text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium">
          <option value="all">All Categories</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border bg-card text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium">
          <option value="all">All Brands</option>
          {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border bg-card text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium">
          <option value="all">All Stock Status</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/50">
                <th className="p-4 pl-6">Product</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-right">Cost</th>
                <th className="p-4 text-right">Sell Price</th>
                <th className="p-4 text-right">Margin</th>
                <th className="p-4">Expiry</th>
                <th className="p-4">Added</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="p-4"><div className="h-8 bg-muted/40 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-25" />
                    <p className="font-medium">No products found</p>
                    <p className="text-sm mt-1">Try adjusting filters or add a new product</p>
                  </td>
                </tr>
              ) : (
                products.map((p: any) => {
                  const margin = p.costPrice > 0 && p.sellingPrice > 0
                    ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : null;
                  const expired = isExpired(p.expiryDate);
                  const expiringSoon = isExpiringSoon(p.expiryDate);
                  const stockPct = p.lowStockThreshold > 0 ? Math.min(100, Math.round((p.stockQuantity / (p.lowStockThreshold * 3)) * 100)) : 100;

                  return (
                    <tr key={p.id || p._id} className="hover:bg-muted/20 transition-colors group">
                      <td className="p-4 pl-6 min-w-[180px]">
                        <p className="font-semibold text-foreground leading-tight">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-medium">{p.brand || <span className="opacity-40">—</span>}</td>
                      <td className="p-4">
                        <span className="text-xs font-semibold bg-secondary/10 text-secondary px-2.5 py-1 rounded-full">{p.category}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-bold text-base ${p.stockQuantity === 0 ? "text-destructive" : p.isLowStock ? "text-amber-600" : "text-foreground"}`}>
                            {p.stockQuantity}
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${p.stockQuantity === 0 ? "bg-destructive" : p.isLowStock ? "bg-amber-500" : "bg-green-500"}`}
                              style={{ width: `${stockPct}%` }} />
                          </div>
                          {p.stockQuantity === 0 && (
                            <span className="text-[10px] font-bold text-destructive uppercase tracking-wide">Out of Stock</span>
                          )}
                          {p.isLowStock && p.stockQuantity > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />Low</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right text-sm text-muted-foreground">
                        {p.costPrice > 0 ? `₹${Number(p.costPrice).toLocaleString()}` : <span className="opacity-40">—</span>}
                      </td>
                      <td className="p-4 text-right font-bold">₹{Number(p.sellingPrice).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        {margin !== null ? (
                          <span className={`text-sm font-semibold ${margin >= 30 ? "text-green-600" : margin >= 10 ? "text-amber-600" : "text-destructive"}`}>
                            {margin}%
                          </span>
                        ) : <span className="opacity-40 text-sm">—</span>}
                      </td>
                      <td className="p-4 text-sm">
                        {p.expiryDate ? (
                          <span className={`font-medium flex items-center gap-1.5 ${expired ? "text-destructive" : expiringSoon ? "text-amber-600" : "text-muted-foreground"}`}>
                            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                            {format(new Date(p.expiryDate), "dd MMM yy")}
                            {expired && <span className="text-[10px] font-bold uppercase bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Expired</span>}
                            {expiringSoon && !expired && <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Soon</span>}
                          </span>
                        ) : <span className="text-muted-foreground/40 text-xs">No expiry</span>}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {p.createdAt ? format(new Date(p.createdAt), "dd MMM yy") : <span className="opacity-40">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditProduct(p); setShowForm(true); }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id || p._id, p.name)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && products.length > 0 && (
          <div className="px-6 py-3 border-t border-border/30 bg-muted/10 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> In Stock</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Low Stock (≤ threshold)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> Out of Stock</span>
            <span className="ml-auto">{products.length} product{products.length !== 1 ? "s" : ""} shown</span>
          </div>
        )}
      </div>

      <div className="mt-5 bg-primary/5 border border-primary/15 rounded-2xl p-5">
        <h3 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2"><Tag className="w-4 h-4" /> How to use Inventory</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <p>• <strong className="text-foreground">Add Product</strong> — click the button top-right. Fill in name, category, brand, stock qty, prices and optional expiry date.</p>
          <p>• <strong className="text-foreground">Low Stock Alert</strong> — when stock falls to or below the "Low Alert At" threshold, a warning badge appears and the bar turns amber.</p>
          <p>• <strong className="text-foreground">Expiry Tracking</strong> — products expiring within 30 days show a "Soon" badge; expired ones show "Expired" in red.</p>
          <p>• <strong className="text-foreground">Edit / Update</strong> — hover over any row and click the pencil icon to update qty, price or any detail.</p>
          <p>• <strong className="text-foreground">Profit Margin</strong> — automatically calculated from cost and selling price. Green ≥ 30%, amber ≥ 10%, red below.</p>
          <p>• <strong className="text-foreground">Filters</strong> — filter by category, brand, or stock status. Use the search bar to find products by name or brand.</p>
        </div>
      </div>

      <ProductFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); }}
        onSuccess={refetch}
        product={editProduct}
        categories={allCategories}
        brands={allBrands}
      />
    </div>
  );
}
