import { useState, useRef, useEffect } from "react";
import { useListAppointments, useListCustomers, useListStaff, useListServices, useCreateAppointment, useUpdateAppointment } from "@workspace/api-client-react";
import { format, addDays, subDays } from "date-fns";
import { Calendar as CalendarIcon, User, Sparkles, ChevronLeft, ChevronRight, Plus, X, Search, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-violet-100 text-violet-700 border-violet-200",
  "in-progress": "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const categoryColors: Record<string, string> = {
  "Hair Services": "border-l-violet-500",
  Facial: "border-l-pink-400",
  Spa: "border-l-teal-500",
  Makeup: "border-l-rose-500",
  "Nail Care": "border-l-orange-400",
  default: "border-l-purple-400",
};

// Generic searchable select for service / staff
function SearchSelect({
  placeholder, value, onChange, options, getLabel, getId,
}: {
  placeholder: string;
  value: string;
  onChange: (id: string) => void;
  options: any[];
  getLabel: (item: any) => string;
  getId: (item: any) => string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => getId(o) === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter(o => getLabel(o).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button type="button"
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        className="w-full p-2.5 rounded-xl border border-border bg-background text-sm text-left flex items-center justify-between focus:ring-2 focus:ring-primary/40 outline-none"
      >
        <span className={selected ? "text-foreground font-medium" : "text-muted-foreground"}>
          {selected ? getLabel(selected) : placeholder}
        </span>
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                className="w-full pl-8 pr-3 py-2 text-sm bg-muted/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground text-center">No results</p>
            ) : (
              filtered.map(o => (
                <button key={getId(o)} type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors font-medium ${getId(o) === value ? "text-primary bg-primary/5" : ""}`}
                  onClick={() => { onChange(getId(o)); setOpen(false); setSearch(""); }}>
                  {getLabel(o)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Customer searchable select with add-new inline
function CustomerSelect({
  value, onChange, customers, onCustomerCreated,
}: {
  value: string;
  onChange: (id: string, name?: string) => void;
  customers: any[];
  onCustomerCreated: (c: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value === "walk-in" ? null : customers.find(c => (c.id || c._id) === value);
  const displayLabel = value === "walk-in" || !value ? "Walk-in" : selected ? `${selected.name}${selected.phone ? ` · ${selected.phone}` : ""}` : "Walk-in";

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowAdd(false); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
      });
      const created = await res.json();
      onCustomerCreated(created);
      onChange(created.id || created._id, created.name);
      setOpen(false);
      setShowAdd(false);
      setNewName(""); setNewPhone(""); setSearch("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button"
        onClick={() => { setOpen(o => !o); setSearch(""); setShowAdd(false); }}
        className="w-full p-2.5 rounded-xl border border-border bg-background text-sm text-left flex items-center justify-between focus:ring-2 focus:ring-primary/40 outline-none"
      >
        <span className={!value || value === "walk-in" ? "text-muted-foreground" : "text-foreground font-medium"}>
          {displayLabel}
        </span>
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search by name or phone..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-muted/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          {!showAdd ? (
            <>
              <div className="max-h-44 overflow-y-auto">
                <button type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors font-medium ${!value || value === "walk-in" ? "text-primary bg-primary/5" : ""}`}
                  onClick={() => { onChange("", "Walk-in"); setOpen(false); setSearch(""); }}>
                  Walk-in
                </button>
                {filtered.map(c => (
                  <button key={c.id || c._id} type="button"
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors ${(c.id || c._id) === value ? "text-primary bg-primary/5 font-medium" : ""}`}
                    onClick={() => { onChange(c.id || c._id, c.name); setOpen(false); setSearch(""); }}>
                    <p className="font-medium">{c.name}</p>
                    {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                  </button>
                ))}
                {filtered.length === 0 && search && (
                  <p className="px-4 py-2 text-xs text-muted-foreground">No customer found</p>
                )}
              </div>
              <div className="border-t border-border/40">
                <button type="button"
                  className="w-full text-left px-4 py-2.5 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center gap-2"
                  onClick={() => { setShowAdd(true); setNewName(search); }}>
                  <UserPlus className="w-4 h-4" /> Add new customer
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">New Customer</p>
              <input
                autoFocus
                placeholder="Full name *"
                className="w-full p-2.5 rounded-lg border text-sm bg-muted/30 outline-none focus:ring-2 focus:ring-primary/20"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <input
                placeholder="Phone number *"
                className="w-full p-2.5 rounded-lg border text-sm bg-muted/30 outline-none focus:ring-2 focus:ring-primary/20"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCreate())}
              />
              <div className="flex gap-2 pt-1">
                <button type="button"
                  className="flex-1 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => { setShowAdd(false); setNewName(""); setNewPhone(""); }}>
                  Back
                </button>
                <button type="button"
                  disabled={saving || !newName.trim() || !newPhone.trim()}
                  className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  onClick={handleCreate}>
                  {saving ? "Saving..." : "Save & Select"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingModal({ onClose, onSuccess, customers: initialCustomers, staff, services }: any) {
  const createAppointment = useCreateAppointment();
  const [customers, setCustomers] = useState(initialCustomers);
  const [form, setForm] = useState({
    customerId: "",
    staffId: "",
    serviceId: "",
    appointmentDate: format(new Date(), "yyyy-MM-dd"),
    appointmentTime: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    createAppointment.mutate(
      {
        data: {
          customerId: form.customerId || undefined,
          staffId: form.staffId,
          serviceId: form.serviceId,
          appointmentDate: form.appointmentDate,
          appointmentTime: form.appointmentTime,
          notes: form.notes,
        } as any,
      },
      {
        onSuccess: () => { setIsLoading(false); onSuccess(); onClose(); },
        onError: () => { setIsLoading(false); },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-primary">Book Appointment</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Customer</label>
            <CustomerSelect
              value={form.customerId}
              onChange={(id) => set("customerId", id)}
              customers={customers}
              onCustomerCreated={(c) => setCustomers((prev: any[]) => [c, ...prev])}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Service *</label>
            <SearchSelect
              placeholder="Select service"
              value={form.serviceId}
              onChange={(id) => set("serviceId", id)}
              options={services}
              getLabel={(s) => s.name}
              getId={(s) => s.id || s._id}
            />
            {/* hidden required sentinel */}
            <input type="text" required value={form.serviceId} onChange={() => {}}
              className="sr-only" tabIndex={-1} aria-hidden />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Staff *</label>
            <SearchSelect
              placeholder="Select staff member"
              value={form.staffId}
              onChange={(id) => set("staffId", id)}
              options={staff}
              getLabel={(s) => s.name}
              getId={(s) => s.id || s._id}
            />
            <input type="text" required value={form.staffId} onChange={() => {}}
              className="sr-only" tabIndex={-1} aria-hidden />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date *</label>
              <input type="date" required value={form.appointmentDate}
                onChange={e => set("appointmentDate", e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Time *</label>
              <input type="time" required value={form.appointmentTime}
                onChange={e => set("appointmentTime", e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={2} placeholder="Any special instructions..."
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading || !form.serviceId || !form.staffId}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {isLoading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Appointments() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: apiData, isLoading, refetch } = useListAppointments({ date: dateStr });
  const { data: customersData } = useListCustomers();
  const { data: staffData } = useListStaff();
  const { data: servicesData } = useListServices();
  const updateAppointment = useUpdateAppointment();

  const appointments = apiData?.appointments || [];
  const customers = customersData?.customers || [];
  const staff = (staffData as any)?.staff || [];
  const services = servicesData?.services || [];

  const handleStatusChange = (id: string, status: string) => {
    updateAppointment.mutate(
      { appointmentId: id, data: { status } as any },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          refetch();
        },
      }
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Appointments</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage client appointments.</p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="bg-secondary text-white px-6 py-3 rounded-xl font-semibold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Book Appointment
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setSelectedDate(d => subDays(d, 1))}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-lg">{format(selectedDate, "EEEE, dd MMMM yyyy")}</p>
          <button onClick={() => setSelectedDate(new Date())} className="text-xs text-primary hover:underline">
            Today
          </button>
        </div>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">No appointments for this day</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Book Appointment" to schedule one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt: any) => (
            <div
              key={appt.id || appt._id}
              className={`bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-4 border-l-4 ${categoryColors[appt.serviceCategory] || categoryColors.default}`}
            >
              <div className="w-20 text-center shrink-0">
                <p className="font-bold text-lg text-primary">{appt.appointmentTime}</p>
                <p className="text-xs text-muted-foreground">{appt.duration} min</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold truncate">{appt.customerName || "Walk-in"}</p>
                  <span className="text-xs text-muted-foreground">{appt.customerPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {appt.serviceName}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {appt.staffName}
                  </span>
                </div>
                {appt.notes && <p className="text-xs text-muted-foreground mt-1 italic">{appt.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[appt.status] || statusColors.scheduled}`}>
                  {appt.status}
                </span>
                <select
                  value={appt.status}
                  onChange={e => handleStatusChange(appt.id || appt._id, e.target.value)}
                  className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {["scheduled", "confirmed", "in-progress", "completed", "cancelled"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBookingModal && (
        <BookingModal
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            toast({ title: "Appointment booked!", description: "Successfully scheduled." });
            refetch();
          }}
          customers={customers}
          staff={staff}
          services={services}
        />
      )}
    </div>
  );
}
