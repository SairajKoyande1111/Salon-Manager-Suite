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
  Settings,
  Scissors
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: MonitorCheck, label: "POS / New Bill", href: "/pos" },
  { icon: CalendarDays, label: "Appointments", href: "/appointments" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: FileText, label: "Invoices", href: "/invoices" },
  { icon: Sparkles, label: "Services", href: "/services" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: Briefcase, label: "Staff", href: "/staff" },
  { icon: Tag, label: "Memberships", href: "/memberships" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
];

export function Sidebar() {
  const [location] = useLocation();

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
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border/50">
        <Link 
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-all duration-300 font-medium text-sm"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <div className="mt-4 px-4 py-3 rounded-xl bg-sidebar-accent/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full rose-gold-gradient flex items-center justify-center text-white font-bold text-xs">
            AD
          </div>
          <div>
            <p className="text-xs text-sidebar-foreground font-semibold">Admin User</p>
            <p className="text-[10px] text-sidebar-foreground/50">admin@atsalon.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
