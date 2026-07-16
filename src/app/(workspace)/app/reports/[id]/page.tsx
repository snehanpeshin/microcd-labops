import { notFound } from "next/navigation";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { getReport, listProjects } from "@/lib/data/workspace";
import { can } from "@/lib/security/permissions";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createReportRevision, reviewReport, submitReportForReview } from "../../actions";

const inputClass = "min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const identity = await requireWorkspaceIdentity();
  const { id } = await params;
  const [report, projects] = await Promise.all([getReport(identity, id), listProjects(identity)]);
  if (!report) notFound();
  const project = projects.find((item) => item.id === report.projectId);
  const mayWrite = !identity.demo && can(identity.role, "reports:write");
  const mayReview = !identity.demo && can(identity.role, "reports:review");

  return <>
    <PageHeader eyebrow={`${report.number} · Rev ${report.revision}`} title={report.title} description={`${project?.code ?? "—"} — ${project?.name ?? "Unassigned project"}`} actions={<><ButtonLink href={`/api/reports/${report.id}/pdf`} external>Export PDF</ButtonLink><ButtonLink href="/app/reports" variant="secondary">Back</ButtonLink></>} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {report.sections.map((section) => <Card key={section.id}><CardHeader title={section.title} action={section.source === "ai-assisted" ? <Badge tone="info">AI-assisted draft</Badge> : undefined} /><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{section.content}</p></CardContent></Card>)}
        <Card><CardHeader title="Acceptance criteria" description="Outcomes are deterministic; overrides require a recorded reason." /><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Measurement</th><th className="px-4 py-3">Criterion</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Outcome</th></tr></thead><tbody>{report.criteria.map((criterion) => <tr key={criterion.id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{criterion.measurement}</td><td className="px-4 py-3">{criterion.operator} {criterion.minimum ?? criterion.maximum ?? criterion.target} {criterion.unit}</td><td className="px-4 py-3">{criterion.result ?? "—"} {criterion.unit}</td><td className="px-4 py-3"><Badge tone={criterion.outcome === "Pass" ? "good" : criterion.outcome === "Fail" ? "danger" : "neutral"}>{criterion.outcome}</Badge></td></tr>)}</tbody></table></CardContent></Card>
      </div>
      <aside className="space-y-5">
        <Card><CardHeader title="Document control" /><CardContent className="space-y-3 text-sm"><p><span className="text-slate-500">Status</span><br /><Badge tone={report.status === "Approved" ? "good" : "warning"}>{report.status}</Badge></p><p><span className="text-slate-500">Author</span><br />{report.author}</p><p><span className="text-slate-500">Reviewer</span><br />{report.reviewer}</p><p><span className="text-slate-500">Classification</span><br />{report.confidentiality}</p></CardContent></Card>
        {mayWrite && ["Draft", "In progress", "Changes requested"].includes(report.status) && <Card><CardHeader title="Submit for review" description="The assigned reviewer will record a controlled decision." /><CardContent><form action={submitReportForReview} className="space-y-3"><input type="hidden" name="reportId" value={report.id} /><label className="block text-xs font-semibold text-slate-700" htmlFor="submit-comment">Submission note</label><textarea id="submit-comment" name="comment" maxLength={4000} className={inputClass} rows={3} /><Button type="submit">Submit report</Button></form></CardContent></Card>}
        {mayReview && report.status === "Ready for review" && <Card><CardHeader title="Review decision" description="A comment of at least 10 characters is required. Authors cannot approve their own work." /><CardContent><form action={reviewReport} className="space-y-3"><input type="hidden" name="reportId" value={report.id} /><label className="block text-xs font-semibold text-slate-700" htmlFor="review-comment">Review comment</label><textarea id="review-comment" name="comment" minLength={10} maxLength={4000} required className={inputClass} rows={4} /><div className="flex flex-wrap gap-2"><Button type="submit" name="decision" value="approved">Approve revision</Button><Button type="submit" name="decision" value="changes_requested" variant="secondary">Request changes</Button></div></form></CardContent></Card>}
        {mayWrite && report.status === "Approved" && <Card><CardHeader title="Create next revision" description="The approved revision remains locked and traceable." /><CardContent><form action={createReportRevision} className="space-y-3"><input type="hidden" name="reportId" value={report.id} /><label className="block text-xs font-semibold text-slate-700" htmlFor="change-summary">Change summary</label><textarea id="change-summary" name="changeSummary" minLength={10} maxLength={4000} required className={inputClass} rows={4} /><Button type="submit">Create new revision</Button></form></CardContent></Card>}
        <Card><CardHeader title="Revision rule" /><CardContent><p className="text-xs leading-5 text-slate-500">Approved revisions are locked. Further edits require a new revision with a change summary and a fresh review.</p></CardContent></Card>
      </aside>
    </div>
  </>;
}
