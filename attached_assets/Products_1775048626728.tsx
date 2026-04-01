import { useState } from "react";
import { useListProducts, useCreateProduct } from "@workspace/api-client-react";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const { data, isLoading, refetch } = useListProducts();
  const createProduct = useCreateProduct();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);

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
              ) : (
                data?.products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
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
                    <td className="p-4 text-sm font-medium text-muted-foreground">{p.brand}</td>
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
                      <p className="font-bold">₹{p.sellingPrice}</p>
                      <p className="text-xs text-muted-foreground">Cost: ₹{p.costPrice}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
