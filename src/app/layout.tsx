import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://labops.microcdlabs.com"),
  applicationName: "MicroCD LabOps",
  title: { default: "MicroCD LabOps | Engineering Documentation & Traceability", template: "%s | MicroCD LabOps" },
  description: "Lightweight engineering report, supplier qualification, component traceability, and incoming inspection software for scientific hardware teams.",
  openGraph: {
    title: "MicroCD LabOps | Engineering Documentation & Traceability",
    description: "Engineering documentation, supplier qualification, and component traceability without enterprise complexity.",
    type: "website",
    siteName: "MicroCD LabOps",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "MicroCD LabOps | Engineering Documentation & Traceability",
    description: "Engineering documentation, supplier qualification, and component traceability for scientific hardware teams.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
