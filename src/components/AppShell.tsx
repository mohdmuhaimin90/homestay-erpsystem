"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("damai_erp_auth");
      if (auth === null || auth === "true") {
        localStorage.setItem("damai_erp_auth", "true");
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (pathname !== "/login") {
          router.push("/login");
        }
      }
    }
  }, [pathname, router]);

  // Auto close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Standalone pages (Login & Mod Parents Planner)
  if (pathname === "/login" || pathname.startsWith("/planner")) {
    return <>{children}</>;
  }

  // Initial loading state before localStorage check completes
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#080B11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Memuatkan StayVault ERP...</span>
        </div>
      </div>
    );
  }

  // If not authenticated and not yet redirected, prevent content flash
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080B11] flex items-center justify-center">
        <span className="text-xs text-slate-500">Mengesahkan sesi admin...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080B11] text-slate-100 overflow-x-hidden relative">
      {/* Desktop Sidebar (Permanent on md: and above) */}
      <div className="hidden md:flex md:w-64 md:shrink-0 md:min-h-screen md:sticky md:top-0 md:h-screen">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Slide-over drawer with backdrop overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0B0F19] border-r border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300">
            <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080B11]">
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-[1600px] w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}