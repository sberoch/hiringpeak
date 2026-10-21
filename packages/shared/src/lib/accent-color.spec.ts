import {
  accentTextColor,
  accentTextOnWhite,
  readableAccent,
} from "./accent-color";

describe("accentTextColor", () => {
  it.each(["#0066ff", "#1a1a2e", "#8b0000"])(
    "puts white text on the dark color %s",
    (color) => {
      expect(accentTextColor(color)).toEqual({
        ok: true,
        textColor: "#ffffff",
      });
    },
  );

  it.each(["#ffd400", "#a0e7e5", "#ff8c00"])(
    "puts black text on the light color %s",
    (color) => {
      expect(accentTextColor(color)).toEqual({
        ok: true,
        textColor: "#000000",
      });
    },
  );

  it.each(["#777777", "#757575", "#d6336c"])(
    "rejects the mid-tone %s, readable with neither black nor white text",
    (color) => {
      expect(accentTextColor(color)).toEqual({
        ok: false,
        reason: expect.stringMatching(/ni con texto negro ni con texto blanco/),
      });
    },
  );

  it.each(["blue", "#fff", "#12345g", ""])(
    "rejects %j, which is not a #RRGGBB color",
    (color) => {
      expect(accentTextColor(color)).toEqual({
        ok: false,
        reason: expect.stringMatching(/#RRGGBB/),
      });
    },
  );
});

describe("readableAccent", () => {
  it.each([
    ["a dark", "#1a1a2e", "#ffffff"],
    ["a light", "#ffd400", "#000000"],
  ])(
    "keeps %s accent color with the text color that reads on it",
    (_variant, color, textColor) => {
      expect(readableAccent(color)).toEqual({ color, textColor });
    },
  );

  it("is the default blue with white text without an accent color", () => {
    expect(readableAccent(null)).toEqual({
      color: "#0066ff",
      textColor: "#ffffff",
    });
  });

  it("falls back to the default blue for a stored color that is not readable", () => {
    expect(readableAccent("#777777")).toEqual({
      color: "#0066ff",
      textColor: "#ffffff",
    });
  });
});

describe("accentTextOnWhite", () => {
  const INK = "#0a0f1c";

  it("draws text on white in a dark accent", () => {
    expect(accentTextOnWhite(readableAccent("#1a1a2e"), INK)).toBe("#1a1a2e");
  });

  it("draws text on white in ink when the accent is light", () => {
    expect(accentTextOnWhite(readableAccent("#ffd400"), INK)).toBe(INK);
  });
});
