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

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const [customerMembership, setCustomerMembership] = useState<any>(null);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", dob: "", notes: "" });
  const [addPhoneError, setAddPhoneError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const taxPercent = taxEnabled ? 18 : 0;
  const services = servicesData?.services || [];
  const products = productsData?.products || [];
  const customers = customersData?.customers || [];
  const staff = (staffData as any)?.staff || [];

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
      { uid: Math.random().toString(36).substr(2, 9), type: activeTab === "services" ? "service" : "product", itemId: id, name: item.name, price, quantity: 1, discountAmt: 0, staffId: null, staffName: "" },
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

  const getItemTotal = (item: CartItem) => Math.max(0, item.price * item.quantity - (item.discountAmt || 0));

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
    } catch { setCustomerMembership(null); }
  };

  const selectCustomer = (c: any) => {
    const cid = c.id || c._id;
    setCustomerId(cid);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setShowCustomerDropdown(false);
    setCustomerSearch("");
    if (c.activeMembership !== undefined) setCustomerMembership(c.activeMembership);
    else fetchCustomerMembership(cid);
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
      const res = await fetch(`${API_BASE}/customers`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
    } finally { setAddLoading(false); }
  };

  const handleGenerateBill = () => {
    if (cart.length === 0) { toast({ title: "Cart is empty", description: "Add at least one service or product.", variant: "destructive" }); return; }
    createBill.mutate({
      data: {
        customerId: customerId || null, customerName: customerName || "Walk-in Customer", customerPhone: customerPhone || "",
        items: cart.map(item => ({ type: item.type, itemId: item.itemId, name: item.name, staffId: item.staffId || null, staffName: item.staffName || null, price: item.price, quantity: item.quantity, discount: item.discountAmt, total: getItemTotal(item) })),
        subtotal, taxPercent, taxAmount, paymentMethod, discountAmount: globalDiscountAmount, finalAmount, status: "paid",
      } as any,
    }, {
      onSuccess: (bill: any) => {
        toast({ title: "✓ Bill Generated!", description: `${bill.billNumber} — ₹${finalAmount.toLocaleString("en-IN")}` });
        setCart([]); setCustomerId(""); setCustomerName("Walk-in Customer"); setCustomerPhone(""); setGlobalDiscountAmt(0);
      },
      onError: () => toast({ title: "Failed to generate bill", variant: "destructive" }),
    });
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#fafafa" }}>

      {/* ── LEFT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Top Nav */}
        <div className="shrink-0 bg-white border-b border-[#f0eaff] px-5 py-3.5 flex items-center gap-4">
          <Link href="/">
            <button className="w-8 h-8 rounded-xl border border-[#ede9fe] flex items-center justify-center hover:bg-[#f5f3ff] transition-colors text-[#7c3aed]">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-serif font-bold text-[#4c1d95] text-lg leading-tight">Point of Sale</h1>
            <p className="text-xs text-[#a78bfa]">New Bill</p>
          </div>

          <div className="flex-1" />

          {/* Services / Products Toggle */}
          <div className="flex gap-1 bg-[#f5f3ff] rounded-xl p-1">
            {(["services", "products"] as const).map(tab => (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setActiveCategory("All"); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab ? "bg-white shadow text-[#7c3aed]" : "text-[#a78bfa] hover:text-[#7c3aed]"}`}>
                {tab === "services" ? <Scissors className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a78bfa]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ede9fe] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 bg-[#f5f3ff] placeholder:text-[#c4b5fd]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="shrink-0 flex gap-2 px-5 py-3 overflow-x-auto bg-white border-b border-[#f0eaff]">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25" : "bg-[#f5f3ff] text-[#7c3aed] hover:bg-[#ede9fe]"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#fafafa]">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#f5f3ff] flex items-center justify-center">
                <Receipt className="w-7 h-7 text-[#c4b5fd]" />
              </div>
              <p className="text-sm font-medium text-[#a78bfa]">No {activeTab} found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item: any) => {
                const id = item.id || item._id;
                const price = Number(activeTab === "services" ? item.price : item.sellingPrice) || 0;
                const inCart = cart.filter(c => c.itemId === id).length;
                return (
                  <button key={id} onClick={() => addToCart(item)}
                    className={`relative p-4 bg-white rounded-2xl border text-left transition-all active:scale-95 group ${inCart > 0 ? "border-[#7c3aed] shadow-md shadow-[#7c3aed]/10" : "border-[#f0eaff] hover:border-[#c4b5fd] hover:shadow-md hover:shadow-[#7c3aed]/8"}`}>
                    {inCart > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {inCart}
                      </span>
                    )}
                    <p className="text-[11px] font-semibold text-[#a78bfa] uppercase tracking-wider mb-1">{item.category}</p>
                    <p className="font-bold text-sm text-[#1e1b4b] leading-snug mb-2 pr-5 line-clamp-2">{item.name}</p>
                    <div className="flex items-end justify-between mt-auto">
                      <p className="text-base font-extrabold text-[#7c3aed]">₹{price.toLocaleString("en-IN")}</p>
                      {activeTab === "services" && item.duration && (
                        <span className="text-[10px] text-[#a78bfa] flex items-center gap-0.5">
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
      <div className="w-[400px] shrink-0 flex flex-col bg-white border-l border-[#f0eaff]">

        {/* Customer Selector */}
        <div className="px-4 pt-4 pb-3 border-b border-[#f0eaff]">
          <p className="text-[10px] uppercase tracking-widest text-[#a78bfa] font-bold mb-2">Customer</p>
          {customerMembership && (
            <div className="mb-2 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f5f3ff] border border-[#ede9fe]">
              <BadgeCheck className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />
              <span className="text-xs font-semibold text-[#7c3aed]">{customerMembership.membershipName}</span>
              {customerMembership.discountPercent > 0 && (
                <span className="text-xs text-[#a78bfa]">· {customerMembership.discountPercent}% off</span>
              )}
              <span className="text-[10px] text-[#c4b5fd] ml-auto">till {new Date(customerMembership.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
            </div>
          )}
          <div className="relative" ref={customerRef}>
            <button
              onClick={() => setShowCustomerDropdown(v => !v)}
              className="w-full flex items-center gap-2.5 p-3 rounded-xl border border-[#ede9fe] bg-[#f5f3ff] hover:border-[#a78bfa] transition-colors text-sm text-left"
            >
              <UserCircle2 className="w-5 h-5 text-[#7c3aed] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1e1b4b] truncate">{customerName || "Walk-in Customer"}</p>
                {customerPhone && <p className="text-xs text-[#a78bfa]">{customerPhone}</p>}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#a78bfa] transition-transform shrink-0 ${showCustomerDropdown ? "rotate-180" : ""}`} />
            </button>

            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#ede9fe] rounded-2xl shadow-xl shadow-[#7c3aed]/10 z-50 overflow-hidden">
                <div className="p-2 border-b border-[#f0eaff]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a78bfa]" />
                    <input autoFocus type="text" placeholder="Search customer..." value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border border-[#ede9fe] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 bg-[#f5f3ff] placeholder:text-[#c4b5fd]"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  <button onClick={selectWalkIn}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[#f5f3ff] transition-colors ${!customerId ? "bg-[#f5f3ff] text-[#7c3aed] font-semibold" : "text-[#1e1b4b]"}`}>
                    <UserCircle2 className="w-4 h-4 shrink-0 text-[#a78bfa]" />
                    <span>Walk-in Customer</span>
                    {!customerId && <Check className="w-3.5 h-3.5 ml-auto text-[#7c3aed]" />}
                  </button>
                  {filteredCustomers.map((c: any) => {
                    const cid = c.id || c._id;
                    const isSelected = customerId === cid;
                    return (
                      <button key={cid} onClick={() => selectCustomer(c)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[#f5f3ff] transition-colors ${isSelected ? "bg-[#f5f3ff] text-[#7c3aed] font-semibold" : "text-[#1e1b4b]"}`}>
                        <div className="w-7 h-7 rounded-full bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center text-[10px] font-bold shrink-0">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium truncate text-xs">{c.name}</p>
                          <p className="text-[11px] text-[#a78bfa]">{c.phone}</p>
                        </div>
                        {c.activeMembership && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#f5f3ff] text-[#7c3aed] shrink-0">
                            <BadgeCheck className="w-2.5 h-2.5" /> {c.activeMembership.membershipName}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />}
                      </button>
                    );
                  })}
                  {filteredCustomers.length === 0 && customerSearch && (
                    <p className="px-3 py-3 text-xs text-[#a78bfa] text-center">No customer found</p>
                  )}
                </div>
                <div className="p-2 border-t border-[#f0eaff]">
                  <button onClick={() => { setShowCustomerDropdown(false); setShowAddCustomer(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#f5f3ff] text-[#7c3aed] hover:bg-[#ede9fe] transition-colors text-xs font-semibold">
                    <UserPlus className="w-4 h-4" /> Add New Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#f5f3ff] flex items-center justify-center">
                <Receipt className="w-7 h-7 text-[#c4b5fd]" />
              </div>
              <p className="text-sm font-semibold text-[#7c3aed]">Cart is empty</p>
              <p className="text-xs text-center text-[#a78bfa] max-w-36">Tap a service or product to add it here</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const lineTotal = getItemTotal(item);
              return (
                <div key={item.uid} className="bg-white rounded-2xl border border-[#f0eaff] overflow-hidden">
                  <div className="flex items-start gap-2 px-3 pt-3 pb-2">
                    <div className="w-6 h-6 rounded-full bg-[#7c3aed] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#1e1b4b] leading-tight">{item.name}</p>
                      <p className="text-[10px] text-[#a78bfa] capitalize font-medium mt-0.5">{item.type}</p>
                    </div>
                    <p className="font-extrabold text-sm text-[#7c3aed] shrink-0">₹{lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                  </div>

                  <div className="flex items-center gap-2 px-3 pb-3">
                    {/* Staff */}
                    {item.type === "service" && (
                      <select value={item.staffId || ""} onChange={e => updateCartItem(item.uid, "staffId", e.target.value)}
                        className="flex-1 min-w-0 text-xs bg-[#f5f3ff] border border-[#ede9fe] rounded-lg px-2 py-1.5 text-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20">
                        <option value="">Assign staff</option>
                        {staff.map((s: any) => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
                      </select>
                    )}

                    {/* Qty */}
                    <div className="flex items-center bg-[#f5f3ff] border border-[#ede9fe] rounded-lg overflow-hidden text-xs shrink-0">
                      <button className="w-7 h-7 flex items-center justify-center hover:bg-[#ede9fe] transition-colors font-bold text-[#7c3aed]"
                        onClick={() => updateCartItem(item.uid, "quantity", Math.max(1, item.quantity - 1))}>−</button>
                      <span className="px-2 font-bold text-sm min-w-[1.5rem] text-center text-[#1e1b4b]">{item.quantity}</span>
                      <button className="w-7 h-7 flex items-center justify-center hover:bg-[#ede9fe] transition-colors font-bold text-[#7c3aed]"
                        onClick={() => updateCartItem(item.uid, "quantity", item.quantity + 1)}>+</button>
                    </div>

                    {/* Discount ₹ */}
                    <div className="flex items-center shrink-0 bg-[#f5f3ff] border border-[#ede9fe] rounded-lg overflow-hidden">
                      <span className="px-1.5 text-[10px] text-[#a78bfa] font-medium border-r border-[#ede9fe] bg-[#ede9fe]/60 h-full flex items-center py-1.5">₹</span>
                      <input type="number" min={0} placeholder="0"
                        value={item.discountAmt === 0 ? "" : item.discountAmt}
                        onChange={e => {
                          const base = item.price * item.quantity;
                          const val = Math.min(base, Math.max(0, Number(e.target.value) || 0));
                          updateCartItem(item.uid, "discountAmt", val);
                        }}
                        className="w-12 text-xs bg-transparent px-1.5 py-1.5 focus:outline-none text-center font-semibold text-[#1e1b4b]"
                      />
                    </div>

                    {/* Remove */}
                    <button onClick={() => removeCartItem(item.uid)}
                      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg hover:bg-rose-50 text-[#c4b5fd] hover:text-rose-500 transition-colors border border-[#f0eaff]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Bill Summary — dark purple panel ── */}
        <div className="shrink-0" style={{ background: "linear-gradient(160deg, #3b0764 0%, #4c1d95 40%, #5b21b6 100%)" }}>
          {/* Numbers */}
          <div className="px-4 pt-4 pb-3 space-y-2">
            <div className="flex justify-between text-sm text-[#c4b5fd]">
              <span>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
              <span className="font-semibold text-white">₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>

            {/* Extra Discount */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#c4b5fd] flex items-center gap-1 shrink-0">
                <Tag className="w-3.5 h-3.5" /> Extra Discount
              </span>
              <div className="flex items-center ml-auto bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                <span className="text-[11px] px-1.5 text-[#c4b5fd] border-r border-white/20 h-full flex items-center py-1.5">₹</span>
                <input type="number" min={0}
                  value={globalDiscountAmt === 0 ? "" : globalDiscountAmt}
                  onChange={e => setGlobalDiscountAmt(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-16 text-xs text-center px-1.5 py-1 focus:outline-none bg-transparent font-semibold text-white placeholder:text-white/40"
                />
              </div>
              <span className="text-sm font-medium text-rose-300 min-w-[3rem] text-right">
                {globalDiscountAmount > 0 ? `−₹${globalDiscountAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              </span>
            </div>

            {/* GST Toggle */}
            <div className="flex justify-between items-center text-sm text-[#c4b5fd]">
              <button onClick={() => setTaxEnabled(t => !t)} className="flex items-center gap-2 hover:text-white transition-colors">
                <div className={`w-8 h-4 rounded-full transition-colors relative ${taxEnabled ? "bg-[#a78bfa]" : "bg-white/20"}`}>
                  <div className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: taxEnabled ? "calc(100% - 14px)" : "2px" }} />
                </div>
                GST 18%
              </button>
              <span className={taxEnabled ? "font-medium text-white" : ""}>
                {taxEnabled ? `+₹${taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              </span>
            </div>

            {/* Final Amount */}
            <div className="pt-2 border-t border-white/20 flex justify-between items-center">
              <span className="font-bold text-base text-white">Final Amount</span>
              <span className="text-2xl font-extrabold text-white">₹{finalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="px-4 pb-3">
            <p className="text-[10px] uppercase tracking-widest text-[#a78bfa] font-bold mb-2">Payment Method</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2.5 flex flex-col items-center gap-1 rounded-xl text-xs font-semibold transition-all ${paymentMethod === m.id ? "bg-white text-[#7c3aed] shadow-lg" : "bg-white/10 text-[#c4b5fd] border border-white/15 hover:bg-white/20 hover:text-white"}`}>
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
              className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
              style={{ background: cart.length > 0 ? "linear-gradient(135deg, #db2777 0%, #9333ea 100%)" : undefined, backgroundColor: cart.length === 0 ? "rgba(255,255,255,0.15)" : undefined, boxShadow: cart.length > 0 ? "0 4px 20px rgba(219,39,119,0.4)" : undefined }}
            >
              {createBill.isPending ? "Processing..." : cart.length === 0 ? "Add items to generate bill" : `Generate Bill — ₹${finalAmount.toLocaleString("en-IN")}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Add New Customer Modal ── */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-[#7c3aed]/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-[#4c1d95]">New Customer</h2>
              <button onClick={() => { setShowAddCustomer(false); setAddPhoneError(""); }}
                className="p-2 rounded-xl hover:bg-[#f5f3ff] transition-colors text-[#a78bfa] hover:text-[#7c3aed]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#7c3aed] uppercase tracking-wider">Full Name *</label>
                <input required autoFocus placeholder="Enter full name"
                  className="w-full p-3 rounded-xl border border-[#ede9fe] bg-[#f5f3ff] focus:ring-2 focus:ring-[#7c3aed]/20 outline-none text-[#1e1b4b] placeholder:text-[#c4b5fd]"
                  value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#7c3aed] uppercase tracking-wider">Phone Number * (10 digits)</label>
                <input required type="tel" maxLength={10} placeholder="10-digit mobile number"
                  className={`w-full p-3 rounded-xl border bg-[#f5f3ff] focus:ring-2 outline-none text-[#1e1b4b] placeholder:text-[#c4b5fd] ${addPhoneError ? "border-red-400 focus:ring-red-200" : "border-[#ede9fe] focus:ring-[#7c3aed]/20"}`}
                  value={addForm.phone}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ""); setAddForm({ ...addForm, phone: v }); if (v.length === 10) setAddPhoneError(""); }}
                />
                {addPhoneError && <p className="text-red-500 text-xs mt-1">{addPhoneError}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#7c3aed] uppercase tracking-wider">Date of Birth</label>
                <input type="date" className="w-full p-3 rounded-xl border border-[#ede9fe] bg-[#f5f3ff] focus:ring-2 focus:ring-[#7c3aed]/20 outline-none text-[#1e1b4b]"
                  value={addForm.dob} onChange={e => setAddForm({ ...addForm, dob: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#7c3aed] uppercase tracking-wider">Notes (Optional)</label>
                <textarea rows={2} placeholder="Any special preferences or notes..."
                  className="w-full p-3 rounded-xl border border-[#ede9fe] bg-[#f5f3ff] focus:ring-2 focus:ring-[#7c3aed]/20 outline-none resize-none text-[#1e1b4b] placeholder:text-[#c4b5fd]"
                  value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => { setShowAddCustomer(false); setAddPhoneError(""); }}
                  className="flex-1 py-3 rounded-xl border border-[#ede9fe] text-[#7c3aed] hover:bg-[#f5f3ff] font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
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
