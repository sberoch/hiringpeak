import { hideWidget, moveWidget, showWidget } from "./widget-area-edits";

const area = [
  { key: "a", visible: true },
  { key: "b", visible: true },
  { key: "c", visible: false },
];

describe("Widget Area edits", () => {
  it("hiding a Widget keeps its place in the Area", () => {
    expect(hideWidget(area, "a")).toEqual([
      { key: "a", visible: false },
      { key: "b", visible: true },
      { key: "c", visible: false },
    ]);
  });

  it("adding a hidden Widget shows it after the Widgets already shown", () => {
    const withHiddenFirst = [
      { key: "a", visible: false },
      { key: "b", visible: true },
      { key: "c", visible: true },
      { key: "d", visible: false },
    ];
    expect(showWidget(withHiddenFirst, "a")).toEqual([
      { key: "b", visible: true },
      { key: "c", visible: true },
      { key: "a", visible: true },
      { key: "d", visible: false },
    ]);
  });

  it("dragging a Widget onto another moves it to that place", () => {
    expect(moveWidget(area, "a", "b")).toEqual([
      { key: "b", visible: true },
      { key: "a", visible: true },
      { key: "c", visible: false },
    ]);
  });

  it("dropping a Widget on one from another Area changes nothing", () => {
    expect(moveWidget(area, "a", "latestCandidates")).toEqual(area);
  });
});
