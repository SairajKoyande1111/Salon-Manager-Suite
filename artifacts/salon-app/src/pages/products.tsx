import { useState } from "react";
import { useListProducts, useCreateProduct } from "@workspace/api-client-react";
import { Plus, Package, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const { data, isLoading, refetch } = useListProducts();
  const createProduct = useCreateProduct();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    stockQuantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    lowStockThreshold: 5,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(
      {
        data: {
          name: form.name,
          category: form.category,
          brand: form.brand,
          stockQuantity: Number(form.stockQuantity),
          costPrice: Number(form.costPrice),
          sellingPrice: Number(form.sellingPrice),
          lowStockThreshold: Number(form.lowStockThreshold),
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Product Added" });
          setShowAdd(false);
          setForm({ name: "", category: "", brand: "", stockQuantity: 0, costPrice: 0, sellingPrice: 0, lowStockThreshold: 5 });
          refetch();
        },
        onError: () => {
          toast({ title: "Failed to add product", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage retail products and salon supplies.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground text-sm uppercase tracking-wider font-semibold">
                <th className="p-4 pl-6">Product Info</th>
                <th className="p-4">Brand</th>
                <th className="p-4 text-right">Stock</th>
                <th className="p-4 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : data?.products?.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
              ) : (
                data?.products.map((p: any) => (
                  <tr key={p.id || p._id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-muted-foreground">{p.brand || "-"}</td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-bold text-lg ${p.isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                          {p.stockQuantity}
                        </span>
                        {p.isLowStock && (
                          <span className="text-[10px] text-destructive flex items-center gap-1 font-medium bg-destructive/10 px-2 py-0.5 rounded-md mt-1">
                            <AlertTriangle className="w-3 h-3"/> Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-bold">₹{Number(p.sellingPrice || 0).toLocaleString()}</p>
                      {p.costPrice > 0 && <p className="text-xs text-muted-foreground">Cost: ₹{Number(p.costPrice).toLocaleString()}</p>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-primary">New Product</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Product Name *</label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. L'Oreal Hair Spa"
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Category *</label>
                  <input
                    required
                    placeholder="e.g. Hair Care"
                    className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Brand</label>
                  <input
                    placeholder="e.g. L'Oreal"
                    className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Stock Qty *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={form.stockQuantity || ""}
                    onChange={e => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Low Threshold</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={form.lowStockThreshold || ""}
                    onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={form.costPrice || ""}
                    onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Selling Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={form.sellingPrice || ""}
                    onChange={e => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-xl border hover:bg-muted font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createProduct.isPending}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createProduct.isPending ? "Saving..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
