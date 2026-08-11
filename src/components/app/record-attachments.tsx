"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { File, Upload } from "lucide-react";
import type { LabAttachment } from "@/lib/lab-types";
import { Button } from "@/components/ui/button";

const size=(bytes:number)=>bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/1024/1024).toFixed(1)} MB`;
export function RecordAttachments({recordType,recordId,files,readOnly=false}:{recordType:"experiment"|"sample"|"equipment"|"protocol";recordId:string;files:LabAttachment[];readOnly?:boolean}){
 const router=useRouter(), input=useRef<HTMLInputElement>(null); const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function upload(){const file=input.current?.files?.[0];if(!file)return;setBusy(true);setMessage("");const body=new FormData();body.set("recordType",recordType);body.set("recordId",recordId);body.set("file",file);try{const response=await fetch("/api/files",{method:"POST",body});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Upload failed");setMessage("File uploaded securely.");if(input.current)input.current.value="";router.refresh();}catch(error){setMessage(error instanceof Error?error.message:"Upload failed");}finally{setBusy(false)}}
 return <div className="space-y-3">{!readOnly?<div className="flex flex-wrap items-center gap-2"><input ref={input} type="file" aria-label="Choose attachment"/><Button type="button" onClick={upload} disabled={busy}><Upload size={16}/>{busy?"Uploading…":"Upload"}</Button></div>:null}{message?<p role="status" className="text-sm text-slate-600">{message}</p>:null}{files.map(file=><a key={file.id} href={`/api/files/${file.id}`} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:border-teal-300"><File size={17} className="text-teal-700"/><span className="min-w-0 flex-1 truncate font-medium">{file.fileName}</span><span className="text-xs text-slate-500">{size(file.sizeBytes)}</span></a>)}{!files.length?<p className="text-sm text-slate-500">No attachments.</p>:null}</div>;
}
