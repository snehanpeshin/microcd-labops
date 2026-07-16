import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";

export function MarketingHeader() {
  return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-5"><Brand /><nav aria-label="Marketing navigation" className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex"><Link href="/features/reports">Reports</Link><Link href="/features/traceability">Traceability</Link><Link href="/pricing">Pricing</Link><Link href="/security">Security</Link><Link href="/request-demo">Request demo</Link></nav><div className="flex items-center gap-2"><ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">Log in</ButtonLink><ButtonLink href="/signup">Start free trial</ButtonLink></div></div></header>;
}

export function MarketingFooter() {
  return <footer className="border-t border-slate-200 bg-slate-950 text-slate-300"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr_1fr]"><div><Brand /><p className="mt-5 max-w-md text-sm leading-6 text-slate-400">A lightweight engineering documentation and traceability platform designed to support organized product-development workflows.</p><p className="mt-4 text-xs text-slate-500">MicroCD LabOps is offered by MicroCD Labs and operated by Karigari Home LLC.</p></div><div><strong className="text-sm text-white">Product</strong><div className="mt-4 grid gap-3 text-sm"><Link href="/features/reports">Engineering Reports</Link><Link href="/features/traceability">Supplier Traceability</Link><Link href="/pricing">Pricing</Link><Link href="/security">Security</Link></div></div><div><strong className="text-sm text-white">Legal &amp; help</strong><div className="mt-4 grid gap-3 text-sm"><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/acceptable-use">Acceptable use</Link><Link href="/legal/ai-use">AI use disclosure</Link><Link href="/request-demo">Contact</Link></div></div></div><div className="border-t border-slate-800 px-5 py-5 text-center text-xs text-slate-500">© 2026 Karigari Home LLC. Software does not replace legal, regulatory, engineering, statistical, medical, or quality-system advice.</div></footer>;
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return <><MarketingHeader /><main>{children}</main><MarketingFooter /></>;
}
