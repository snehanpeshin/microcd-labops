// @vitest-environment jsdom
import { fireEvent,render,screen,waitFor } from "@testing-library/react";
import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { SampleScanner } from "./sample-scanner";

const push=vi.fn();
vi.mock("next/navigation",()=>({useRouter:()=>({push})}));

describe("SampleScanner",()=>{
  const stopTrack=vi.fn();
  const stream={getTracks:()=>[{stop:stopTrack}]} as unknown as MediaStream;

  beforeEach(()=>{
    push.mockReset();stopTrack.mockReset();
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:vi.fn().mockResolvedValue(stream)}});
    Object.defineProperty(window,"BarcodeDetector",{configurable:true,value:class {detect=vi.fn().mockResolvedValue([]);}});
    vi.spyOn(HTMLMediaElement.prototype,"play").mockResolvedValue();
    vi.stubGlobal("requestAnimationFrame",vi.fn(()=>1));
    vi.stubGlobal("cancelAnimationFrame",vi.fn());
  });

  afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

  it("attaches the requested camera stream to the persistent preview",async()=>{
    const {unmount}=render(<SampleScanner/>);const video=screen.getByLabelText("Barcode camera preview") as HTMLVideoElement;
    expect(video.classList.contains("hidden")).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Start scanner"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("Scanner active"));
    expect(video.srcObject).toBe(stream);expect(video.classList.contains("hidden")).toBe(false);
    unmount();expect(stopTrack).toHaveBeenCalled();
  });
});
