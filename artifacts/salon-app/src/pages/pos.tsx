import { useState, useMemo, useRef, useEffect } from "react";
import { useListServices, useListProducts, useListCustomers, useListStaff, useCreateBill } from "@workspace/api-client-react";
import {
  Search, Trash2, Receipt, CreditCard, Banknote, Smartphone,
  ChevronLeft, Wallet, UserPlus, X, Scissors, Package, Clock,
  ChevronDown, UserCircle2, Tag, Check, BadgeCheck
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api";

/* ── Hide number-input spinners globally for this page ── */
const noSpinner = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

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
  { id: "cash",   icon: Banknote,    label: "Cash" },
  { id: "upi",    icon: Smartphone,  label: "UPI" },
  { id: "card",   icon: CreditCard,  label: "Card" },
  { id: "wallet", icon: Wallet,      label: "Wallet" },
];

const poppins = { fontFamily: "'Poppins', sans-serif" } as const;

export default function POS() {
  const { toast } = useToast();
  const { data: servicesData } = useListServices();
  const { data: productsData } = useListProducts();
  const { data: customersData, refetch: refetchCustomers } = useListCustomers();
  const { data: staffData } = useListStaff();
  const createBill = useCreateBill();

  const [activeTab, setActiveTab]         = useState<"services" | "products">("services");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch]               = useState("");
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [customerId, setCustomerId]       = useState<string>("");
  const [customerName, setCustomerName]   = useState<string>("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "wallet">("upi");
  const [taxEnabled, setTaxEnabled]       = useState(false);
  const [globalDiscountAmt, setGlobalDiscountAmt] = useState(0);
  const [customerSearch, setCustomerSearch]       = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const [customerMembership, setCustomerMembership] = useState<any>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addForm, setAddForm]       = useState({ name: "", phone: "", dob: "", notes: "" });
  const [addPhoneError, setAddPhoneError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const taxPercent = taxEnabled ? 18 : 0;
  const services   = servicesData?.services || [];
  const products   = productsData?.products || [];
  const customers  = customersData?.customers || [];
  const staff      = (staffData as any)?.staff || [];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowCustomerDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const categories = useMemo(() => {
    const items = activeTab === "services" ? services : products;
    return ["All", ...Array.from(new Set(items.map((i: any) => i.category)))];
  }, [services, products, activeTab]);

  const filteredItems = useMemo(() => {
    const items = activeTab === "services" ? services : products;
    return items.filter((item: any) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (activeCategory === "All" || item.category === activeCategory)
    );
  }, [services, products, activeTab, search, activeCategory]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const t = customerSearch.toLowerCase();
    return customers.filter((c: any) => c.name?.toLowerCase().includes(t) || c.phone?.includes(t));
  }, [customers, customerSearch]);

  const addToCart = (item: any) => {
    const id    = item.id || item._id;
    const price = Number(activeTab === "services" ? item.price : item.sellingPrice) || 0;
    setCart(prev => [...prev, { uid: Math.random().toString(36).substr(2, 9), type: activeTab === "services" ? "service" : "product", itemId: id, name: item.name, price, quantity: 1, discountAmt: 0, staffId: null, staffName: "" }]);
  };

  const updateCartItem = (uid: string, field: keyof CartItem, value: any) => {
    setCart(prev => prev.map(item => {
      if (item.uid !== uid) return item;
      if (field === "staffId") { const s = staff.find((s: any) => (s.id || s._id) === value); return { ...item, staffId: value || null, staffName: s?.name || "" }; }
      return { ...item, [field]: value };
    }));
  };

  const removeCartItem = (uid: string) => setCart(prev => prev.filter(i => i.uid !== uid));
  const getItemTotal   = (item: CartItem) => Math.max(0, item.price * item.quantity - (item.discountAmt || 0));

  const subtotal            = cart.reduce((a, i) => a + getItemTotal(i), 0);
  const globalDiscountAmount = Math.min(globalDiscountAmt, subtotal);
  const afterDiscount       = Math.max(0, subtotal - globalDiscountAmount);
  const taxAmount           = (afterDiscount * taxPercent) / 100;
  const finalAmount         = Math.round(afterDiscount + taxAmount);

  const fetchMembership = async (cid: string) => {
    try { const r = await fetch(`${API_BASE}/customer-memberships/customer/${cid}`); const d = await r.json(); setCustomerMembership(d.membership || null); }
    catch { setCustomerMembership(null); }
  };

  const selectCustomer = (c: any) => {
    const cid = c.id || c._id;
    setCustomerId(cid); setCustomerName(c.name); setCustomerPhone(c.phone);
    setShowCustomerDropdown(false); setCustomerSearch("");
    if (c.activeMembership !== undefined) setCustomerMembership(c.activeMembership);
    else fetchMembership(cid);
  };

  const selectWalkIn = () => {
    setCustomerId(""); setCustomerName("Walk-in Customer"); setCustomerPhone("");
    setShowCustomerDropdown(false); setCustomerSearch(""); setCustomerMembership(null);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(addForm.phone)) { setAddPhoneError("Phone must be exactly 10 digits"); return; }
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: addForm.name, phone: addForm.phone, dob: addForm.dob, notes: addForm.notes, email: "" }) });
      if (!res.ok) throw new Error();
      const newC = await res.json(); await refetchCustomers(); selectCustomer(newC);
      setShowAddCustomer(false); setAddForm({ name: "", phone: "", dob: "", notes: "" }); setAddPhoneError("");
      toast({ title: "Customer Added", description: `${addForm.name} added & selected.` });
    } catch { toast({ title: "Error", description: "Failed to add customer.", variant: "destructive" }); }
    finally { setAddLoading(false); }
  };

  const handleGenerateBill = () => {
    if (cart.length === 0) { toast({ title: "Cart is empty", description: "Add at least one item.", variant: "destructive" }); return; }
    createBill.mutate({ data: { customerId: customerId || null, customerName: customerName || "Walk-in Customer", customerPhone: customerPhone || "", items: cart.map(i => ({ type: i.type, itemId: i.itemId, name: i.name, staffId: i.staffId || null, staffName: i.staffName || null, price: i.price, quantity: i.quantity, discount: i.discountAmt, total: getItemTotal(i) })), subtotal, taxPercent, taxAmount, paymentMethod, discountAmount: globalDiscountAmount, finalAmount, status: "paid" } as any }, {
      onSuccess: (bill: any) => { toast({ title: "✓ Bill Generated!", description: `${bill.billNumber} — ₹${finalAmount.toLocaleString("en-IN")}` }); setCart([]); setCustomerId(""); setCustomerName("Walk-in Customer"); setCustomerPhone(""); setGlobalDiscountAmt(0); },
      onError: () => toast({ title: "Failed to generate bill", variant: "destructive" }),
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={poppins}>

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top nav */}
        <div className="shrink-0 px-5 py-3.5 flex items-center gap-4 bg-sidebar">
          <Link href="/">
            <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors bg-sidebar-accent text-white hover:bg-sidebar-accent/80">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white tracking-wide" style={poppins}>Point of Sale</h1>
            <p className="text-xs text-white/60">New Bill</p>
          </div>

          <div className="flex-1" />

          {/* Services / Products toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-sidebar-accent">
            {(["services", "products"] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setActiveCategory("All"); }}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                style={{
                  background: activeTab === tab ? "white" : "transparent",
                  color: activeTab === tab ? "hsl(var(--primary))" : "rgba(255,255,255,0.6)"
                }}>
                {tab === "services" ? <Scissors className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>

          {/* Search — wider bar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services or products..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none border-0 bg-sidebar-accent text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="shrink-0 flex gap-2 px-5 py-3 overflow-x-auto bg-sidebar/90 border-b border-sidebar-border">
          {categories.map((cat: string) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: activeCategory === cat ? "hsl(var(--sidebar-primary))" : "hsl(var(--sidebar-accent))",
                color: "white",
                boxShadow: activeCategory === cat ? "0 2px 10px hsl(var(--sidebar-primary) / 0.4)" : "none"
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Service / Product cards grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-muted/40">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10">
                <Receipt className="w-6 h-6 text-primary/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No {activeTab} found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item: any) => {
                const id     = item.id || item._id;
                const price  = Number(activeTab === "services" ? item.price : item.sellingPrice) || 0;
                const inCart = cart.filter(c => c.itemId === id).length;
                return (
                  <button key={id} onClick={() => addToCart(item)}
                    className="relative text-left p-4 rounded-2xl bg-card transition-all active:scale-95 hover:shadow-md"
                    style={{
                      border: inCart > 0 ? "2px solid hsl(var(--primary))" : "1.5px solid hsl(var(--border))",
                      boxShadow: inCart > 0 ? "0 4px 16px hsl(var(--primary) / 0.15)" : undefined,
                    }}>
                    {inCart > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full text-primary-foreground text-[10px] font-bold flex items-center justify-center bg-primary">
                        {inCart}
                      </span>
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">{item.category}</p>
                    <p className="font-bold text-sm leading-snug mb-3 pr-5 line-clamp-2 text-foreground">{item.name}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-base font-extrabold text-primary">{`₹${price.toLocaleString("en-IN")}`}</p>
                      {activeTab === "services" && item.duration && (
                        <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
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

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="w-[390px] shrink-0 flex flex-col bg-sidebar border-l border-sidebar-border">

        {/* Customer selector */}
        <div className="px-4 pt-4 pb-3 border-b border-sidebar-border">
          <p className="text-[10px] uppercase tracking-widest font-bold mb-2 text-white">Customer</p>

          {customerMembership && (
            <div className="mb-2 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sidebar-accent">
              <BadgeCheck className="w-3.5 h-3.5 shrink-0 text-sidebar-primary" />
              <span className="text-xs font-semibold text-white">{customerMembership.membershipName}</span>
              {customerMembership.discountPercent > 0 && <span className="text-xs text-white/70">· {customerMembership.discountPercent}% off</span>}
              <span className="text-[10px] ml-auto text-white/60">till {new Date(customerMembership.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
            </div>
          )}

          <div className="relative" ref={customerRef}>
            <button onClick={() => setShowCustomerDropdown(v => !v)}
              className="w-full flex items-center gap-2.5 p-3 rounded-xl text-sm text-left transition-colors bg-sidebar-accent"
              style={{ border: `1px solid ${showCustomerDropdown ? "hsl(var(--sidebar-primary))" : "transparent"}` }}>
              <UserCircle2 className="w-5 h-5 shrink-0 text-sidebar-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-white">{customerName || "Walk-in Customer"}</p>
                {customerPhone && <p className="text-xs text-white/60">{customerPhone}</p>}
              </div>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform text-white ${showCustomerDropdown ? "rotate-180" : ""}`} />
            </button>

            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl shadow-2xl z-50 overflow-hidden bg-sidebar-accent border border-sidebar-border">
                <div className="p-2 border-b border-sidebar-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                    <input autoFocus type="text" placeholder="Search customer..." value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg text-xs focus:outline-none bg-sidebar text-white border-none placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  <button onClick={selectWalkIn}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-sidebar/50 text-white"
                    style={{ background: !customerId ? "hsl(var(--sidebar) / 0.6)" : "transparent" }}>
                    <UserCircle2 className="w-4 h-4 shrink-0 text-white/60" />
                    <span>Walk-in Customer</span>
                    {!customerId && <Check className="w-3.5 h-3.5 ml-auto text-sidebar-primary" />}
                  </button>
                  {filteredCustomers.map((c: any) => {
                    const cid = c.id || c._id;
                    const sel = customerId === cid;
                    return (
                      <button key={cid} onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-sidebar/50 text-white"
                        style={{ background: sel ? "hsl(var(--sidebar) / 0.6)" : "transparent" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-sidebar text-white">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium truncate text-xs text-white">{c.name}</p>
                          <p className="text-[11px] text-white/60">{c.phone}</p>
                        </div>
                        {c.activeMembership && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0 text-sidebar-primary"
                            style={{ background: "hsl(var(--sidebar-primary) / 0.15)" }}>
                            <BadgeCheck className="w-2.5 h-2.5" /> {c.activeMembership.membershipName}
                          </span>
                        )}
                        {sel && <Check className="w-3.5 h-3.5 shrink-0 text-sidebar-primary" />}
                      </button>
                    );
                  })}
                  {filteredCustomers.length === 0 && customerSearch && (
                    <p className="px-3 py-3 text-xs text-center text-white/50">No customer found</p>
                  )}
                </div>
                <div className="p-2 border-t border-sidebar-border">
                  <button onClick={() => { setShowCustomerDropdown(false); setShowAddCustomer(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors bg-sidebar text-white hover:bg-sidebar/80">
                    <UserPlus className="w-4 h-4 text-sidebar-primary" /> Add New Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-sidebar-accent">
                <Receipt className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-sm font-semibold text-white">Cart is empty</p>
              <p className="text-xs text-center max-w-36 text-white/60">Tap a service or product to add it here</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const lineTotal = getItemTotal(item);
              return (
                <div key={item.uid} className="rounded-2xl overflow-hidden bg-sidebar-accent">
                  <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
                    <div className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 bg-sidebar text-white">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight text-white">{item.name}</p>
                      <p className="text-[10px] font-medium mt-0.5 capitalize text-white/60">{item.type}</p>
                    </div>
                    <p className="font-extrabold text-sm shrink-0 text-white">₹{lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 pb-3">
                    {/* Staff */}
                    {item.type === "service" && (
                      <select value={item.staffId || ""} onChange={e => updateCartItem(item.uid, "staffId", e.target.value)}
                        className="flex-1 min-w-0 text-xs rounded-lg px-2 py-1.5 focus:outline-none border-0 bg-sidebar text-white">
                        <option value="">Assign staff</option>
                        {staff.map((s: any) => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
                      </select>
                    )}
                    {/* Qty */}
                    <div className="flex items-center rounded-lg overflow-hidden shrink-0 bg-sidebar">
                      <button className="w-7 h-7 flex items-center justify-center font-bold transition-colors hover:opacity-70 text-white"
                        onClick={() => updateCartItem(item.uid, "quantity", Math.max(1, item.quantity - 1))}>−</button>
                      <span className="px-2 font-bold text-sm min-w-[1.5rem] text-center text-white">{item.quantity}</span>
                      <button className="w-7 h-7 flex items-center justify-center font-bold transition-colors hover:opacity-70 text-white"
                        onClick={() => updateCartItem(item.uid, "quantity", item.quantity + 1)}>+</button>
                    </div>
                    {/* Discount — no spinner */}
                    <div className="flex items-center shrink-0 rounded-lg overflow-hidden bg-sidebar">
                      <span className="px-1.5 text-[10px] font-medium border-r h-full flex items-center py-1.5 text-white border-sidebar-border">₹</span>
                      <input type="number" min={0} placeholder="0"
                        value={item.discountAmt === 0 ? "" : item.discountAmt}
                        onChange={e => { const base = item.price * item.quantity; updateCartItem(item.uid, "discountAmt", Math.min(base, Math.max(0, Number(e.target.value) || 0))); }}
                        className={`w-12 text-xs bg-transparent px-1.5 py-1.5 focus:outline-none text-center font-semibold text-white ${noSpinner}`}
                      />
                    </div>
                    {/* Remove */}
                    <button onClick={() => removeCartItem(item.uid)}
                      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg transition-colors hover:opacity-70 bg-sidebar text-white">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Bill summary ── */}
        <div className="shrink-0 border-t border-sidebar-border">
          <div className="px-4 pt-4 pb-2 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-white">Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
              <span className="font-semibold text-white">₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            {/* Extra Discount */}
            <div className="flex items-center gap-2">
              <span className="text-sm flex items-center gap-1 shrink-0 text-white">
                <Tag className="w-3.5 h-3.5 text-white" /> Extra Discount
              </span>
              <div className="flex items-center ml-auto rounded-lg overflow-hidden bg-sidebar-accent">
                <span className="text-[11px] px-1.5 flex items-center py-1.5 border-r text-white border-sidebar-border">₹</span>
                <input type="number" min={0}
                  value={globalDiscountAmt === 0 ? "" : globalDiscountAmt}
                  onChange={e => setGlobalDiscountAmt(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className={`w-16 text-xs text-center px-1.5 py-1 focus:outline-none bg-transparent font-semibold text-white ${noSpinner}`}
                />
              </div>
              <span className="text-sm font-medium min-w-[3rem] text-right text-white">
                {globalDiscountAmount > 0 ? `−₹${globalDiscountAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              </span>
            </div>
            {/* GST toggle */}
            <div className="flex justify-between items-center text-sm">
              <button onClick={() => setTaxEnabled(t => !t)} className="flex items-center gap-2 transition-colors text-white">
                <div className="w-8 h-4 rounded-full relative transition-colors"
                  style={{ background: taxEnabled ? "hsl(var(--sidebar-primary))" : "hsl(var(--sidebar-accent))" }}>
                  <div className="w-3 h-3 rounded-full absolute top-0.5 transition-all bg-white" style={{ left: taxEnabled ? "calc(100% - 14px)" : "2px" }} />
                </div>
                GST 18%
              </button>
              <span className="font-medium text-white">
                {taxEnabled ? `+₹${taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              </span>
            </div>
            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-sidebar-border">
              <span className="font-bold text-base text-white">Final Amount</span>
              <span className="text-2xl font-extrabold text-white">₹{finalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="px-4 pb-3">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2 text-white">Payment Method</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                  className="py-2.5 flex flex-col items-center gap-1 rounded-xl text-xs font-semibold transition-all"
                  style={paymentMethod === m.id
                    ? { background: "white", color: "hsl(var(--primary))", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }
                    : { background: "hsl(var(--sidebar-accent))", color: "white" }}>
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Bill — rose gold gradient */}
          <div className="px-4 pb-5">
            <button
              onClick={handleGenerateBill}
              disabled={cart.length === 0 || createBill.isPending}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all text-white ${cart.length > 0 ? "rose-gold-gradient" : "bg-sidebar-accent opacity-40 cursor-not-allowed"}`}
              style={cart.length > 0 ? { boxShadow: "0 4px 20px hsl(15 40% 60% / 0.45)" } : {}}>
              {createBill.isPending ? "Processing..." : cart.length === 0 ? "Add items to generate bill" : `Generate Bill — ₹${finalAmount.toLocaleString("en-IN")}`}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ Add Customer Modal ══════════════ */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="rounded-3xl p-8 w-full max-w-md shadow-2xl bg-sidebar-accent border border-sidebar-border" style={poppins}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">New Customer</h2>
              <button onClick={() => { setShowAddCustomer(false); setAddPhoneError(""); }}
                className="p-2 rounded-xl transition-colors bg-sidebar text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              {[
                { label: "Full Name *", key: "name", type: "text", placeholder: "Enter full name", required: true },
                { label: "Phone Number * (10 digits)", key: "phone", type: "tel", placeholder: "10-digit mobile number", required: true },
                { label: "Date of Birth", key: "dob", type: "date", placeholder: "", required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-white/60">{f.label}</label>
                  <input required={f.required} type={f.type} placeholder={f.placeholder}
                    className={`w-full p-3 rounded-xl focus:outline-none border-0 bg-sidebar text-white placeholder:text-white/30${f.type === "date" ? " [&::-webkit-calendar-picker-indicator]:invert" : ""}`}
                    value={(addForm as any)[f.key]}
                    onChange={e => {
                      let v = e.target.value;
                      if (f.key === "phone") { v = v.replace(/\D/g, ""); if (v.length === 10) setAddPhoneError(""); }
                      setAddForm({ ...addForm, [f.key]: v });
                    }}
                    maxLength={f.key === "phone" ? 10 : undefined}
                  />
                  {f.key === "phone" && addPhoneError && <p className="text-destructive text-xs mt-1">{addPhoneError}</p>}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddCustomer(false); setAddPhoneError(""); }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-colors bg-sidebar text-white hover:bg-sidebar/80">Cancel</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-all rose-gold-gradient"
                  style={{ boxShadow: "0 4px 16px hsl(15 40% 60% / 0.4)" }}>
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
