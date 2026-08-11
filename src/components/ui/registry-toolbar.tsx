import { Search } from "lucide-react";
import { Button, ButtonLink } from "./button";

export function RegistryToolbar({ q="", status="", statuses=[] }: { q?:string; status?:string; statuses?:{value:string;label:string}[] }) {
  return <form method="get" className="registry-toolbar"><label className="registry-search"><Search size={16} aria-hidden="true"/><span className="sr-only">Search records</span><input name="q" defaultValue={q} placeholder="Search by ID, name, owner, or keyword"/></label>{statuses.length?<label><span className="sr-only">Filter by status</span><select name="status" defaultValue={status}><option value="">All statuses</option>{statuses.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>:null}<Button variant="secondary">Apply</Button>{q||status?<ButtonLink href="?" variant="ghost">Clear</ButtonLink>:null}</form>;
}
