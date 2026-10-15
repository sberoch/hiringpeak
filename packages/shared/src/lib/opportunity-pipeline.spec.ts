import { summarizePipeline } from "./opportunity-pipeline";

const stages = [
  { id: 10, name: "Ganada", sort: 4, isWon: true, isLost: false },
  { id: 11, name: "Perdida", sort: 5, isWon: false, isLost: true },
  { id: 2, name: "Reunión", sort: 1, isWon: false, isLost: false },
  { id: 1, name: "Primer contacto", sort: 0, isWon: false, isLost: false },
];

describe("summarizePipeline", () => {
  it("orders groups by open stage sort, then won, then lost", () => {
    const { groups } = summarizePipeline(stages, []);
    expect(groups.map((g) => g.stage.name)).toEqual([
      "Primer contacto",
      "Reunión",
      "Ganada",
      "Perdida",
    ]);
  });

  it("collapses only the won and lost groups", () => {
    const { groups } = summarizePipeline(stages, []);
    expect(groups.filter((g) => g.collapsed).map((g) => g.stage.name)).toEqual([
      "Ganada",
      "Perdida",
    ]);
  });

  it("counts every Opportunity in a group but sums only those with a fee", () => {
    const { groups } = summarizePipeline(stages, [
      { stageId: 1, estimatedFee: 1000 },
      { stageId: 1, estimatedFee: null },
      { stageId: 1, estimatedFee: 2500 },
    ]);
    const first = groups[0]!;
    expect({ count: first.count, feeTotal: first.feeTotal }).toEqual({
      count: 3,
      feeTotal: 3500,
    });
  });

  it("totals only open Opportunities in the footer, ignoring missing fees", () => {
    const { open } = summarizePipeline(stages, [
      { stageId: 1, estimatedFee: 1000 },
      { stageId: 2, estimatedFee: null },
      { stageId: 10, estimatedFee: 9000 },
      { stageId: 11, estimatedFee: 7000 },
    ]);
    expect(open).toEqual({ count: 2, feeTotal: 1000 });
  });
});
