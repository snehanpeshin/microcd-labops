"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

export function SubmitButton({ idle, pending = "Saving…", variant = "primary", className, disabled = false }: { idle:string; pending?:string; variant?:"primary"|"secondary"|"ghost"|"danger"; className?:string; disabled?:boolean }) {
  const status = useFormStatus();
  return <Button type="submit" variant={variant} className={className} disabled={disabled||status.pending} aria-disabled={disabled||status.pending}>{status.pending ? pending : idle}</Button>;
}
