import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/brand";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata(
  "Reset Password",
  "Request a secure password-reset link for a MicroCD LabOps account.",
  "/forgot-password",
);

export default function ForgotPage() { return <div><Brand /><h1 className="mt-8 text-2xl font-semibold text-slate-950">Reset your password</h1><p className="mt-2 text-sm text-slate-600">We will send a secure reset link to the account email.</p><div className="mt-6"><AuthForm mode="forgot" /></div><p className="mt-5 text-sm"><Link className="text-teal-800 hover:underline" href="/login">Return to sign in</Link></p></div>; }
