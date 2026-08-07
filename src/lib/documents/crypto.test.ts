import { describe, expect, it } from "vitest";
import { decryptLocalDocument, encryptLocalDocument } from "@/lib/documents/crypto";

describe("local document encryption", () => {
  it("round trips content without retaining plaintext", async () => {
    const value = { title: "Calibration SOP", content: "sensitive laboratory detail" };
    const encrypted = await encryptLocalDocument(value, "correct horse battery staple");
    expect(JSON.stringify(encrypted)).not.toContain(value.content);
    await expect(decryptLocalDocument(encrypted, "correct horse battery staple")).resolves.toEqual(value);
  });

  it("uses unique nonces and rejects incorrect keys or tampering", async () => {
    const first = await encryptLocalDocument({ value: 1 }, "correct horse battery staple");
    const second = await encryptLocalDocument({ value: 1 }, "correct horse battery staple");
    expect(first.iv).not.toBe(second.iv);
    await expect(decryptLocalDocument(first, "incorrect password here")).rejects.toThrow();
    const tampered = { ...first, ciphertext: `${first.ciphertext.slice(0, -2)}AA` };
    await expect(decryptLocalDocument(tampered, "correct horse battery staple")).rejects.toThrow();
  });
});
