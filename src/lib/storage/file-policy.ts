import { createHash, randomUUID } from "node:crypto";

const allowedMimeTypes = {
  csv: ["text/csv", "application/csv", "text/plain"],
  txt: ["text/plain"],
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip"],
} as const;

export const maxUploadBytes = 25 * 1024 * 1024;
type AllowedExtension = keyof typeof allowedMimeTypes;
export interface ScanResult { safe: boolean; provider: string; reference?: string; reason?: string }
export interface FileScanner { scan(bytes: Uint8Array, name: string): Promise<ScanResult> }

export class BetaFileScanner implements FileScanner {
  async scan(bytes: Uint8Array, name: string) {
    void bytes;
    void name;
    return { safe: true, provider: "beta-policy-only", reason: "No malware scanner configured" };
  }
}

export function sanitizeFilename(name: string) {
  return name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-{2,}/g, "-").replace(/^[-.]+/, "").slice(0, 120) || "upload";
}

function extensionOf(name: string): AllowedExtension | null {
  const extension = name.toLowerCase().split(".").pop() ?? "";
  return extension in allowedMimeTypes ? extension as AllowedExtension : null;
}

function startsWith(bytes: Uint8Array, expected: readonly number[]) {
  return expected.every((value, index) => bytes[index] === value);
}

function signatureMatches(extension: AllowedExtension, bytes: Uint8Array) {
  if (extension === "pdf") return startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
  if (extension === "png") return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (extension === "jpg" || extension === "jpeg") return startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (extension === "xlsx" || extension === "docx") return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
  return !bytes.slice(0, 4096).some((value) => value === 0);
}

export function validateUpload(file: File, bytes: Uint8Array) {
  const extension = extensionOf(file.name);
  if (!extension) throw new Error("File type is not allowed");
  if (file.size < 1 || file.size > maxUploadBytes) throw new Error("File must be between 1 byte and 25 MB");
  const permitted = allowedMimeTypes[extension] as readonly string[];
  if (!permitted.includes(file.type)) throw new Error("File extension and MIME type do not match");
  if (!signatureMatches(extension, bytes)) throw new Error("File content does not match its extension");
  const safeName = sanitizeFilename(file.name);
  return {
    safeName,
    checksum: createHash("sha256").update(bytes).digest("hex"),
    storageName: `${randomUUID()}-${safeName}`,
  };
}
