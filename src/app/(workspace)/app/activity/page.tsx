import { Activity } from "lucide-react";
import { requireWorkspaceIdentity } from "@/lib/auth";
import { listActivity } from "@/lib/data/workspace";
import { activityActionLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, Td } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default async function ActivityPage() {
  const identity = await requireWorkspaceIdentity();
  const activity = await listActivity(identity);
  return <>
    <PageHeader eyebrow="Immutable operational history" title="Activity log" description="Important record changes are written by server-side workflows. Normal workspace users cannot edit audit entries."/>
    {activity.length ? <Card><DataTable caption="Activity log" headers={["Timestamp", "Actor", "Action", "Record type", "Summary"]}>{activity.map((entry) => <tr key={entry.id}><Td>{new Date(entry.timestamp).toLocaleString()}</Td><Td>{entry.actor}</Td><Td><Badge>{activityActionLabel(entry.action)}</Badge></Td><Td>{entry.recordType}</Td><Td>{entry.summary}</Td></tr>)}</DataTable></Card> : <Card><EmptyState title="No audit activity yet" description="Controlled record changes will appear here automatically and cannot be edited by workspace users." icon={<Activity size={21} aria-hidden="true"/>}/></Card>}
  </>;
}
