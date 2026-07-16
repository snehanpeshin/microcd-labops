import Link from "next/link";
import { AuthErrorNotice } from "@/components/auth/auth-error-notice";
import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/brand";

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

  return (
    <div>
      <Brand />
      <h1 className="mt-8 text-2xl font-semibold text-slate-950">Sign in to LabOps</h1>
      <p className="mt-2 text-sm text-slate-600">Access your organization-scoped development records.</p>
      {hasConfirmationError && <AuthErrorNotice initialCode={params.error_code} initialDescription={params.error_description} />}
      {!hasConfirmationError && <AuthErrorNotice />}
      <div className="mt-6"><AuthForm mode="login" next={next} /></div>
      <div className="mt-5 flex justify-between text-sm">
        <Link className="text-teal-800 hover:underline" href="/forgot-password">Forgot password?</Link>
        <Link className="text-teal-800 hover:underline" href={`/signup?next=${encodeURIComponent(next)}`}>Create account</Link>
      </div>
    </div>
  );
}
