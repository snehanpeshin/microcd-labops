"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { describeEngineeringSnapshot } from "@/lib/engineering-handoff";

type Option = { id: string; label: string };
type ExperimentOption = Option & { projectId: string };
type Snapshot = ReturnType<typeof describeEngineeringSnapshot>;

export function EngineeringHandoffForm({ projects, experiments }: { projects: Option[]; experiments: ExperimentOption[] }) {
  const [projectId, setProjectId] = useState("");
  const [experimentId, setExperimentId] = useState("");
  const [candidate, setCandidate] = useState<{ file: File; details: Snapshot }>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedExperiment, setSavedExperiment] = useState("");
  const matches = experiments.filter((experiment) => experiment.projectId === projectId);

  async function preview(file?: File) {
    setCandidate(undefined);
    setMessage("");
    setSavedExperiment("");
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error("File is larger than 25 MB.");
      let details;
      try {
        details = describeEngineeringSnapshot(await file.text());
      } catch {
        throw new Error("Choose a supported Modeler or Analyzer JSON export.");
      }
      setCandidate({ file, details });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview failed.");
    } finally {
      setBusy(false);
    }
  }

  async function attach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!candidate || !experimentId || busy || savedExperiment) return;
    setBusy(true);
    setMessage("");
    const body = new FormData();
    body.set("recordType", "experiment");
    body.set("recordId", experimentId);
    body.set("file", candidate.file);
    try {
      const response = await fetch("/api/files", { method: "POST", body });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "The attachment could not be saved.");
      }
      setSavedExperiment(experimentId);
      setMessage("Snapshot attached.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The attachment could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={attach}>
      <div className="form-field">
        <label htmlFor="handoff-project">Project</label>
        <select id="handoff-project" value={projectId} required disabled={busy} onChange={(event) => {
          setProjectId(event.target.value);
          setExperimentId("");
          setSavedExperiment("");
          setMessage("");
        }}>
          <option value="">Choose a project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.label}</option>)}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="handoff-experiment">Experiment</label>
        <select id="handoff-experiment" value={experimentId} required disabled={busy || !projectId} onChange={(event) => {
          setExperimentId(event.target.value);
          setSavedExperiment("");
          setMessage("");
        }}>
          <option value="">Choose an experiment</option>
          {matches.map((experiment) => <option key={experiment.id} value={experiment.id}>{experiment.label}</option>)}
        </select>
      </div>
      {projectId && !matches.length && <p className="form-field-wide text-sm"><Link className="underline" href="/app/experiments">Create an experiment</Link> for this project first.</p>}
      <div className="form-field form-field-wide">
        <label htmlFor="handoff-file">Modeler or Analyzer snapshot</label>
        <input id="handoff-file" type="file" accept=".json,application/json" disabled={busy} required onChange={(event) => void preview(event.target.files?.[0])} />
      </div>
      {candidate && (
        <div className="form-field-wide rounded-md border border-slate-200 p-4">
          <strong>{candidate.details.source} · {candidate.details.title}</strong>
          <p className="mt-1 break-all text-sm">{candidate.file.name} · {candidate.details.contents}</p>
          <p className="mt-1 break-all text-sm">{candidate.details.capturedAt} · {candidate.details.reference}</p>
          {candidate.details.demonstration && <p className="mt-2 text-sm font-semibold">Demo data</p>}
        </div>
      )}
      <div className="form-field-wide flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || !candidate || !experimentId || Boolean(savedExperiment)}>Attach snapshot</Button>
        {message && <span role="status" className="text-sm">{message}</span>}
        {savedExperiment && <Link className="underline" href={`/app/experiments/${savedExperiment}`}>Open experiment</Link>}
      </div>
    </form>
  );
}
