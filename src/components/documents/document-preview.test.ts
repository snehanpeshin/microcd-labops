import {describe,expect,it} from "vitest";
import {parseDocumentBlocks} from "./document-preview";

describe("quality document preview",()=>{
  it("parses controlled-document structure without interpreting HTML",()=>{const blocks=parseDocumentBlocks("# Plan\n\n> Working draft\n\n## Scope\n\n- First\n- Second\n\n| Item | Status |\n| --- | --- |\n| Input | [TBD] |\n\n<script>alert(1)</script>");expect(blocks.map((item)=>item.kind)).toEqual(["heading","quote","heading","list","table","paragraph"]);expect(blocks.at(-1)).toMatchObject({kind:"paragraph",text:"<script>alert(1)</script>"});});
});
