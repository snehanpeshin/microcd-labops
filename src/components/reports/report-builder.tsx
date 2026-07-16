"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { AlertCircle, Check, FileSpreadsheet, Sparkles } from "lucide-react";
import { createReportDraft } from "@/app/(workspace)/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { evaluateCriterion, parseNumericValue, summarize, type SummaryStatistics } from "@/lib/reports/calculations";
import type { Project } from "@/lib/types";

type Row = Record<string, string>;
const format = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);

export function ReportBuilder({ projects, demo }: { projects: Project[]; demo: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("Spin Profile Evaluation");
  const [reportType, setReportType] = useState("Engineering Test Report");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [objective, setObjective] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [measurement, setMeasurement] = useState("");
  const [maximum, setMaximum] = useState("18");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const values = useMemo(() => rows.map((row) => parseNumericValue(row[measurement])).filter((value): value is number => value !== null), [rows, measurement]);
  const stats: SummaryStatistics | null = useMemo(() => { try { return values.length ? summarize(values) : null; } catch { return null; } }, [values]);
  const criterionPass = stats ? evaluateCriterion(stats.mean, { operator: "<=", maximum: Number(maximum) }) : false;

  function parseFile(file?: File) {
    if (!file) return;
    setError(""); setSourceFile(file);
    Papa.parse<Row>(file, { header: true, skipEmptyLines: true, complete: ({ data, meta, errors }) => {
      if (errors.length || !meta.fields?.length) { setError("The CSV could not be read. Confirm it has a header row and comma-separated values."); return; }
      setRows(data); setColumns(meta.fields);
      setMeasurement(meta.fields.find((field) => data.some((row) => parseNumericValue(row[field]) !== null)) ?? "");
    }, error: () => setError("The selected file could not be read.") });
  }

  function saveDraft() {
    setError("");
    if (demo) { setError("The fictional demo is read-only. Configure Supabase to create persistent reports."); return; }
    if (!sourceFile || !projectId || !stats) { setError("Select a project and upload a valid CSV before saving."); return; }
    startTransition(async () => {
      try {
        const report = await createReportDraft({ title, reportType, projectId, objective, measurement, maximum: Number(maximum), values });
        const upload = new FormData(); upload.set("recordType", "report"); upload.set("recordId", report.id); upload.set("file", sourceFile);
        const uploadResponse = await fetch("/api/files", { method: "POST", body: upload }); const uploaded = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploaded.error ?? "Dataset upload failed");
        const analysisResponse = await fetch(`/api/reports/${report.id}/datasets`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attachmentId: uploaded.id, selectedColumn: measurement }) }); const analysis = await analysisResponse.json();
        if (!analysisResponse.ok) throw new Error(analysis.error ?? "Dataset analysis could not be saved");
        setSaved(true); router.push(`/app/reports/${report.id}`); router.refresh();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Report could not be saved"); }
    });
  }

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><Card><CardHeader title={`Step ${step} of 3`} description={["Define the controlled record", "Attach and analyze evidence", "Review the report summary"][step - 1]} /><CardContent>
    {step === 1 && <div className="form-grid"><div className="form-field form-field-wide"><label htmlFor="report-title">Report title</label><input id="report-title" value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="form-field"><label htmlFor="report-type">Report type</label><select id="report-type" value={reportType} onChange={(event) => setReportType(event.target.value)}><option>Engineering Test Report</option><option>Incoming Inspection Report</option><option>Design Review Record</option><option>Verification Summary</option><option>Supplier Evaluation</option></select></div><div className="form-field"><label htmlFor="project">Project</label><select id="project" value={projectId} onChange={(event) => setProjectId(event.target.value)} required><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.code} — {project.name}</option>)}</select></div><div className="form-field form-field-wide"><label htmlFor="objective">Objective</label><textarea id="objective" rows={7} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="State the question, device revision, and intended evidence without adding conclusions." /></div></div>}
    {step === 2 && <div className="space-y-5"><div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><FileSpreadsheet className="mx-auto text-teal-700" /><label htmlFor="csv-upload" className="mt-3 block text-sm font-semibold text-slate-900">Upload measurement CSV</label><p className="mt-1 text-xs text-slate-500">The original file will be stored privately; statistics are recalculated on the server.</p><input id="csv-upload" type="file" accept=".csv,text/csv" className="mt-4 max-w-full" onChange={(event) => parseFile(event.target.files?.[0])} /></div>{error && <p role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={18} />{error}</p>}{columns.length > 0 && <div className="form-grid"><div className="form-field"><label htmlFor="measurement">Numeric measurement</label><select id="measurement" value={measurement} onChange={(event) => setMeasurement(event.target.value)}>{columns.map((column) => <option key={column}>{column}</option>)}</select></div><div className="form-field"><label htmlFor="maximum">Maximum acceptance limit</label><input id="maximum" type="number" step="any" value={maximum} onChange={(event) => setMaximum(event.target.value)} /></div></div>}{stats && <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{Object.entries(stats).map(([label, value]) => <div key={label} className="rounded-md border border-slate-200 p-3"><p className="text-xs capitalize text-slate-500">{label.replace(/([A-Z])/g, " $1")}</p><strong className="mt-1 block text-lg text-slate-900">{format(value)}</strong></div>)}</div>}</div>}
    {step === 3 && <div className="space-y-5"><div className="rounded-md border border-slate-200 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft record</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2><p className="mt-2 text-sm text-slate-600">{reportType} · Revision A · Draft</p><p className="mt-4 text-sm leading-6 text-slate-700">{objective || "No objective entered."}</p></div><div className="rounded-md border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">Acceptance criterion</p><p className="mt-1 text-sm text-slate-600">Mean {measurement || "measurement"} ≤ {maximum}</p></div><span className={`rounded px-2 py-1 text-xs font-semibold ${criterionPass ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{stats ? criterionPass ? "Pass" : "Fail" : "Not evaluated"}</span></div>{stats && <p className="mt-3 text-sm text-slate-600">Observed mean: {format(stats.mean)} from {stats.count} valid values.</p>}</div><div className="rounded-md border border-blue-200 bg-blue-50 p-4"><div className="flex gap-3"><Sparkles size={18} className="mt-0.5 text-blue-700" /><div><p className="text-sm font-semibold text-blue-950">AI assistance remains opt-in</p><p className="mt-1 text-sm leading-6 text-blue-800">Generated text is labeled and requires explicit human acceptance before persistence.</p></div></div></div>{error && <p role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={18} />{error}</p>}{saved && <p role="status" className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><Check size={18} />Persistent draft saved.</p>}</div>}
    <div className="mt-7 flex justify-between gap-3"><Button type="button" variant="secondary" disabled={step === 1 || pending} onClick={() => setStep((current) => current - 1)}>Back</Button>{step < 3 ? <Button type="button" disabled={(step === 1 && (!title.trim() || !projectId)) || pending} onClick={() => setStep((current) => current + 1)}>Continue</Button> : <Button type="button" onClick={saveDraft} disabled={pending}>{pending ? "Saving evidence…" : "Save persistent draft"}</Button>}</div>
  </CardContent></Card><aside className="space-y-4"><Card><CardHeader title="Record controls" /><CardContent className="space-y-3 text-sm text-slate-600"><p><strong className="text-slate-900">Document no.</strong><br />Assigned on save</p><p><strong className="text-slate-900">Revision</strong><br />A</p><p><strong className="text-slate-900">Status</strong><br />Draft</p></CardContent></Card><Card><CardHeader title="Evidence rules" /><CardContent><ul className="space-y-2 text-sm leading-6 text-slate-600"><li>Original files remain linked to the report.</li><li>Server calculations identify their source column.</li><li>Criteria are evaluated deterministically.</li><li>Approval requires an authorized reviewer.</li></ul></CardContent></Card></aside></div>;
}
