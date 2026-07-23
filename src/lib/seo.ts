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
    },
    twitter: {
      card: "summary",
      title: `${title} | ${siteName}`,
      description,
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
