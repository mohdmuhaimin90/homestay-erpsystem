"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("damai_erp_auth") === "true";
      setIsAuthenticated(auth);

      if (!auth && pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  // Login page gets full standalone viewport without sidebar/header
  if (pathname === "/login") {
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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#080B11]">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}