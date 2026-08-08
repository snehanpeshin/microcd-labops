"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, FileLock2, FilePlus2, Heart, Search, ShieldCheck, Upload } from "lucide-react";
import { decryptLocalDocument, encryptLocalDocument, type EncryptedPayload } from "@/lib/documents/crypto";
import { deleteEncryptedRecord, listEncryptedRecords, saveEncryptedRecord } from "@/lib/documents/local-store";
import { documentTemplates, searchTemplates, type DocumentTemplate } from "@/lib/documents/templates";

type Draft = {
  id: string;
  title: string;
  domain: string;
  status: "Draft";
  version: string;
  sections: Array<{ title: string; content: string }>;
  updatedAt: string;
};

type StoredDraft = { id: string; updatedAt: string; payload: EncryptedPayload };

export function DocumentHub() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All");
  const [selected, setSelected] = useState<DocumentTemplate | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [drafts, setDrafts] = useState<StoredDraft[]>([]);
  const [message, setMessage] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const results = useMemo(() => searchTemplates(query, domain), [query, domain]);

  const refresh = () => listEncryptedRecords().then(setDrafts).catch(() => setDrafts([]));
  useEffect(() => { void refresh(); }, []);

  async function createDraft() {
    if (!selected) return;
    if (passphrase.length < 12) {
      setDialogError("Enter an encryption passphrase with at least 12 characters.");
      return;
    }
    try {
      const draft: Draft = {
        id: crypto.randomUUID(),
        title: selected.title,
        domain: selected.domain,
        status: "Draft",
        version: "0.1",
        sections: selected.sections.map((title) => ({ title, content: "[Complete this section]" })),
        updatedAt: new Date().toISOString(),
      };
      await saveEncryptedRecord(draft.id, await encryptLocalDocument(draft, passphrase));
      setMessage("Encrypted draft saved only on this device.");
      setDialogError("");
      setSelected(null);
      await refresh();
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : "Could not save draft");
    }
  }

  async function exportDraft(row: StoredDraft) {
    const blob = new Blob([
      JSON.stringify({ format: "microcd-labops-encrypted-export", payload: row.payload }, null, 2),
    ], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `labops-encrypted-${row.id}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  async function inspect(row: StoredDraft) {
    try {
      const draft = await decryptLocalDocument<Draft>(row.payload, passphrase);
      setMessage(`Unlocked: ${draft.title}. Content remains on this device.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not unlock draft");
    }
  }

  function openTemplate(template: DocumentTemplate) {
    setDialogError("");
    setSelected(template);
  }

  function closeTemplate() {
    setDialogError("");
    setSelected(null);
  }

  return (
    <div className="document-hub">
      <section className="document-hero">
        <div>
          <p className="eyebrow">Documentation intelligence hub</p>
          <h1>Create, find, and manage biotech documentation without starting from a blank page.</h1>
          <p>Structured starter formats for laboratory, product, quality, clinical, manufacturing, and regulatory teams.</p>
          <div className="privacy-line">
            <ShieldCheck size={18} />
            <span><strong>Local-only workspace:</strong> encrypted drafts remain on this device. External AI processing is disabled.</span>
          </div>
        </div>
        <div className="document-actions">
          <button onClick={() => document.getElementById("template-library")?.scrollIntoView()}><BookOpen />Find a template</button>
          <label><Upload />Upload and review<input type="file" accept=".pdf,.docx,.txt" onChange={(event) => setMessage(event.target.files?.[0] ? `${event.target.files[0].name} selected locally. Automated extraction is not enabled.` : "")} /></label>
          <button onClick={() => setMessage("AI drafting requires explicit organization approval. No document content was transmitted.")}><FilePlus2 />Create with AI <small>Disabled</small></button>
        </div>
      </section>

      <section className="local-key-panel">
        <div><strong>Local encryption passphrase</strong><p>Required to create or unlock drafts. LabOps does not receive or recover it.</p></div>
        <input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder="At least 12 characters" autoComplete="off" minLength={12} />
        {message && <p role="status">{message}</p>}
      </section>

      <section>
        <div className="section-heading-row"><div><p className="eyebrow">On this device</p><h2>Encrypted drafts</h2></div><span>{drafts.length} local records</span></div>
        <div className="local-draft-list">
          {drafts.length ? drafts.map((row) => (
            <article key={row.id}>
              <FileLock2 />
              <div><strong>Encrypted local document</strong><p>Updated {new Date(row.updatedAt).toLocaleString()} · title encrypted</p></div>
              <button onClick={() => inspect(row)}>Unlock</button>
              <button aria-label="Export encrypted backup" onClick={() => exportDraft(row)}><Download /></button>
              <button onClick={async () => { if (confirm("Delete this encrypted local draft? This cannot be undone.")) { await deleteEncryptedRecord(row.id); await refresh(); } }}>Delete</button>
            </article>
          )) : <p className="empty-document-state">No local drafts yet. Choose a template below to create one.</p>}
        </div>
      </section>

      <section id="template-library">
        <div className="section-heading-row"><div><p className="eyebrow">Template library</p><h2>Biotech documentation starters</h2><p>Starting points only. Quality, legal, and regulatory review may be required.</p></div></div>
        <div className="template-toolbar">
          <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search calibration, CAPA, 510(k)…" /></label>
          <select value={domain} onChange={(event) => setDomain(event.target.value)}><option>All</option>{[...new Set(documentTemplates.map((template) => template.domain))].map((value) => <option key={value}>{value}</option>)}</select>
        </div>
        <div className="template-grid">
          {results.map((template) => (
            <article key={template.id}>
              <div className="template-card-top"><span>{template.domain}</span><button aria-label={`Favorite ${template.title}`} onClick={() => setFavorites((current) => current.includes(template.id) ? current.filter((id) => id !== template.id) : [...current, template.id])}><Heart fill={favorites.includes(template.id) ? "currentColor" : "none"} /></button></div>
              <h3>{template.title}</h3><p>{template.description}</p>
              <div className="template-meta"><span>{template.type}</span><span>{template.minutes} min</span><span>{template.status}</span></div>
              <button className="use-template" onClick={() => openTemplate(template)}>Preview and use</button>
            </article>
          ))}
        </div>
      </section>

      {selected && (
        <div className="document-dialog" role="dialog" aria-modal="true" aria-labelledby="template-preview-title">
          <div>
            <button className="dialog-close" onClick={closeTemplate}>Close</button>
            <p className="eyebrow">{selected.domain}</p>
            <h2 id="template-preview-title">{selected.title}</h2>
            <p>{selected.description}</p>
            <h3>Required sections</h3>
            <ol>{selected.sections.map((section) => <li key={section}>{section}</li>)}</ol>
            <p className="template-disclaimer">Starter content is not regulator-approved and does not replace official requirements.</p>
            <label className="dialog-passphrase">
              <span>Encryption passphrase</span>
              <input type="password" value={passphrase} onChange={(event) => { setPassphrase(event.target.value); setDialogError(""); }} placeholder="At least 12 characters" autoComplete="off" minLength={12} aria-describedby="dialog-passphrase-help" />
              <small id="dialog-passphrase-help">Stored only for this browser session. LabOps cannot recover it.</small>
            </label>
            {dialogError && <p className="dialog-error" role="alert">{dialogError}</p>}
            <button className="use-template" onClick={createDraft}>Create encrypted local draft</button>
          </div>
        </div>
      )}
    </div>
  );
}
