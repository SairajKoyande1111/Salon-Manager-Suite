import { useState } from "react";
import { useListAppointments, useListCustomers, useListStaff, useListServices, useCreateAppointment, useUpdateAppointment } from "@workspace/api-client-react";
import { format, addDays, subDays } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, Sparkles, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

function BookingModal({ onClose, onSuccess, customers, staff, services }: any) {
  const createAppointment = useCreateAppointment();
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
        onSuccess: () => {
          setIsLoading(false);
          onSuccess();
          onClose();
        },
        onError: () => {
          setIsLoading(false);
        },
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Customer</label>
              <select
                value={form.customerId}
                onChange={e => set("customerId", e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none appearance-none"
              >
                <option value="">Walk-in</option>
                {customers.map((c: any) => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Service *</label>
              <select
                required
                value={form.serviceId}
                onChange={e => set("serviceId", e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none appearance-none"
              >
                <option value="">Select service</option>
                {services.map((s: any) => (
                  <option key={s.id || s._id} value={s.id || s._id}>{s.name} — ₹{Number(s.price).toLocaleString()}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Staff *</label>
            <select
              required
              value={form.staffId}
              onChange={e => set("staffId", e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none appearance-none"
            >
              <option value="">Select staff member</option>
              {staff.map((s: any) => (
                <option key={s.id || s._id} value={s.id || s._id}>{s.name} — {s.specialization}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date *</label>
              <input
                type="date"
                required
                value={form.appointmentDate}
                onChange={e => set("appointmentDate", e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Time *</label>
              <input
                type="time"
                required
                value={form.appointmentTime}
                onChange={e => set("appointmentTime", e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              rows={2}
              placeholder="Any special instructions..."
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/40 outline-none resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
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
                  <p className="font-semibold truncate">{appt.customerName}</p>
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
