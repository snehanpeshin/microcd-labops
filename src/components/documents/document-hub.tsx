"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, FileDown, FileLock2, FilePlus2, Heart, Save, Search, ShieldCheck, Upload, X } from "lucide-react";
import { decryptLocalDocument, encryptLocalDocument, type EncryptedPayload } from "@/lib/documents/crypto";
import { deleteEncryptedRecord, listEncryptedRecords, saveEncryptedRecord } from "@/lib/documents/local-store";
import { documentTemplates, searchTemplates, type DocumentTemplate } from "@/lib/documents/templates";

type Draft = {
  id: string;
  title: string;
  domain: string;
  status: "Draft";
  version: string;
  documentId?: string;
  owner?: string;
  templateId?: string;
  references?: Array<{ label: string; url: string }>;
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
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [activeDraftId, setActiveDraftId] = useState("");
  const [editorError, setEditorError] = useState("");
  const [editorSaved, setEditorSaved] = useState(true);
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
        documentId: `DRAFT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`,
        owner: "",
        templateId: selected.id,
        references: selected.references,
        sections: selected.sections.map((title) => ({ title, content: "[Complete this section]" })),
        updatedAt: new Date().toISOString(),
      };
      await saveEncryptedRecord(draft.id, await encryptLocalDocument(draft, passphrase));
      setMessage("Encrypted draft saved only on this device.");
      setDialogError("");
      setSelected(null);
      setActiveDraft(draft);
      setActiveDraftId(draft.id);
      setEditorSaved(true);
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
    if (passphrase.length < 12) {
      setMessage("Enter the draft passphrase above before unlocking.");
      return;
    }
    try {
      const draft = await decryptLocalDocument<Draft>(row.payload, passphrase);
      setActiveDraft(draft);
      setActiveDraftId(row.id);
      setEditorError("");
      setEditorSaved(true);
      setMessage(`Unlocked: ${draft.title}. Content remains on this device.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not unlock draft");
    }
  }

  function updateDraft(changes: Partial<Draft>) {
    setActiveDraft((current) => current ? { ...current, ...changes } : current);
    setEditorSaved(false);
  }

  function updateSection(index: number, content: string) {
    setActiveDraft((current) => current ? {
      ...current,
      sections: current.sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, content } : section),
    } : current);
    setEditorSaved(false);
  }

  async function saveActiveDraft() {
    if (!activeDraft || !activeDraftId) return;
    if (passphrase.length < 12) {
      setEditorError("Enter the encryption passphrase used for this draft.");
      return;
    }
    try {
      const updated = { ...activeDraft, updatedAt: new Date().toISOString() };
      await saveEncryptedRecord(activeDraftId, await encryptLocalDocument(updated, passphrase));
      setActiveDraft(updated);
      setEditorSaved(true);
      setEditorError("");
      setMessage("Encrypted changes saved only on this device.");
      await refresh();
    } catch (cause) {
      setEditorError(cause instanceof Error ? cause.message : "Could not save encrypted changes.");
    }
  }

  function exportWorkingCopy() {
    if (!activeDraft) return;
    const markdown = [
      `# ${activeDraft.title}`,
      "",
      `- Document ID: ${activeDraft.documentId || "Not assigned"}`,
      `- Version: ${activeDraft.version}`,
      `- Owner: ${activeDraft.owner || "Not assigned"}`,
      `- Status: ${activeDraft.status}`,
      "",
      ...activeDraft.sections.flatMap((section) => [`## ${section.title}`, "", section.content, ""]),
      "## References",
      "",
      ...(activeDraft.references?.map((reference) => `- [${reference.label}](${reference.url})`) ?? ["- Add applicable controlled references."]),
      "",
      "> Uncontrolled working copy exported from MicroCD LabOps. Verify current requirements and complete formal review before use.",
    ].join("\n");
    const blob = new Blob([markdown], { type: "text/markdown" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${(activeDraft.documentId || activeDraft.title).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.md`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function closeEditor() {
    if (!editorSaved && !confirm("Close without saving the latest edits?")) return;
    setActiveDraft(null);
    setActiveDraftId("");
    setEditorError("");
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
            {selected.references.length > 0 && <div className="template-references"><h3>Authoritative starting references</h3><ul>{selected.references.map((reference) => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a></li>)}</ul></div>}
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

      {activeDraft && (
        <div className="document-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="document-editor-title">
          <div className="document-editor-shell">
            <header className="document-editor-header">
              <div><p className="eyebrow">Encrypted local working draft</p><h2 id="document-editor-title">{activeDraft.title}</h2><p>{editorSaved ? "All changes saved locally" : "Unsaved local changes"}</p></div>
              <button className="editor-icon-button" onClick={closeEditor} aria-label="Close document editor"><X /></button>
            </header>
            <div className="document-editor-metadata">
              <label><span>Document title</span><input value={activeDraft.title} onChange={(event) => updateDraft({ title: event.target.value })} /></label>
              <label><span>Document ID</span><input value={activeDraft.documentId ?? ""} onChange={(event) => updateDraft({ documentId: event.target.value })} /></label>
              <label><span>Version</span><input value={activeDraft.version} onChange={(event) => updateDraft({ version: event.target.value })} /></label>
              <label><span>Owner</span><input value={activeDraft.owner ?? ""} onChange={(event) => updateDraft({ owner: event.target.value })} placeholder="Document owner" /></label>
              <div><span>Status</span><strong>Draft</strong></div>
            </div>
            <div className="document-editor-sections">
              {activeDraft.sections.map((section, index) => (
                <section key={`${section.title}-${index}`}>
                  <label htmlFor={`draft-section-${index}`}>{index + 1}. {section.title}</label>
                  <textarea id={`draft-section-${index}`} value={section.content} onChange={(event) => updateSection(index, event.target.value)} rows={7} placeholder={`Complete ${section.title.toLowerCase()}...`} />
                </section>
              ))}
              {activeDraft.references && activeDraft.references.length > 0 && <section className="editor-reference-section"><h3>Authoritative starting references</h3><ul>{activeDraft.references.map((reference) => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a></li>)}</ul><p>Confirm the current version and product-specific applicability before formal use.</p></section>}
              <p className="template-disclaimer">This is an uncontrolled starter and drafting aid. It is not an FDA form, regulatory approval, legal advice, or a substitute for your organization&apos;s controlled procedures and current requirements.</p>
              {editorError && <p className="dialog-error" role="alert">{editorError}</p>}
            </div>
            <footer className="document-editor-footer">
              <button className="editor-secondary-button" onClick={exportWorkingCopy}><FileDown />Export working copy</button>
              <button className="editor-secondary-button" onClick={closeEditor}>Close</button>
              <button className="editor-save-button" onClick={saveActiveDraft}><Save />Save encrypted draft</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
