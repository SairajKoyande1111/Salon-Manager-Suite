import { useState, useMemo, useRef, useEffect } from "react";
import { useListServices, useListProducts, useListCustomers, useListStaff, useCreateBill } from "@workspace/api-client-react";
import {
  Search, Plus, Trash2, Receipt, CreditCard, Banknote, Smartphone,
  ChevronLeft, Wallet, UserPlus, X, Scissors, Package, Clock,
  ChevronDown, UserCircle2, Tag, Check, BadgeCheck
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api";

type CartItem = {
  uid: string;
  type: "service" | "product";
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  discountAmt: number;
  staffId?: string | null;
  staffName?: string;
};

const PAYMENT_METHODS = [
  { id: "cash", icon: Banknote, label: "Cash" },
  { id: "upi", icon: Smartphone, label: "UPI" },
  { id: "card", icon: CreditCard, label: "Card" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
];

export default function POS() {
  const { toast } = useToast();
  const { data: servicesData } = useListServices();
  const { data: productsData } = useListProducts();
  const { data: customersData, refetch: refetchCustomers } = useListCustomers();
  const { data: staffData } = useListStaff();
  const createBill = useCreateBill();

  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "wallet">("upi");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [globalDiscountAmt, setGlobalDiscountAmt] = useState(0);

  // Customer dropdown state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  // Customer membership
  const [customerMembership, setCustomerMembership] = useState<any>(null);

  // Add Customer modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", dob: "", notes: "" });
  const [addPhoneError, setAddPhoneError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const taxPercent = taxEnabled ? 18 : 0;
  const services = servicesData?.services || [];
  const products = productsData?.products || [];
  const customers = customersData?.customers || [];
  const staff = (staffData as any)?.staff || [];

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const term = customerSearch.toLowerCase();
    return customers.filter((c: any) =>
      c.name?.toLowerCase().includes(term) || c.phone?.includes(term)
    );
  }, [customers, customerSearch]);

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
        discountAmt: 0,
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

  const removeCartItem = (uid: string) => setCart(prev => prev.filter(i => i.uid !== uid));

  const getItemTotal = (item: CartItem) => {
    const base = item.price * item.quantity;
    return Math.max(0, base - (item.discountAmt || 0));
  };

  const getItemDiscountAmt = (item: CartItem) => {
    return item.discountAmt || 0;
  };

  const subtotal = cart.reduce((acc, item) => acc + getItemTotal(item), 0);
  const globalDiscountAmount = Math.min(globalDiscountAmt, subtotal);
  const afterGlobalDiscount = Math.max(0, subtotal - globalDiscountAmount);
  const taxAmount = (afterGlobalDiscount * taxPercent) / 100;
  const finalAmount = Math.round(afterGlobalDiscount + taxAmount);

  const fetchCustomerMembership = async (cid: string) => {
    try {
      const res = await fetch(`${API_BASE}/customer-memberships/customer/${cid}`);
      const data = await res.json();
      setCustomerMembership(data.membership || null);
    } catch {
      setCustomerMembership(null);
    }
  };

  const selectCustomer = (c: any) => {
    const cid = c.id || c._id;
    setCustomerId(cid);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setShowCustomerDropdown(false);
    setCustomerSearch("");
    // Use activeMembership from list data if available, else fetch
    if (c.activeMembership !== undefined) {
      setCustomerMembership(c.activeMembership);
    } else {
      fetchCustomerMembership(cid);
    }
  };

  const selectWalkIn = () => {
    setCustomerId("");
    setCustomerName("Walk-in Customer");
    setCustomerPhone("");
    setShowCustomerDropdown(false);
    setCustomerSearch("");
    setCustomerMembership(null);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(addForm.phone)) {
      setAddPhoneError("Phone must be exactly 10 digits");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addForm.name, phone: addForm.phone, dob: addForm.dob, notes: addForm.notes, email: "" }),
      });
      if (!res.ok) throw new Error();
      const newCustomer = await res.json();
      await refetchCustomers();
      selectCustomer(newCustomer);
      setShowAddCustomer(false);
      setAddForm({ name: "", phone: "", dob: "", notes: "" });
      setAddPhoneError("");
      toast({ title: "Customer Added", description: `${addForm.name} added & selected.` });
    } catch {
      toast({ title: "Error", description: "Failed to add customer.", variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  const handleGenerateBill = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add at least one service or product.", variant: "destructive" });
      return;
    }
    createBill.mutate(
      {
        data: {
          customerId: customerId || null,
          customerName: customerName || "Walk-in Customer",
          customerPhone: customerPhone || "",
          items: cart.map(item => ({
            type: item.type,
            itemId: item.itemId,
            name: item.name,
            staffId: item.staffId || null,
            staffName: item.staffName || null,
            price: item.price,
            quantity: item.quantity,
            discount: item.discountAmt,
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
          toast({ title: "✓ Bill Generated!", description: `${bill.billNumber} — ₹${finalAmount.toLocaleString("en-IN")}` });
          setCart([]);
          setCustomerId("");
          setCustomerName("Walk-in Customer");
          setCustomerPhone("");
          setGlobalDiscountAmt(0);
        },
        onError: () => {
          toast({ title: "Failed to generate bill", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── LEFT PANEL: Item Selector ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Nav */}
        <div className="shrink-0 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="font-serif font-bold text-primary text-base leading-tight">Point of Sale</h1>
            <p className="text-xs text-muted-foreground">New Bill</p>
          </div>
          <div className="flex-1" />
          {/* Tab Toggle */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["services", "products"] as const).map(tab => (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setActiveCategory("All"); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize flex items-center gap-1.5 ${activeTab === tab ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "services" ? <Scissors className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                {tab}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto border-b border-border bg-muted/20">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeCategory === cat ? "bg-primary text-white border-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
              <Receipt className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">No {activeTab} found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item: any) => {
                const id = item.id || item._id;
                const price = Number(activeTab === "services" ? item.price : item.sellingPrice) || 0;
                const inCart = cart.filter(c => c.itemId === id).length;
                return (
                  <button key={id} onClick={() => addToCart(item)}
                    className="relative p-4 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg transition-all text-left group active:scale-95">
                    {inCart > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {inCart}
                      </span>
                    )}
                    <p className="font-semibold text-sm text-foreground leading-snug mb-1 line-clamp-2 pr-6">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground mb-2.5">{item.category}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-base font-bold text-primary">₹{price.toLocaleString("en-IN")}</p>
                      {activeTab === "services" && item.duration && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{item.duration}m
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Cart & Billing ── */}
      <div className="w-[400px] shrink-0 flex flex-col bg-card border-l border-border">

        {/* Customer Selector */}
        <div className="p-4 border-b border-border bg-muted/20">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Customer</p>
          {customerMembership && (
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 border border-violet-200">
              <BadgeCheck className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span className="text-xs font-semibold text-violet-700">{customerMembership.membershipName}</span>
              {customerMembership.discountPercent > 0 && (
                <span className="text-xs text-violet-500">· {customerMembership.discountPercent}% off</span>
              )}
              <span className="text-xs text-violet-400 ml-auto">till {new Date(customerMembership.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          )}
          <div className="relative" ref={customerRef}>
            <button
              onClick={() => setShowCustomerDropdown(v => !v)}
              className="w-full flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-sm text-left"
            >
              <UserCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{customerName || "Walk-in Customer"}</p>
                {customerPhone && <p className="text-xs text-muted-foreground">{customerPhone}</p>}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${showCustomerDropdown ? "rotate-180" : ""}`} />
            </button>

            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/30"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {/* Walk-in option */}
                  <button onClick={selectWalkIn}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors ${!customerId ? "bg-primary/5 text-primary font-semibold" : "text-foreground"}`}>
                    <UserCircle2 className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span>Walk-in Customer</span>
                    {!customerId && <Check className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                  {/* Customer list */}
                  {filteredCustomers.map((c: any) => {
                    const id = c.id || c._id;
                    const isSelected = customerId === id;
                    return (
                      <button key={id} onClick={() => selectCustomer(c)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/5 text-primary font-semibold" : "text-foreground"}`}>
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium truncate text-xs">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                        </div>
                        {c.activeMembership && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-violet-100 text-violet-700 shrink-0">
                            <BadgeCheck className="w-2.5 h-2.5" /> {c.activeMembership.membershipName}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                  {filteredCustomers.length === 0 && customerSearch && (
                    <p className="px-3 py-3 text-xs text-muted-foreground text-center">No customer found</p>
                  )}
                </div>
                {/* Add New Customer */}
                <div className="p-2 border-t border-border">
                  <button
                    onClick={() => { setShowCustomerDropdown(false); setShowAddCustomer(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-xs font-semibold"
                  >
                    <UserPlus className="w-4 h-4" /> Add New Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Receipt className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs text-center text-muted-foreground/60 max-w-36">Click on any service or product on the left to add it here</p>
            </div>
          ) : (
            cart.map(item => {
              const lineTotal = getItemTotal(item);
              const discountAmt = getItemDiscountAmt(item);
              return (
                <div key={item.uid} className="bg-background rounded-xl border border-border overflow-hidden">
                  {/* Item Header */}
                  <div className="flex items-start gap-2 p-3 pb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{item.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-primary">₹{lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                      {discountAmt > 0 && (
                        <p className="text-[10px] text-muted-foreground line-through">₹{(item.price * item.quantity).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                      )}
                    </div>
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center gap-2 px-3 pb-3">
                    {/* Staff */}
                    {item.type === "service" && (
                      <select
                        value={item.staffId || ""}
                        onChange={e => updateCartItem(item.uid, "staffId", e.target.value)}
                        className="flex-1 min-w-0 text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Assign staff</option>
                        {staff.map((s: any) => (
                          <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Qty */}
                    <div className="flex items-center bg-muted/40 border border-border rounded-lg overflow-hidden text-xs shrink-0">
                      <button
                        className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors font-bold text-muted-foreground"
                        onClick={() => updateCartItem(item.uid, "quantity", Math.max(1, item.quantity - 1))}>−</button>
                      <span className="px-2 font-semibold text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                      <button
                        className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors font-bold text-muted-foreground"
                        onClick={() => updateCartItem(item.uid, "quantity", item.quantity + 1)}>+</button>
                    </div>

                    {/* Discount ₹ */}
                    <div className="flex items-center shrink-0 bg-muted/40 border border-border rounded-lg overflow-hidden">
                      <span className="px-1.5 text-[10px] text-muted-foreground font-medium border-r border-border bg-muted/60">₹</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={item.discountAmt === 0 ? "" : item.discountAmt}
                        onChange={e => {
                          const base = item.price * item.quantity;
                          const val = Math.min(base, Math.max(0, Number(e.target.value) || 0));
                          updateCartItem(item.uid, "discountAmt", val);
                        }}
                        className="w-12 text-xs bg-transparent px-1.5 py-1.5 focus:outline-none text-center font-semibold"
                      />
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeCartItem(item.uid)}
                      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors border border-border">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Summary & Actions */}
        <div className="shrink-0 border-t border-border bg-muted/10">

          {/* Summary */}
          <div className="px-4 pt-3 pb-2 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
              <span className="font-medium text-foreground">₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>

            {/* Global Discount Row */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
                <Tag className="w-3.5 h-3.5" /> Extra Discount
              </span>
              <div className="flex items-center ml-auto bg-card border border-border rounded-lg overflow-hidden">
                <span className="text-[11px] px-1.5 text-muted-foreground bg-muted/50 border-r border-border h-full flex items-center py-1.5">₹</span>
                <input
                  type="number" min={0}
                  value={globalDiscountAmt === 0 ? "" : globalDiscountAmt}
                  onChange={e => setGlobalDiscountAmt(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-16 text-xs text-center px-1.5 py-1 focus:outline-none bg-transparent font-semibold"
                />
              </div>
              <span className="text-sm font-medium text-red-500 min-w-[3rem] text-right">
                {globalDiscountAmount > 0 ? `−₹${globalDiscountAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              </span>
            </div>

            {/* Tax Toggle */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <button onClick={() => setTaxEnabled(t => !t)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <div className={`w-8 h-4 rounded-full transition-colors relative ${taxEnabled ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${taxEnabled ? "left-4.5" : "left-0.5"}`} style={{ left: taxEnabled ? "calc(100% - 14px)" : "2px" }} />
                </div>
                GST 18%
              </button>
              <span className={taxEnabled ? "font-medium text-foreground" : ""}>
                {taxEnabled ? `+₹${taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              </span>
            </div>

            {/* Final */}
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="font-bold text-base">Total</span>
              <span className="text-2xl font-bold text-primary">&#8377;{finalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="px-4 pb-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Payment Method</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2.5 flex flex-col items-center gap-1 rounded-xl text-xs font-semibold transition-all border ${paymentMethod === m.id ? "bg-primary text-white border-primary shadow-md" : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Bill */}
          <div className="px-4 pb-4">
            <button
              onClick={handleGenerateBill}
              disabled={cart.length === 0 || createBill.isPending}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-white"
            >
              {createBill.isPending
                ? "Processing..."
                : cart.length === 0
                  ? "Add items to generate bill"
                  : `Generate Bill — ₹${finalAmount.toLocaleString("en-IN")}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Add New Customer Modal ── */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-primary">New Customer</h2>
              <button onClick={() => { setShowAddCustomer(false); setAddPhoneError(""); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Full Name *</label>
                <input required autoFocus placeholder="Enter full name"
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Phone Number * (10 digits)</label>
                <input required type="tel" maxLength={10} placeholder="10-digit mobile number"
                  className={`w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 outline-none ${addPhoneError ? "border-red-400 focus:ring-red-200" : "focus:ring-primary/20"}`}
                  value={addForm.phone}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "");
                    setAddForm({ ...addForm, phone: v });
                    if (v.length === 10) setAddPhoneError("");
                  }}
                />
                {addPhoneError && <p className="text-red-500 text-xs mt-1">{addPhoneError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Date of Birth</label>
                <input type="date"
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={addForm.dob} onChange={e => setAddForm({ ...addForm, dob: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Notes (Optional)</label>
                <textarea rows={2} placeholder="Any special preferences or notes..."
                  className="w-full p-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowAddCustomer(false); setAddPhoneError(""); }}
                  className="flex-1 py-3 rounded-xl border hover:bg-muted font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50">
                  {addLoading ? "Saving..." : "Add & Select"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
