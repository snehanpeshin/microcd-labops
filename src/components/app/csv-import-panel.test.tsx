// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,describe,expect,it,vi} from "vitest";
import {CsvImportPanel} from "./csv-import-panel";

afterEach(cleanup);
function setup(){const result=render(<CsvImportPanel title="Import inventory" description="Test import" requiredHeaders={["code","name"]} templateHref="/template.csv" action={vi.fn()}/>);return result.container.querySelector('input[type="file"]')!;}
function file(name:string,text:()=>Promise<string>){const value=new File(["data"],name,{type:"text/csv"});Object.defineProperty(value,"text",{value:text});return value;}
describe("CSV import preview",()=>{
 it("previews quoted cells accurately without committing records",async()=>{
  const input=setup();fireEvent.change(input,{target:{files:[file("inventory.csv",async()=> 'code,name\nR1,"Buffer, A"')]}});
  await waitFor(()=>expect(screen.getByText("Buffer, A")).toBeTruthy());
  expect(screen.getByRole("status").textContent).toContain("1 rows checked");
  expect(screen.getByRole("button",{name:"Import validated rows"}).hasAttribute("disabled")).toBe(false);
 });
 it("does not let an older file read enable import after a newer invalid selection",async()=>{
  const input=setup();let resolve!:(text:string)=>void;const pending=new Promise<string>(done=>{resolve=done;});
  fireEvent.change(input,{target:{files:[file("old.csv",()=>pending)]}});
  fireEvent.change(input,{target:{files:[file("new.txt",async()=>"invalid")]}});
  resolve("code,name\nR1,Old buffer");
  await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("Choose a .csv"));
  expect(screen.queryByText("Old buffer")).toBeNull();
  expect(screen.getByRole("button",{name:"Import validated rows"}).hasAttribute("disabled")).toBe(true);
 });
 it("reports read failures and keeps import disabled",async()=>{
  const input=setup();fireEvent.change(input,{target:{files:[file("bad.csv",async()=>{throw new Error("Could not read file");})]}});
  await waitFor(()=>expect(screen.getByRole("alert").textContent).toBe("Could not read file"));
  expect(screen.getByRole("button",{name:"Import validated rows"}).hasAttribute("disabled")).toBe(true);
 });
});
