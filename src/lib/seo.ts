import type { Metadata } from "next";

const siteName = "MicroCD LabOps";

export function marketingMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName,
      title: `${title} | ${siteName}`,
      description,
      url: path,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "MicroCD LabOps connected evidence workflow" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: ["/og.png"],
    },
  };
}

export function privatePageMetadata(title: string, description: string, path?: string): Metadata {
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}
