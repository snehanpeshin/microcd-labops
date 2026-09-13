export default function WorkspaceLoading() {
  return <div className="space-y-5" role="status" aria-live="polite" aria-busy="true"><p className="sr-only">Loading workspace…</p><div aria-hidden="true" className="space-y-5"><div className="h-8 w-64 max-w-full animate-pulse rounded bg-slate-200"/><div className="grid gap-4 md:grid-cols-3">{[1,2,3].map((item)=><div key={item} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white"/>)}</div><div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-white"/></div></div>;
}
