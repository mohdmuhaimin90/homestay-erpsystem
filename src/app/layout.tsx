import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "StayVault · Homestay ERP & Reservation Suite",
  description: "Luxury Property Management & Reservation System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" className="dark">
      <body className="antialiased bg-[#080B11] text-slate-100 min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 bg-[#080B11]">
            <Header />
            <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}