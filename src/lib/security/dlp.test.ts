import {describe,expect,it} from "vitest";
import {scanAndSanitize} from "./dlp";

describe("AI data-loss prevention",()=>{
  it("blocks and removes secrets",()=>{const value=scanAndSanitize("token sk-proj-abcdefghijklmnopqrstuvwxyz123456");expect(value.blocked).toBe(true);expect(value.safeText).not.toContain("abcdefghijklmnopqrstuvwxyz");});
  it("redacts personal identifiers without echoing them",()=>{const value=scanAndSanitize("Contact jane@example.com or 919-555-1212; MRN: A12345");expect(value.blocked).toBe(false);expect(value.redacted).toBe(true);expect(value.safeText).toContain("[REDACTED EMAIL]");expect(value.findings.map((item)=>item.category)).toEqual(expect.arrayContaining(["email","phone","medical_identifier"]));});
  it("leaves ordinary engineering text unchanged",()=>{const value=scanAndSanitize("Verify flow rate at 2.0 mL/min against protocol acceptance criteria.");expect(value).toMatchObject({blocked:false,redacted:false,findings:[]});});
});
