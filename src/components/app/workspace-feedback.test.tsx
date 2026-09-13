// @vitest-environment jsdom
import { render,screen } from "@testing-library/react";
import { describe,expect,it,vi } from "vitest";
import WorkspaceError from "@/app/(workspace)/app/error";
import WorkspaceLoading from "@/app/(workspace)/app/loading";

describe("workspace feedback states",()=>{
  it("announces loading without exposing decorative skeletons",()=>{const {container}=render(<WorkspaceLoading/>);expect(screen.getByRole("status").textContent).toContain("Loading workspace");expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();});
  it("offers recovery and a support reference after an error",()=>{render(<WorkspaceError error={Object.assign(new Error("hidden"),{digest:"ERR-123"})} reset={vi.fn()}/>);expect(screen.getByRole("alert").textContent).toContain("Your existing records have not been changed");expect(screen.getByText("ERR-123")).not.toBeNull();expect(screen.getByRole("link",{name:"Return to dashboard"}).getAttribute("href")).toBe("/app");});
});
