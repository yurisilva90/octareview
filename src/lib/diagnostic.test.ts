import { describe, expect, it } from "vitest";
import { buildDiagnostic, findTargetPlace } from "./diagnostic";
import { demoInput, demoMarketRecords, demoTargetRecords } from "./demo";

describe("diagnostic engine", () => {
  it("identifies the target despite casing", () => {
    const match = findTargetPlace("STUDIO aurora", demoTargetRecords, demoMarketRecords);
    expect(match?.place.title).toBe("Studio Aurora");
    expect(match?.similarity).toBe(1);
  });

  it("builds an evidence-backed report", () => {
    const report = buildDiagnostic({ input: demoInput, targetRecords: demoTargetRecords, marketRecords: demoMarketRecords, mode: "demo", generatedAt: "2026-09-14T12:00:00.000Z" });
    expect(report.business.title).toBe("Studio Aurora");
    expect(report.pillars).toHaveLength(5);
    expect(report.summary.searchRank).toBe(5);
    expect(report.summary.responseSampleSize).toBe(12);
    expect(report.opportunities).toHaveLength(3);
    expect(report.themes.some((theme) => theme.id === "service")).toBe(true);
  });

  it("rejects a missing target instead of guessing", () => {
    expect(() => buildDiagnostic({ input: { ...demoInput, businessName: "Empresa que não existe" }, targetRecords: demoTargetRecords, marketRecords: demoMarketRecords, mode: "demo" })).toThrow(/Não foi possível identificar/);
  });
});

