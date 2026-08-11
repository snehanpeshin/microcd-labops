"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

export function SubmitButton({ idle, pending = "Saving…", variant = "primary" }: { idle:string; pending?:string; variant?:"primary"|"secondary"|"ghost"|"danger" }) {
  const status = useFormStatus();
  return <Button type="submit" variant={variant} disabled={status.pending} aria-disabled={status.pending}>{status.pending ? pending : idle}</Button>;
}
