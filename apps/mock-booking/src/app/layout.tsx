import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "Aurum Grand Bengaluru, Bangalore (updated prices 2026) — Booking.com Sandbox",
  description:
    "Mock Booking.com Guest Reviews & Hotel Listing Sandbox for Revora AI (Aurum Grand Hospitality).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-[#1a1a1a] antialiased selection:bg-[#006ce4] selection:text-white">
        {children}
      </body>
    </html>
  );
}

