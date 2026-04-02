import { useState, useMemo } from "react";
import { useListServices, useListProducts, useListCustomers, useListStaff, useCreateBill } from "@workspace/api-client-react";
import { Search, Plus, Trash2, Tag, Receipt, CreditCard, Banknote, Smartphone, ChevronLeft, Wallet } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type CartItem = {
  uid: string;
  type: "service" | "product";
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  discountPct: number;
  staffId?: string | null;
  staffName?: string;
};

export default function POS() {
  const { toast } = useToast();
  const { data: servicesData } = useListServices();
  const { data: productsData } = useListProducts();
  const { data: customersData } = useListCustomers();
  const { data: staffData } = useListStaff();
  const createBill = useCreateBill();

  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "wallet">("upi");
  const [globalDiscountPct, setGlobalDiscountPct] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const taxPercent = taxEnabled ? 18 : 0;

  const services = servicesData?.services || [];
  const products = productsData?.products || [];
  const customers = customersData?.customers || [];
  const staff = (staffData as any)?.staff || [];

  const categories = useMemo(() => {
    const items = activeTab === "services" ? services : products;
    const cats = Array.from(new Set(items.map((i: any) => i.category)));
    return ["All", ...cats];
  }, [services, products, activeTab]);

  const filteredItems = useMemo(() => {
    const items = activeTab === "services" ? services : products;
    return items.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [services, products, activeTab, search, activeCategory]);

  const addToCart = (item: any) => {
    const id = item.id || item._id;
    const price = Number(activeTab === "services" ? item.price : item.sellingPrice) || 0;
    setCart(prev => [
      ...prev,
      {
        uid: Math.random().toString(36).substr(2, 9),
        type: activeTab === "services" ? "service" : "product",
        itemId: id,
        name: item.name,
        price,
        quantity: 1,
        discountPct: 0,
        staffId: null,
        staffName: "",
      },
    ]);
  };

  const updateCartItem = (uid: string, field: keyof CartItem, value: any) => {
    setCart(prev =>
      prev.map(item => {
        if (item.uid !== uid) return item;
        if (field === "staffId") {
          const selectedStaff = staff.find((s: any) => (s.id || s._id) === value);
          return { ...item, staffId: value || null, staffName: selectedStaff?.name || "" };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const removeCartItem = (uid: string) => {
    setCart(prev => prev.filter(item => item.uid !== uid));
  };

  const getItemTotal = (item: CartItem) => {
    const base = item.price * item.quantity;
    return base * (1 - item.discountPct / 100);
  };

  const subtotal = cart.reduce((acc, item) => acc + getItemTotal(item), 0);
  const globalDiscountAmount = subtotal * (globalDiscountPct / 100);
  const afterDiscount = Math.max(0, subtotal - globalDiscountAmount);
  const taxAmount = (afterDiscount * taxPercent) / 100;
  const finalAmount = Math.round(afterDiscount + taxAmount);

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    if (id) {
      const c = customers.find((c: any) => (c.id || c._id) === id);
      setCustomerName(c?.name || "");
      setCustomerPhone(c?.phone || "");
    } else {
      setCustomerName("");
      setCustomerPhone("");
    }
  };

  const handleGenerateBill = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    createBill.mutate(
      {
        data: {
          customerId: customerId || null,
          customerName: customerName || "Walk-in",
          customerPhone: customerPhone || "",
          items: cart.map(item => ({
            type: item.type,
            itemId: item.itemId,
            name: item.name,
            staffId: item.staffId || null,
            staffName: item.staffName || null,
            price: item.price,
            quantity: item.quantity,
            discount: item.discountPct,
            total: getItemTotal(item),
          })),
          subtotal,
          taxPercent,
          taxAmount,
          paymentMethod,
          discountAmount: globalDiscountAmount,
          finalAmount,
          status: "paid",
        } as any,
      },
      {
        onSuccess: (bill: any) => {
          toast({
            title: "Bill Generated!",
            description: `${bill.billNumber} — ₹${finalAmount.toLocaleString()}`,
          });
          setCart([]);
          setCustomerId("");
          setCustomerName("");
          setCustomerPhone("");
          setGlobalDiscountPct(0);
        },
        onError: () => {
          toast({ title: "Failed to generate bill", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Left: Item Selector */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        {/* Top Bar */}
        <div className="p-4 border-b border-border bg-card flex items-center gap-3">
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["services", "products"] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setActiveCategory("All"); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-3 overflow-x-auto border-b border-border bg-card/50">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-primary text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Receipt className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No {activeTab} found.</p>
              {activeTab === "services" && <p className="text-xs mt-1">Add services from the Services section.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item: any) => {
                const id = item.id || item._id;
                const price = Number(activeTab === "services" ? item.price : item.sellingPrice) || 0;
                return (
                  <button key={id} onClick={() => addToCart(item)}
                    className="p-4 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all text-left group">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="font-medium text-sm text-foreground leading-tight mb-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{item.category}</p>
                    <p className="text-primary font-bold">₹{price.toLocaleString("en-IN")}</p>
                    {activeTab === "services" && item.duration && (
                      <p className="text-xs text-muted-foreground">{item.duration} min</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Billing */}
      <div className="w-96 flex flex-col bg-primary text-primary-foreground">
        {/* Customer Select */}
        <div className="p-4 border-b border-primary-foreground/20">
          <p className="text-[10px] uppercase tracking-widest text-primary-foreground/50 font-bold mb-2">Customer</p>
          <select
            value={customerId}
            onChange={e => handleCustomerSelect(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/30 appearance-none"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c: any) => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name} — {c.phone}</option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-primary-foreground/40">
              <Receipt className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Add services or products</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.uid} className="bg-primary-foreground/10 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-primary-foreground/60 capitalize">{item.type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-secondary">₹{getItemTotal(item).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {/* Staff Select */}
                  {item.type === "service" && (
                    <select
                      value={item.staffId || ""}
                      onChange={e => updateCartItem(item.uid, "staffId", e.target.value)}
                      className="flex-1 min-w-0 text-xs bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="">Assign staff</option>
                      {staff.map((s: any) => (
                        <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                  {/* Qty */}
                  <div className="flex items-center border border-primary-foreground/20 rounded-lg overflow-hidden text-xs">
                    <button className="px-2 py-1 bg-primary-foreground/10 hover:bg-primary-foreground/20" onClick={() => updateCartItem(item.uid, "quantity", Math.max(1, item.quantity - 1))}>−</button>
                    <span className="px-2">{item.quantity}</span>
                    <button className="px-2 py-1 bg-primary-foreground/10 hover:bg-primary-foreground/20" onClick={() => updateCartItem(item.uid, "quantity", item.quantity + 1)}>+</button>
                  </div>
                  {/* Discount */}
                  <input
                    type="number"
                    placeholder="Disc%"
                    min={0} max={100}
                    value={item.discountPct || ""}
                    onChange={e => updateCartItem(item.uid, "discountPct", Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-14 text-xs bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg px-2 py-1 focus:outline-none"
                  />
                  {/* Remove */}
                  <button onClick={() => removeCartItem(item.uid)} className="p-1 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary */}
        <div className="p-4 border-t border-primary-foreground/20">
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-primary-foreground/75 text-sm">
              <span>Subtotal ({cart.length} items)</span>
              <span>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-primary-foreground/75 text-sm items-center">
              <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => {
                const v = prompt("Global discount %:", globalDiscountPct.toString());
                if (v !== null) setGlobalDiscountPct(Math.min(100, Math.max(0, Number(v) || 0)));
              }}>
                <Tag className="w-3 h-3" /> Discount {globalDiscountPct > 0 ? `(${globalDiscountPct}%)` : ""}
              </button>
              <span>−₹{globalDiscountAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-primary-foreground/75 text-sm items-center">
              <button className="hover:text-white transition-colors" onClick={() => setTaxEnabled(t => !t)}>
                GST {taxPercent}% {taxEnabled ? "(ON)" : "(OFF)"}
              </button>
              <span>+₹{taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="pt-2 border-t border-primary-foreground/20 flex justify-between items-end">
              <span className="font-serif">Final Amount</span>
              <span className="text-3xl font-bold font-serif text-secondary">₹{finalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <p className="text-[10px] text-primary-foreground/50 mb-2 uppercase tracking-widest font-bold">Payment Method</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { id: "cash", icon: Banknote, label: "Cash" },
              { id: "upi", icon: Smartphone, label: "UPI" },
              { id: "card", icon: CreditCard, label: "Card" },
              { id: "wallet", icon: Wallet, label: "Wallet" },
            ].map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                className={`py-2.5 flex flex-col items-center gap-1 rounded-xl text-xs font-medium transition-all ${paymentMethod === m.id ? "bg-secondary text-white shadow-lg scale-105" : "bg-primary-foreground/10 text-primary-foreground/70 hover:bg-primary-foreground/20"}`}>
                <m.icon className="w-4 h-4" />{m.label}
              </button>
            ))}
          </div>

          <button onClick={handleGenerateBill} disabled={cart.length === 0 || createBill.isPending}
            className="w-full py-3.5 bg-secondary hover:bg-secondary/90 text-white rounded-2xl font-bold text-base shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {createBill.isPending ? "Processing..." : `Generate Bill — ₹${finalAmount.toLocaleString("en-IN")}`}
          </button>
        </div>
      </div>
    </div>
  );
}
