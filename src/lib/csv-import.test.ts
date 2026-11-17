import {describe, expect, it} from "vitest";
import {parseWorkspaceCsv} from "./csv-import";

describe("workspace CSV structure", () => {
  it("preserves quoted commas, escaped quotes and multiline notes", () => {
    const result = parseWorkspaceCsv('code,name,notes\r\nR1,"Buffer, A","Line 1\nLine 2 with ""quotes"""', ["code","name"]);
    expect(result.rows).toEqual([{code:"R1",name:"Buffer, A",notes:'Line 1\nLine 2 with "quotes"'}]);
  });
  it("normalizes BOM and headers consistently", () => {
    expect(parseWorkspaceCsv('\uFEFFCode,Item Name\nR1,Buffer', ["code","item_name"]).headers).toEqual(["code","item_name"]);
  });
  it("rejects ambiguous headers and malformed rows anywhere in the file", () => {
    for (const csv of ['code,Code\nR1,R2', 'code,\nR1,R2', 'code,name\nR1,Buffer,extra', 'code,name\nR1']) expect(() => parseWorkspaceCsv(csv)).toThrow();
    expect(() => parseWorkspaceCsv('code,name\nR1,"unclosed')).toThrow(/could not be read/);
  });
  it("checks required columns and the complete import row limit", () => {
    expect(() => parseWorkspaceCsv('code,name\nR1,Buffer',["title"])).toThrow(/Missing required column/);
    expect(() => parseWorkspaceCsv('code,name')).toThrow(/between 1 and 250/);
    expect(() => parseWorkspaceCsv('code,name\n'+Array.from({length:251},(_,i)=>`R${i},Buffer`).join('\n'))).toThrow(/between 1 and 250/);
    expect(parseWorkspaceCsv('code,name\n'+Array.from({length:250},(_,i)=>`R${i},Buffer`).join('\n')).rows).toHaveLength(250);
  });
});
