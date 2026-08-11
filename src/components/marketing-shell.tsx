import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, Menu } from "lucide-react";
import { Brand } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";

export function MarketingHeader() {
  return <><div className="utility-bar"><span>Laboratory operations for scientific hardware teams</span><a href="https://www.microcdlabs.com" target="_blank" rel="noreferrer">MicroCD Labs <ExternalLink size={12} /></a></div><header className="marketing-header"><div className="marketing-header-inner"><Brand /><nav aria-label="Marketing navigation" className="marketing-nav"><Link href="/product-tour">Product tour</Link><Link href="/features/reports">Reports + AI</Link><Link href="/features/traceability">Traceability</Link><Link href="/pricing">Pricing</Link><Link href="/security">Security</Link></nav><div className="marketing-actions"><ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">Log in</ButtonLink><ButtonLink href="/request-demo">Discuss a pilot</ButtonLink><details className="mobile-menu"><summary aria-label="Open navigation"><Menu size={20} /></summary><nav aria-label="Mobile navigation"><Link href="/product-tour">Product tour</Link><Link href="/features/reports">Reports + AI</Link><Link href="/features/traceability">Traceability</Link><Link href="/pricing">Pricing</Link><Link href="/security">Security</Link><Link href="/request-demo">Discuss a pilot</Link><Link href="/login">Log in</Link></nav></details></div></div></header></>;
}

export function MarketingFooter() {
  return <footer className="marketing-footer"><div className="marketing-footer-grid"><div><Brand /><p className="mt-5 max-w-md text-sm leading-6 text-slate-400">A focused laboratory operations platform connecting experiments, samples, protocols, resources, tasks, and engineering evidence.</p><p className="mt-4 text-xs text-slate-500">MicroCD LabOps is offered by MicroCD Labs and operated by Karigari Home LLC.</p></div><div><strong>Product</strong><div><Link href="/product-tour">Product tour</Link><Link href="/features/reports">Engineering Reports</Link><Link href="/features/traceability">Supplier Traceability</Link><Link href="/pricing">Pricing</Link><Link href="/security">Security</Link></div></div><div><strong>Legal &amp; help</strong><div><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/acceptable-use">Acceptable use</Link><Link href="/legal/ai-use">AI use disclosure</Link><Link href="/request-demo">Pilot discussion</Link></div></div></div><div className="marketing-footer-legal">© 2026 Karigari Home LLC. Software does not replace legal, regulatory, engineering, statistical, medical, or quality-system advice.</div></footer>;
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#main-content">Skip to main content</a><MarketingHeader /><main id="main-content" tabIndex={-1}>{children}</main><MarketingFooter /></>;
}
