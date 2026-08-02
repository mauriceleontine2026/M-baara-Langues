import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
// Use public logo at /logo.png

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-sidebar border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="M'baara" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-heading font-bold text-foreground">M'BAARA</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-foreground p-2">
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 z-50 text-muted-foreground hover:text-foreground">
              <X size={22} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}