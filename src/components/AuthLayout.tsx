import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_60%)] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/20 font-mono text-lg font-bold text-white">
            DC
          </div>
          <p className="text-2xl font-bold text-white">DevCollab</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur">
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}