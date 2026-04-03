import { useState } from "react";
import {
  Lock, Unlock, Settings as SettingsIcon, Shield, Key,
  Eye, EyeOff, CheckCircle2, X, ChevronRight, LayoutDashboard,
  MonitorCheck, CalendarDays, Users, FileText, Sparkles, Package,
  Briefcase, Tag, BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";

const ADMIN_USER = "admin";
const ADMIN_PASS = "123456";

const LOCKABLE_MODULES = [
  { path: "/pos",          label: "POS / New Bill",  icon: MonitorCheck },
  { path: "/appointments", label: "Appointments",    icon: CalendarDays },
  { path: "/customers",    label: "Customers",       icon: Users },
  { path: "/invoices",     label: "Invoices",        icon: FileText },
  { path: "/services",     label: "Services",        icon: Sparkles },
  { path: "/products",     label: "Products",        icon: Package },
  { path: "/staff",        label: "Staff",           icon: Briefcase },
  { path: "/memberships",  label: "Memberships",     icon: Tag },
  { path: "/reports",      label: "Reports",         icon: BarChart3 },
  { path: "/",             label: "Dashboard",       icon: LayoutDashboard },
];

export default function Settings() {
  const { lockConfig, saveLockConfig, saveCredentials, getCredentials } = useAuth();
  const { toast } = useToast();

  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminPassVisible, setAdminPassVisible] = useState(false);
  const [adminError, setAdminError] = useState("");

  const [pin, setPin] = useState(lockConfig.pin);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedModules, setLockedModules] = useState<string[]>(lockConfig.modules);

  const [newEmail, setNewEmail] = useState(getCredentials().email);
  const [newPassword, setNewPassword] = useState(getCredentials().password);
  const [passVisible, setPassVisible] = useState(false);
  const [credSaved, setCredSaved] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.trim() === ADMIN_USER && adminPass === ADMIN_PASS) {
      setAdminLoggedIn(true);
      setAdminError("");
    } else {
      setAdminError("Invalid admin credentials.");
    }
  };

  const toggleModule = (path: string) => {
    if (!pin && !lockedModules.includes(path)) {
      setPinError("Set a 6-digit PIN first before locking any module.");
      return;
    }
    setLockedModules(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
    setPinError("");
  };

  const handleSaveLocks = () => {
    if (lockedModules.length > 0 && (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin))) {
      setPinError("PIN must be exactly 6 digits.");
      return;
    }
    saveLockConfig({ pin, modules: lockedModules });
    toast({ title: "Lock settings saved", description: "Module locks updated successfully." });
    setPinError("");
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) { toast({ title: "Invalid email", variant: "destructive" }); return; }
    if (newPassword.length < 6) { toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" }); return; }
    saveCredentials(newEmail, newPassword);
    setCredSaved(true);
    setTimeout(() => setCredSaved(false), 2000);
    toast({ title: "Login credentials updated", description: "New credentials will apply on next login." });
  };

  if (!adminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Settings Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Admin credentials required</p>
          </div>

          <div className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
            {adminError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                {adminError}
              </div>
            )}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Username</label>
                <input required autoFocus placeholder="Enter admin username"
                  value={adminUser} onChange={e => { setAdminUser(e.target.value); setAdminError(""); }}
                  className="w-full p-3 rounded-xl border border-border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input required type={adminPassVisible ? "text" : "password"} placeholder="Enter admin password"
                    value={adminPass} onChange={e => { setAdminPass(e.target.value); setAdminError(""); }}
                    className="w-full pr-10 p-3 rounded-xl border border-border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  <button type="button" onClick={() => setAdminPassVisible(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {adminPassVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Access Settings
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-in fade-in duration-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage security and access control</p>
        </div>
        <button onClick={() => setAdminLoggedIn(false)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
          <X className="w-3.5 h-3.5" /> Exit Settings
        </button>
      </div>

      {/* ── Section 1: Module Locks ── */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base text-foreground">Module Lock</h2>
          <span className="text-xs text-muted-foreground ml-auto">{lockedModules.length} locked</span>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Lock PIN <span className="text-muted-foreground font-normal">(6 digits, required to unlock any module)</span></label>
            <div className="relative w-48">
              <input
                type={pinVisible ? "text" : "password"}
                inputMode="numeric"
                maxLength={6}
                placeholder="Set 6-digit PIN"
                value={pin}
                onChange={e => { setPinError(""); setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); }}
                className={`w-full pr-10 p-3 rounded-xl border bg-muted/30 focus:ring-2 outline-none text-sm font-mono tracking-widest ${pinError ? "border-red-400 focus:ring-red-200" : "border-border focus:ring-primary/20"}`}
              />
              <button type="button" onClick={() => setPinVisible(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {pinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pinError && <p className="text-red-500 text-xs mt-1">{pinError}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground mb-3">Modules</p>
            {LOCKABLE_MODULES.map(mod => {
              const isLocked = lockedModules.includes(mod.path);
              const Icon = mod.icon;
              return (
                <div key={mod.path}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLocked ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 ${isLocked ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{mod.label}</span>
                  {isLocked && <Lock className="w-3.5 h-3.5 text-primary mr-2" />}
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.path)}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${isLocked ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${isLocked ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>

          <button onClick={handleSaveLocks}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            Save Lock Settings
          </button>
        </div>
      </div>

      {/* ── Section 2: Change Login Credentials ── */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
        <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
          <Key className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base text-foreground">Change Login Credentials</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveCredentials} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Login Email</label>
              <input required type="email" placeholder="Enter new email"
                value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Login Password</label>
              <div className="relative">
                <input required type={passVisible ? "text" : "password"} placeholder="Enter new password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full pr-10 p-3 rounded-xl border border-border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                <button type="button" onClick={() => setPassVisible(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {passVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
            </div>
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-white text-sm font-bold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20">
              {credSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "Update Credentials"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
