import Link from 'next/link';

export default function CrmNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
          THE LEELA PALACE BANGALORE · REVORA AI CRM
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          The requested CRM route does not exist. Return to the main Executive Workspace
          or open the Guest Review Portal.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Open CRM Dashboard
          </Link>
          <Link
            href="/portal"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Guest Review Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
