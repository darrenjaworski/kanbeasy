import { describe, it, expect } from "vitest";
import { getChecklistStats } from "../checklistStats";

describe("getChecklistStats", () => {
  it("returns null for text with no checkboxes", () => {
    expect(getChecklistStats("just some text")).toBeNull();
    expect(getChecklistStats("")).toBeNull();
  });

  it("counts unchecked items", () => {
    expect(getChecklistStats("- [ ] A\n- [ ] B")).toEqual({
      total: 2,
      checked: 0,
    });
  });

  it("counts checked items", () => {
    expect(getChecklistStats("- [x] A\n- [x] B")).toEqual({
      total: 2,
      checked: 2,
    });
  });

  it("counts mixed checked and unchecked", () => {
    expect(
      getChecklistStats("- [x] Done\n- [ ] Not done\n- [x] Also done"),
    ).toEqual({
      total: 3,
      checked: 2,
    });
  });

  it("handles uppercase X", () => {
    expect(getChecklistStats("- [X] Done")).toEqual({
      total: 1,
      checked: 1,
    });
  });

  it("handles checkboxes mixed with other content", () => {
    expect(
      getChecklistStats(
        "# Title\n\nSome text\n\n- [ ] Task\n- [x] Done\n\nMore text",
      ),
    ).toEqual({ total: 2, checked: 1 });
  });

  it("handles indented checkboxes", () => {
    expect(getChecklistStats("- [ ] Top\n  - [x] Nested")).toEqual({
      total: 2,
      checked: 1,
    });
  });

  it("handles * and + list markers", () => {
    expect(getChecklistStats("* [x] Star\n+ [ ] Plus")).toEqual({
      total: 2,
      checked: 1,
    });
  });
});
