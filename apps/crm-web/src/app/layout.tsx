import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Revora AI CRM — Hospitality Review & Escalation Workspace',
  description:
    'PS 224 Hospitality Review Reply Drafting Assistant (Sandbox / Simulation)',
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
