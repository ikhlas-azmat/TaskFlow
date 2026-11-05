import { CheckCircle2, CircleCheckBig, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthLayout({ children, heading, subtitle }: { children: ReactNode; heading: string; subtitle: string }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.9fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <a href="/login" className="mb-12 inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-white"><CheckCircle2 size={21} /></span>
            TaskFlow
          </a>
          <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:items-end">
        <div className="absolute -right-36 -top-32 size-[32rem] rounded-full border border-white/10" />
        <div className="absolute -right-12 -top-8 size-[24rem] rounded-full border border-white/10" />
        <div className="absolute right-24 top-28 grid size-32 place-items-center rounded-3xl bg-white/5 text-emerald-300 shadow-2xl shadow-emerald-900/20"><Sparkles size={42} /></div>
        <div className="relative max-w-lg">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium text-emerald-300"><CircleCheckBig size={16} /> A calmer way to get things done</div>
          <p className="text-4xl font-semibold leading-tight tracking-tight">Make space for the work that matters.</p>
          <p className="mt-4 leading-7 text-slate-400">Keep your priorities clear, your plans organized, and your next step always in view.</p>
          <div className="mt-12 flex gap-2"><span className="h-1 w-8 rounded-full bg-emerald-400" /><span className="h-1 w-3 rounded-full bg-white/20" /><span className="h-1 w-3 rounded-full bg-white/20" /></div>
        </div>
      </aside>
    </main>
  )
}
