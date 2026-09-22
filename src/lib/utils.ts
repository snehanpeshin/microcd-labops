import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

const activityVerbs: Array<[string, string]> = [
  ["changes_requested", "Requested changes to"],
  ["created", "Created"],
  ["approved", "Approved"],
  ["submitted", "Submitted"],
  ["revised", "Revised"],
  ["updated", "Updated"],
  ["completed", "Completed"],
  ["evaluated", "Evaluated"],
  ["generated", "Generated"],
  ["received", "Received"],
  ["removed", "Removed"],
  ["linked", "Linked"],
  ["added", "Added to"],
  ["moved", "Moved"],
  ["applied", "Applied"],
  ["flagged", "Flagged"],
];

/** Convert stored audit event keys into language suitable for people and review evidence. */
export function activityActionLabel(action: string) {
  const normalized = action.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replaceAll(/^_|_$/g, "");
  const match = activityVerbs.find(([suffix]) => normalized === suffix || normalized.endsWith(`_${suffix}`));
  if (match) return match[1];
  const words = normalized.replaceAll("_", " ");
  return words ? words[0].toUpperCase() + words.slice(1) : "Updated";
}

export function activitySentence(action: string, recordType: string) {
  return `${activityActionLabel(action).toLowerCase()} ${recordType.trim().toLowerCase()}`;
}
