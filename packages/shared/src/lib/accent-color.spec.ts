import { accentTextColor } from "./accent-color";

describe("accentTextColor", () => {
  it.each(["#0066ff", "#1a1a2e", "#8b0000"])(
    "puts white text on the dark color %s",
    (color) => {
      expect(accentTextColor(color)).toEqual({ ok: true, textColor: "#ffffff" });
    },
  );

  it.each(["#ffd400", "#a0e7e5", "#ff8c00"])(
    "puts black text on the light color %s",
    (color) => {
      expect(accentTextColor(color)).toEqual({ ok: true, textColor: "#000000" });
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
});
