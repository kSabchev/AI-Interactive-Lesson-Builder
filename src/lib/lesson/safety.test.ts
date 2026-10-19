import { describe, expect, it } from "vitest";
import { unsafeExperimentTerms } from "./safety";

const check = (...lines: string[]) => unsafeExperimentTerms({ materials: lines, steps: [] });

describe("unsafeExperimentTerms", () => {
  it("finds fire, blades, strong chemicals and mains electricity, in English and Bulgarian", () => {
    expect(check("A birthday candle", "Matches")).toEqual(["candle", "matches"]);
    expect(check("A sharp knife")).toEqual(["knife"]);
    expect(check("Bleach")).toEqual(["bleach"]);
    expect(check("Plug it into the wall socket")).toEqual(["wall socket"]);
    expect(check("Запалете свещта")).toEqual(["свещ"]);
    expect(check("Кухненски нож")).toEqual([]); // bare "нож" isn't matched (it would catch "ножица")
    expect(check("Отрежете с ножа")).toEqual(["ножа"]);
    expect(check("Малко белина")).toEqual(["белин"]);
  });

  it("doesn't flag safe words that merely contain an unsafe one", () => {
    expect(check("A picture of a firefly", "My favourite hobby", "Mainstream toys")).toEqual([]);
    expect(check("Ножица", "Хартия", "Оцет и сода бикарбонат")).toEqual([]);
    expect(check("Water", "A glass", "Raisins", "Vinegar and baking soda")).toEqual([]);
  });

  it("checks the steps too", () => {
    expect(unsafeExperimentTerms({ materials: ["Water"], steps: ["Heat it on the stove until boiling"] })).toEqual(["stove", "boiling"]);
  });
});
