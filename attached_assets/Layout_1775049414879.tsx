import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useLocation } from "wouter";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isPosPage = location === "/pos";

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Hide sidebar on POS page for maximum screen real estate, or keep it collapsible. We'll keep it for now but might make it minimal */}
      {!isPosPage && <Sidebar />}
      <main className="flex-1 h-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
