const experimentTransitions: Record<string, readonly string[]> = {
  draft:["planned","cancelled"], planned:["ready","cancelled"], ready:["running","cancelled"], running:["paused","completed","failed"],
  paused:["running","cancelled"], completed:["under_review"], failed:["under_review"], under_review:["approved","running"], approved:[], cancelled:[],
};

export function canTransitionExperiment(current: string, next: string) {
  return experimentTransitions[current]?.includes(next) ?? false;
}

export function allowedExperimentTransitions(current: string) {
  return experimentTransitions[current] ?? [];
}

export function signedInventoryDelta(type: string, amount: number) {
  if (!Number.isFinite(amount) || amount === 0) throw new Error("Inventory amount must be a non-zero number.");
  return ["use","disposal","transfer"].includes(type) ? -Math.abs(amount) : amount;
}

export function isOverdue(dueDate: string | undefined, status: string, today = new Date()) {
  if (!dueDate || status === "Completed") return false;
  const endOfDay = new Date(`${dueDate}T23:59:59`);
  return endOfDay.getTime() < today.getTime();
}

export function isExpiringWithinDays(expirationDate: string | undefined, days = 30, today = new Date()) {
  if (!expirationDate) return false;
  const expiration = new Date(`${expirationDate}T23:59:59`);
  return expiration.getTime() <= today.getTime() + days * 86_400_000;
}
