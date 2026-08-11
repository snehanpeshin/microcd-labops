import { describe, expect, it } from "vitest";
import { experimentImportRowSchema, inventoryImportRowSchema, metricProgress } from "./growth-capabilities";

describe("CSV import validation",()=>{
  it("accepts a safe inventory row and coerces numeric fields",()=>{const row=inventoryImportRowSchema.parse({code:"INV-1",name:"Buffer",item_type:"reagent",quantity:"2.5",minimum_stock:"1",unit:"L"});expect(row.quantity).toBe(2.5);expect(row.minimum_stock).toBe(1);});
  it("rejects negative opening inventory",()=>{expect(()=>inventoryImportRowSchema.parse({code:"INV-1",name:"Buffer",item_type:"reagent",quantity:"-1",unit:"L"})).toThrow();});
  it("requires a meaningful experiment objective",()=>{expect(()=>experimentImportRowSchema.parse({title:"Study",objective:"Too short",experiment_type:"Validation",priority:"high"})).toThrow();});
});

describe("pilot metric progress",()=>{
  it("calculates progress for a decreasing outcome",()=>{expect(metricProgress({baseline:20,target:5,currentValue:10,direction:"decrease"})).toBe(67);});
  it("caps progress after the target is exceeded",()=>{expect(metricProgress({baseline:2,target:10,currentValue:14,direction:"increase"})).toBe(100);});
  it("returns zero until a current value exists",()=>{expect(metricProgress({baseline:20,target:5,currentValue:null,direction:"decrease"})).toBe(0);});
});
