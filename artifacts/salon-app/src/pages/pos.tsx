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

// Exact sidebar colours from CSS theme
const DARK   = "#1e1528";   // sidebar bg
const DARK2  = "#2d1f42";   // sidebar-accent (slightly lighter)
const DARK3  = "#241832";   // mid-level
const PINK   = "#ec4699";   // secondary / pink accent
const WHITE  = "#ffffff";
const OFF    = "#ebe8f0";   // near-white text on dark
const MUTED  = "#9d8db0";   // muted text on dark

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
    <div className="flex h-screen overflow-hidden" style={{ background: WHITE }}>

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top nav — dark */}
        <div className="shrink-0 px-5 py-3.5 flex items-center gap-4" style={{ background: DARK }}>
          <Link href="/">
            <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors" style={{ background: DARK2, color: OFF }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-serif font-bold text-lg leading-tight" style={{ color: WHITE }}>Point of Sale</h1>
            <p className="text-xs" style={{ color: MUTED }}>New Bill</p>
          </div>

          <div className="flex-1" />

          {/* Services / Products toggle */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: DARK2 }}>
            {(["services", "products"] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setActiveCategory("All"); }}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                style={{ background: activeTab === tab ? WHITE : "transparent", color: activeTab === tab ? DARK : MUTED }}>
                {tab === "services" ? <Scissors className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none border-0"
              style={{ background: DARK2, color: OFF }}
            />
          </div>
        </div>

        {/* Category pills — dark bar */}
        <div className="shrink-0 flex gap-2 px-5 py-3 overflow-x-auto" style={{ background: DARK3, borderBottom: `1px solid ${DARK2}` }}>
          {categories.map((cat: string) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={activeCategory === cat
                ? { background: PINK, color: WHITE, boxShadow: `0 2px 10px ${PINK}55` }
                : { background: DARK2, color: MUTED }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Service / Product cards — pure white grid */}
        <div className="flex-1 overflow-y-auto p-5" style={{ background: "#f7f7f7" }}>
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#ede9f4" }}>
                <Receipt className="w-6 h-6" style={{ color: MUTED }} />
              </div>
              <p className="text-sm font-medium" style={{ color: MUTED }}>No {activeTab} found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item: any) => {
                const id     = item.id || item._id;
                const price  = Number(activeTab === "services" ? item.price : item.sellingPrice) || 0;
                const inCart = cart.filter(c => c.itemId === id).length;
                return (
                  <button key={id} onClick={() => addToCart(item)}
                    className="relative text-left p-4 rounded-2xl transition-all active:scale-95"
                    style={{
                      background: WHITE,
                      border: inCart > 0 ? `2px solid ${DARK}` : `1.5px solid #e8e4ef`,
                      boxShadow: inCart > 0 ? `0 4px 16px ${DARK}22` : "0 1px 4px rgba(0,0,0,0.05)",
                    }}>
                    {inCart > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: DARK }}>
                        {inCart}
                      </span>
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: MUTED }}>{item.category}</p>
                    <p className="font-bold text-sm leading-snug mb-3 pr-5 line-clamp-2" style={{ color: "#0f0a1a" }}>{item.name}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-base font-extrabold" style={{ color: DARK }}>{`₹${price.toLocaleString("en-IN")}`}</p>
                      {activeTab === "services" && item.duration && (
                        <span className="text-[10px] flex items-center gap-0.5" style={{ color: MUTED }}>
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
      <div className="w-[390px] shrink-0 flex flex-col" style={{ background: DARK, borderLeft: `1px solid ${DARK2}` }}>

        {/* Customer selector */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${DARK2}` }}>
          <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: MUTED }}>Customer</p>

          {customerMembership && (
            <div className="mb-2 flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: DARK2 }}>
              <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: PINK }} />
              <span className="text-xs font-semibold" style={{ color: OFF }}>{customerMembership.membershipName}</span>
              {customerMembership.discountPercent > 0 && <span className="text-xs" style={{ color: MUTED }}>· {customerMembership.discountPercent}% off</span>}
              <span className="text-[10px] ml-auto" style={{ color: MUTED }}>till {new Date(customerMembership.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
            </div>
          )}

          <div className="relative" ref={customerRef}>
            <button onClick={() => setShowCustomerDropdown(v => !v)}
              className="w-full flex items-center gap-2.5 p-3 rounded-xl text-sm text-left transition-colors"
              style={{ background: DARK2, border: `1px solid ${showCustomerDropdown ? PINK : "transparent"}` }}>
              <UserCircle2 className="w-5 h-5 shrink-0" style={{ color: PINK }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: WHITE }}>{customerName || "Walk-in Customer"}</p>
                {customerPhone && <p className="text-xs" style={{ color: MUTED }}>{customerPhone}</p>}
              </div>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${showCustomerDropdown ? "rotate-180" : ""}`} style={{ color: MUTED }} />
            </button>

            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: DARK2, border: `1px solid ${DARK3}` }}>
                <div className="p-2" style={{ borderBottom: `1px solid ${DARK3}` }}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: MUTED }} />
                    <input autoFocus type="text" placeholder="Search customer..." value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg text-xs focus:outline-none"
                      style={{ background: DARK, color: OFF, border: "none" }}
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  <button onClick={selectWalkIn}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                    style={{ background: !customerId ? `${DARK}80` : "transparent", color: !customerId ? WHITE : OFF }}>
                    <UserCircle2 className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                    <span>Walk-in Customer</span>
                    {!customerId && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: PINK }} />}
                  </button>
                  {filteredCustomers.map((c: any) => {
                    const cid = c.id || c._id;
                    const sel = customerId === cid;
                    return (
                      <button key={cid} onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                        style={{ background: sel ? `${DARK}80` : "transparent", color: sel ? WHITE : OFF }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: DARK, color: OFF }}>
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium truncate text-xs">{c.name}</p>
                          <p className="text-[11px]" style={{ color: MUTED }}>{c.phone}</p>
                        </div>
                        {c.activeMembership && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0" style={{ background: `${PINK}20`, color: PINK }}>
                            <BadgeCheck className="w-2.5 h-2.5" /> {c.activeMembership.membershipName}
                          </span>
                        )}
                        {sel && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: PINK }} />}
                      </button>
                    );
                  })}
                  {filteredCustomers.length === 0 && customerSearch && (
                    <p className="px-3 py-3 text-xs text-center" style={{ color: MUTED }}>No customer found</p>
                  )}
                </div>
                <div className="p-2" style={{ borderTop: `1px solid ${DARK3}` }}>
                  <button onClick={() => { setShowCustomerDropdown(false); setShowAddCustomer(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: DARK, color: OFF }}>
                    <UserPlus className="w-4 h-4" style={{ color: PINK }} /> Add New Customer
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: DARK2 }}>
                <Receipt className="w-6 h-6" style={{ color: MUTED }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: OFF }}>Cart is empty</p>
              <p className="text-xs text-center max-w-36" style={{ color: MUTED }}>Tap a service or product to add it here</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const lineTotal = getItemTotal(item);
              return (
                <div key={item.uid} className="rounded-2xl overflow-hidden" style={{ background: DARK2 }}>
                  <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
                    <div className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: DARK, color: OFF }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight" style={{ color: WHITE }}>{item.name}</p>
                      <p className="text-[10px] font-medium mt-0.5 capitalize" style={{ color: MUTED }}>{item.type}</p>
                    </div>
                    <p className="font-extrabold text-sm shrink-0" style={{ color: WHITE }}>₹{lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 pb-3">
                    {/* Staff */}
                    {item.type === "service" && (
                      <select value={item.staffId || ""} onChange={e => updateCartItem(item.uid, "staffId", e.target.value)}
                        className="flex-1 min-w-0 text-xs rounded-lg px-2 py-1.5 focus:outline-none border-0"
                        style={{ background: DARK, color: OFF }}>
                        <option value="">Assign staff</option>
                        {staff.map((s: any) => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
                      </select>
                    )}
                    {/* Qty */}
                    <div className="flex items-center rounded-lg overflow-hidden shrink-0" style={{ background: DARK }}>
                      <button className="w-7 h-7 flex items-center justify-center font-bold transition-colors hover:opacity-70" style={{ color: OFF }}
                        onClick={() => updateCartItem(item.uid, "quantity", Math.max(1, item.quantity - 1))}>−</button>
                      <span className="px-2 font-bold text-sm min-w-[1.5rem] text-center" style={{ color: WHITE }}>{item.quantity}</span>
                      <button className="w-7 h-7 flex items-center justify-center font-bold transition-colors hover:opacity-70" style={{ color: OFF }}
                        onClick={() => updateCartItem(item.uid, "quantity", item.quantity + 1)}>+</button>
                    </div>
                    {/* Discount */}
                    <div className="flex items-center shrink-0 rounded-lg overflow-hidden" style={{ background: DARK }}>
                      <span className="px-1.5 text-[10px] font-medium border-r h-full flex items-center py-1.5" style={{ color: MUTED, borderColor: DARK2 }}>₹</span>
                      <input type="number" min={0} placeholder="0"
                        value={item.discountAmt === 0 ? "" : item.discountAmt}
                        onChange={e => { const base = item.price * item.quantity; updateCartItem(item.uid, "discountAmt", Math.min(base, Math.max(0, Number(e.target.value) || 0))); }}
                        className="w-12 text-xs bg-transparent px-1.5 py-1.5 focus:outline-none text-center font-semibold"
                        style={{ color: WHITE }}
                      />
                    </div>
                    {/* Remove */}
                    <button onClick={() => removeCartItem(item.uid)}
                      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg transition-colors hover:opacity-70"
                      style={{ background: DARK, color: MUTED }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Bill summary ── */}
        <div className="shrink-0" style={{ borderTop: `1px solid ${DARK2}` }}>
          <div className="px-4 pt-4 pb-2 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span style={{ color: MUTED }}>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
              <span className="font-semibold" style={{ color: OFF }}>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            {/* Extra Discount */}
            <div className="flex items-center gap-2">
              <span className="text-sm flex items-center gap-1 shrink-0" style={{ color: MUTED }}>
                <Tag className="w-3.5 h-3.5" /> Extra Discount
              </span>
              <div className="flex items-center ml-auto rounded-lg overflow-hidden" style={{ background: DARK2 }}>
                <span className="text-[11px] px-1.5 flex items-center py-1.5 border-r" style={{ color: MUTED, borderColor: DARK3 }}>₹</span>
                <input type="number" min={0}
                  value={globalDiscountAmt === 0 ? "" : globalDiscountAmt}
                  onChange={e => setGlobalDiscountAmt(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-16 text-xs text-center px-1.5 py-1 focus:outline-none bg-transparent font-semibold"
                  style={{ color: WHITE }}
                />
              </div>
              <span className="text-sm font-medium min-w-[3rem] text-right" style={{ color: globalDiscountAmount > 0 ? PINK : MUTED }}>
                {globalDiscountAmount > 0 ? `−₹${globalDiscountAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              </span>
            </div>
            {/* GST */}
            <div className="flex justify-between items-center text-sm">
              <button onClick={() => setTaxEnabled(t => !t)} className="flex items-center gap-2 transition-colors" style={{ color: MUTED }}>
                <div className="w-8 h-4 rounded-full relative transition-colors" style={{ background: taxEnabled ? PINK : DARK2 }}>
                  <div className="w-3 h-3 rounded-full absolute top-0.5 transition-all bg-white" style={{ left: taxEnabled ? "calc(100% - 14px)" : "2px" }} />
                </div>
                GST 18%
              </button>
              <span className="font-medium" style={{ color: taxEnabled ? OFF : MUTED }}>
                {taxEnabled ? `+₹${taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              </span>
            </div>
            {/* Total */}
            <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${DARK2}` }}>
              <span className="font-bold text-base" style={{ color: WHITE }}>Final Amount</span>
              <span className="text-2xl font-extrabold" style={{ color: WHITE }}>₹{finalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="px-4 pb-3">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: MUTED }}>Payment Method</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                  className="py-2.5 flex flex-col items-center gap-1 rounded-xl text-xs font-semibold transition-all"
                  style={paymentMethod === m.id
                    ? { background: WHITE, color: DARK, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }
                    : { background: DARK2, color: MUTED }}>
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Bill */}
          <div className="px-4 pb-5">
            <button
              onClick={handleGenerateBill}
              disabled={cart.length === 0 || createBill.isPending}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={cart.length > 0
                ? { background: `linear-gradient(135deg, ${DARK2} 0%, ${PINK} 100%)`, color: WHITE, boxShadow: `0 4px 20px ${PINK}44` }
                : { background: DARK2, color: MUTED }}>
              {createBill.isPending ? "Processing..." : cart.length === 0 ? "Add items to generate bill" : `Generate Bill — ₹${finalAmount.toLocaleString("en-IN")}`}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ Add Customer Modal ══════════════ */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="rounded-3xl p-8 w-full max-w-md shadow-2xl" style={{ background: DARK2, border: `1px solid ${DARK3}` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold" style={{ color: WHITE }}>New Customer</h2>
              <button onClick={() => { setShowAddCustomer(false); setAddPhoneError(""); }}
                className="p-2 rounded-xl transition-colors" style={{ background: DARK, color: MUTED }}>
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
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: MUTED }}>{f.label}</label>
                  <input required={f.required} type={f.type} placeholder={f.placeholder}
                    className="w-full p-3 rounded-xl focus:outline-none border-0"
                    style={{ background: DARK, color: OFF }}
                    value={(addForm as any)[f.key]}
                    onChange={e => {
                      let v = e.target.value;
                      if (f.key === "phone") { v = v.replace(/\D/g, ""); if (v.length === 10) setAddPhoneError(""); }
                      setAddForm({ ...addForm, [f.key]: v });
                    }}
                    maxLength={f.key === "phone" ? 10 : undefined}
                  />
                  {f.key === "phone" && addPhoneError && <p className="text-red-400 text-xs mt-1">{addPhoneError}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: MUTED }}>Notes (Optional)</label>
                <textarea rows={2} placeholder="Any special preferences..."
                  className="w-full p-3 rounded-xl focus:outline-none border-0 resize-none"
                  style={{ background: DARK, color: OFF }}
                  value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddCustomer(false); setAddPhoneError(""); }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-colors"
                  style={{ background: DARK, color: OFF }}>Cancel</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: `linear-gradient(135deg, ${DARK} 0%, ${PINK} 100%)`, boxShadow: `0 4px 16px ${PINK}40` }}>
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
