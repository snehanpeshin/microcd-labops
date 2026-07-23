import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/brand";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata(
  "Create Account",
  "Create a private MicroCD LabOps account for an organization-scoped engineering workspace.",
  "/signup",
);

export default async function SignupPage({searchParams}:{searchParams:Promise<{next?:string}>}) { const requested=(await searchParams).next; const next=requested?.startsWith("/")?requested:"/app"; return <div><Brand /><h1 className="mt-8 text-2xl font-semibold text-slate-950">Create your LabOps account</h1><p className="mt-2 text-sm text-slate-600">Start with a private workspace. External services require administrator configuration.</p><div className="mt-6"><AuthForm mode="signup" next={next}/></div><p className="mt-5 text-sm text-slate-600">Already registered? <Link className="text-teal-800 hover:underline" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></p></div>; }
