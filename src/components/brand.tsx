import Link from "next/link";
import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand-lockup" aria-label="MicroCD LabOps home">
    <Image src="/microcd-labs-wordmark.svg" alt="microcd labs" className="brand-wordmark" width={360} height={80} priority />
    {compact ? null : <span className="brand-product">LabOps</span>}
  </Link>;
}
