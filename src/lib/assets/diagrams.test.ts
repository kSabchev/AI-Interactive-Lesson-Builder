import { describe, expect, it } from "vitest";
import { DIAGRAM_ART } from "@/components/art/diagrams";
import { bg } from "@/lib/i18n/dictionaries/bg";
import { en } from "@/lib/i18n/dictionaries/en";
import { DIAGRAM_IDS, DIAGRAMS } from "./diagrams";

/** Target buttons are at least 44px across; at the diagrams' 800×500 drawing size, keep them clearly apart. */
const MIN_GAP_PX = 60;

describe.each(DIAGRAM_IDS)("diagram %s", (id) => {
  const diagram = DIAGRAMS[id];

  it("has a drawing, and an English and Bulgarian title and description for every spot", () => {
    expect(DIAGRAM_ART[id]).toBeTypeOf("function");
    for (const t of [en, bg]) {
      expect(t.diagrams[id].title.trim()).not.toBe("");
      for (const target of diagram.targets) expect(t.diagrams[id].targets[target.id]?.trim()).toBeTruthy();
    }
  });

  it("has 2-6 uniquely named spots inside the picture, far enough apart to tap", () => {
    const targets = diagram.targets;
    expect(targets.length).toBeGreaterThanOrEqual(2);
    expect(targets.length).toBeLessThanOrEqual(6); // a lesson labels at most six
    expect(new Set(targets.map((t) => t.id)).size).toBe(targets.length);
    for (const t of targets) {
      expect(t.x).toBeGreaterThan(0);
      expect(t.x).toBeLessThan(100);
      expect(t.y).toBeGreaterThan(0);
      expect(t.y).toBeLessThan(100);
    }
    for (const a of targets) {
      for (const b of targets) {
        if (a === b) continue;
        const gap = Math.hypot((a.x - b.x) * 8, (a.y - b.y) * 5);
        expect(gap, `${a.id} and ${b.id}`).toBeGreaterThanOrEqual(MIN_GAP_PX);
      }
    }
  });
});
