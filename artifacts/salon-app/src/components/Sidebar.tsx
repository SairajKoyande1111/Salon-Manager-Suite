import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MonitorCheck, 
  CalendarDays, 
  Users, 
  Sparkles, 
  Package, 
  Briefcase, 
  Tag, 
  BarChart3, 
  FileText,
  LogOut,
  Scissors,
  Settings,
  Lock
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/contexts/auth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",     href: "/" },
  { icon: MonitorCheck,    label: "POS / New Bill", href: "/pos" },
  { icon: CalendarDays,    label: "Appointments",   href: "/appointments" },
  { icon: Users,           label: "Customers",      href: "/customers" },
  { icon: FileText,        label: "Invoices",       href: "/invoices" },
  { icon: Sparkles,        label: "Services",       href: "/services" },
  { icon: Package,         label: "Products",       href: "/products" },
  { icon: Briefcase,       label: "Staff",          href: "/staff" },
  { icon: Tag,             label: "Memberships",    href: "/memberships" },
  { icon: BarChart3,       label: "Reports",        href: "/reports" },
  { icon: Settings,        label: "Settings",       href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { lockConfig } = useAuth();

  const handleLogout = () => {
    sessionStorage.removeItem("atsalon_session");
    window.location.reload();
  };

  return (
    <div className="w-64 h-screen bg-sidebar flex flex-col shadow-2xl z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg rose-gold-gradient flex items-center justify-center shadow-lg">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sidebar-foreground text-base font-bold font-serif tracking-widest leading-tight">
            AT SALON
          </h1>
          <p className="text-sidebar-foreground/60 text-[10px] font-medium tracking-[0.15em] uppercase">Management</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const isLocked = lockConfig.modules.includes(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-black/10" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={clsx("w-5 h-5", isActive ? "text-secondary" : "")} />
              <span className="flex-1">{item.label}</span>
              {isLocked && <Lock className="w-3 h-3 text-sidebar-foreground/40" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border/50">
        <div className="mb-3 px-4 py-3 rounded-xl bg-sidebar-accent/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full rose-gold-gradient flex items-center justify-center text-white font-bold text-xs">
            AT
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-sidebar-foreground font-semibold">The Touch</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">thetouch@gmail.com</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
