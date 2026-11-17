"use client";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
export type OperationsActionState={error?:string};
export function OperationsForm({action,children,className}:{action:(state:OperationsActionState,data:FormData)=>Promise<OperationsActionState>;children:ReactNode;className?:string}) {
 const [state,formAction]=useActionState(action,{});
 return <form action={formAction} className={className}>{state.error?<p role="alert" className="col-span-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.error}</p>:null}{children}</form>;
}
export function OperationsSubmit({intent,children,secondary=false}:{intent:string;children:ReactNode;secondary?:boolean}) {
 const {pending}=useFormStatus();
 return <Button type="submit" name="intent" value={intent} disabled={pending} variant={secondary?"secondary":"primary"}>{pending?"Saving…":children}</Button>;
}
