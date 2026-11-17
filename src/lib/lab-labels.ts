/** Keep database enum labels consistent with the domain types and demo records. */
export function labLabel(value: string) {
  const words = value.replaceAll("_", " ").toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : "";
}
