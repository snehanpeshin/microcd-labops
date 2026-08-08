"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { waitForFirebaseAuth } from "@/lib/firebase/client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={loading}
      aria-label="Sign out"
      title="Sign out"
      onClick={async () => {
        setLoading(true);
        try {
          await signOut(await waitForFirebaseAuth());
          router.replace("/login");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      <LogOut size={17} aria-hidden="true" />
      <span className="sr-only">Sign out</span>
    </Button>
  );
}
