import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}