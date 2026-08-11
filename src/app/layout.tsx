import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://labops.microcdlabs.com"),
  applicationName: "MicroCD LabOps",
  title: { default: "MicroCD LabOps | Laboratory Operations for Scientific Teams", template: "%s | MicroCD LabOps" },
  description: "Connect experiments, samples, protocols, inventory, equipment, tasks, and engineering evidence in one practical laboratory operations workspace.",
  openGraph: {
    title: "MicroCD LabOps | Laboratory Operations for Scientific Teams",
    description: "Connected experiments, samples, protocols, resources, tasks, and engineering evidence without enterprise complexity.",
    type: "website",
    siteName: "MicroCD LabOps",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MicroCD LabOps connected evidence workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MicroCD LabOps | Laboratory Operations for Scientific Teams",
    description: "Connected laboratory operations and engineering evidence for scientific hardware teams.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
