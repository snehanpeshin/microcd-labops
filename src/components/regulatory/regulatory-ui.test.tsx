// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RegulatoryDisclaimer } from "./regulatory-disclaimer";

describe("Regulatory Navigator critical UI",()=>{
  it("keeps the decision-support disclaimer visible and explicit",()=>{render(<RegulatoryDisclaimer/>);expect(screen.getByRole("note",{name:"Regulatory decision-support disclaimer"}).textContent).toContain("do not constitute regulatory, legal, quality, or compliance advice");expect(screen.getByText(/Decision support only/)).not.toBeNull();});
});
