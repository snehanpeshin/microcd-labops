import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "MicroCD LabOps | Engineering Documentation & Traceability", template: "%s | MicroCD LabOps" },
  description: "Lightweight engineering report, supplier qualification, component traceability, and incoming inspection software for scientific hardware teams.",
  openGraph: { title: "MicroCD LabOps", description: "Engineering documentation without enterprise complexity.", type: "website" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
