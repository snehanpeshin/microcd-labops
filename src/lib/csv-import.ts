import Papa from "papaparse";

/** The same structural validation is used for previews and server imports. */
export function parseWorkspaceCsv(text: string, requiredHeaders: string[] = []) {
  const parsed = Papa.parse<string[]>(text, {skipEmptyLines:"greedy"});
  if (parsed.errors.length) throw new Error(`CSV could not be read near row ${(parsed.errors[0].row ?? 0) + 1}.`);
  const [header = [], ...data] = parsed.data;
  const headers = header.map(value => value.trim().toLowerCase().replaceAll(" ", "_"));
  if (!headers.length || headers.some(value => !value)) throw new Error("CSV column names must not be blank.");
  if (new Set(headers).size !== headers.length) throw new Error("CSV column names must be unique after normalization.");
  const missing = requiredHeaders.filter(value => !headers.includes(value));
  if (missing.length) throw new Error(`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
  if (!data.length || data.length > 250) throw new Error("CSV imports must contain between 1 and 250 rows.");
  const rows = data.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has ${values.length} values; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((key, column) => [key, values[column]]));
  });
  return {headers, rows};
}
