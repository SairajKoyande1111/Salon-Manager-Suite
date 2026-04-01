import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, Users, Receipt, Scissors, Users2, Package, Calculator, Crown, BarChart3, ScissorsSquare } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/appointments", label: "Appointments", icon: Calendar },
    { href: "/pos", label: "Point of Sale", icon: Receipt },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/services", label: "Services", icon: Scissors },
    { href: "/staff", label: "Staff", icon: Users2 },
    { href: "/products", label: "Inventory", icon: Package },
    { href: "/expenses", label: "Expenses", icon: Calculator },
    { href: "/memberships", label: "Memberships", icon: Crown },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-border bg-card shadow-sm z-10 shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
              <ScissorsSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-serif font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-800">
              Salon Admin
            </h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "opacity-100" : "opacity-70"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
