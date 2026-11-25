import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mock Booking.com — Guest Reviews Sandbox (THE LEELA PALACE BANGALORE)',
  description: 'Sandbox Booking.com Guest Review UI for Revora AI Hackathon',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
