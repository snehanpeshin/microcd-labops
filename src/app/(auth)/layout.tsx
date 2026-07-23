import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata(
  "Account Access",
  "Secure account access for the MicroCD LabOps engineering workspace.",
);

export default function Layout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
