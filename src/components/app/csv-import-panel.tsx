"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

import { parseWorkspaceCsv } from "@/lib/csv-import";

type ProjectOption={id:string;label:string};
export function CsvImportPanel({title,description,requiredHeaders,templateHref,action,projects}:{title:string;description:string;requiredHeaders:string[];templateHref:string;action:(formData:FormData)=>Promise<void>;projects?:ProjectOption[]}){
  const [preview,setPreview]=useState<string[][]>([]);const [fileName,setFileName]=useState("");const [error,setError]=useState("");
  const inspection=useRef(0);const [inspecting,setInspecting]=useState(false);const [rowCount,setRowCount]=useState(0);
  async function inspect(file?:File){
    const request=++inspection.current;setPreview([]);setError("");setRowCount(0);setFileName(file?.name??"");setInspecting(Boolean(file));
    if(!file)return;
    try {
      if(!file.name.toLowerCase().endsWith(".csv"))throw new Error("Choose a .csv file.");
      if(file.size>1_000_000)throw new Error("CSV files must be 1 MB or smaller.");
      const parsed=parseWorkspaceCsv(await file.text(),requiredHeaders);
      if(request!==inspection.current)return;
      setPreview([parsed.headers,...parsed.rows.slice(0,4).map(row=>parsed.headers.map(header=>row[header]))]);setRowCount(parsed.rows.length);
    } catch(cause){if(request===inspection.current)setError(cause instanceof Error?cause.message:"CSV could not be read. Choose the file again.");}
    finally{if(request===inspection.current)setInspecting(false);}
  }
  return <section className="ui-card min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-800"><FileSpreadsheet size={20}/></span><div><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div></div></div><form action={action} className="space-y-5 p-5">{projects?<div className="form-field"><label htmlFor={`${title}-project`}>Destination project</label><select id={`${title}-project`} name="projectId" required><option value="">Choose a project</option>{projects.map(project=><option key={project.id} value={project.id}>{project.label}</option>)}</select></div>:null}<label className="csv-dropzone"><UploadCloud size={24}/><strong>{fileName||"Choose a CSV file"}</strong><span>Up to 250 rows · 1 MB maximum</span><input name="file" type="file" accept=".csv,text/csv" required onChange={event=>inspect(event.target.files?.[0])}/></label>{error?<p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>:null}{inspecting?<p role="status">Checking CSV structure…</p>:null}{preview.length?<p role="status">{rowCount} rows checked. Showing the first {Math.min(rowCount,4)}. Field values and permissions are validated again on import.</p>:null}{preview.length?<div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-slate-50 text-slate-600"><tr>{preview[0].map((cell,index)=><th key={`${cell}-${index}`} className="px-3 py-2 font-semibold">{cell}</th>)}</tr></thead><tbody>{preview.slice(1).map((row,rowIndex)=><tr key={rowIndex} className="border-t border-slate-100">{preview[0].map((_,cellIndex)=><td key={cellIndex} className="max-w-48 truncate px-3 py-2 text-slate-600">{row[cellIndex]??""}</td>)}</tr>)}</tbody></table></div>:null}<div className="flex flex-wrap items-center gap-3"><Button disabled={inspecting||!preview.length||Boolean(error)}>Import validated rows</Button><a href={templateHref} download className="text-sm font-semibold text-teal-800 hover:underline">Download CSV template</a></div></form></section>;
}
