import Link from "next/link";
import {CheckCircle2,FileCheck2,ShieldCheck,Sparkles} from "lucide-react";
import { AuthErrorNotice } from "@/components/auth/auth-error-notice";
import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/brand";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata(
  "Sign In",
  "Sign in to an organization-scoped MicroCD LabOps engineering workspace.",
  "/login",
);

type LoginSearchParams = {
  next?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const params = await searchParams;
  const requested = params.next;
  const next = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/app";
  const hasConfirmationError = params.error === "confirmation_failed" || Boolean(params.error_code);

  return <section className="auth-stage">
    <div className="auth-stage-orb auth-stage-orb-one"/><div className="auth-stage-orb auth-stage-orb-two"/>
    <div className="auth-layout">
      <div className="auth-story">
        <span className="eyebrow-pill">Private engineering workspace</span>
        <h1>Return to the work.<br/><span className="text-gradient">Keep the evidence connected.</span></h1>
        <p>One secure workspace for experiment execution, device genealogy, controlled quality documents, and human-reviewed AI assistance.</p>
        <div className="auth-proof-grid">
          <div><FileCheck2/><span><strong>Controlled records</strong><small>Immutable revision history and review gates</small></span></div>
          <div><Sparkles/><span><strong>Private AI drafting</strong><small>DLP screening and visible human acceptance</small></span></div>
          <div><ShieldCheck/><span><strong>Organization scoped</strong><small>Role-based access to laboratory evidence</small></span></div>
        </div>
        <div className="auth-confidence"><CheckCircle2 size={17}/><span>No patient data. No silent approvals. No training on your workspace content.</span></div>
      </div>
      <div className="auth-card-wrap">
        <div className="auth-card">
          <Brand/>
          <p className="auth-kicker">Welcome back</p>
          <h2>Sign in to LabOps</h2>
          <p className="auth-card-copy">Use your work account to continue to your organization’s engineering workspace.</p>
          {hasConfirmationError?<AuthErrorNotice initialCode={params.error_code} initialDescription={params.error_description}/>:<AuthErrorNotice/>}
          <div className="mt-6"><AuthForm mode="login" next={next}/></div>
          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
            <Link className="font-semibold text-teal-800 hover:underline" href="/forgot-password">Forgot password?</Link>
            <Link className="font-semibold text-teal-800 hover:underline" href={`/signup?next=${encodeURIComponent(next)}`}>Create account</Link>
          </div>
          <p className="auth-security-note"><ShieldCheck size={15}/>Encrypted in transit · role-based access · audit-ready activity</p>
        </div>
        <p className="auth-help">Need help accessing a workspace? <Link href="/request-demo">Contact MicroCD Labs</Link></p>
      </div>
    </div>
  </section>;
}
