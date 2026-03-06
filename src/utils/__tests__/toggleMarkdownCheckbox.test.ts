import { describe, it, expect } from "vitest";
import { toggleMarkdownCheckbox } from "../toggleMarkdownCheckbox";

describe("toggleMarkdownCheckbox", () => {
  it("checks an unchecked checkbox by index", () => {
    const md = "- [ ] First\n- [ ] Second";
    expect(toggleMarkdownCheckbox(md, 0)).toBe("- [x] First\n- [ ] Second");
    expect(toggleMarkdownCheckbox(md, 1)).toBe("- [ ] First\n- [x] Second");
  });

  it("unchecks a checked checkbox by index", () => {
    const md = "- [x] Done\n- [x] Also done";
    expect(toggleMarkdownCheckbox(md, 0)).toBe("- [ ] Done\n- [x] Also done");
    expect(toggleMarkdownCheckbox(md, 1)).toBe("- [x] Done\n- [ ] Also done");
  });

  it("handles mixed checked/unchecked", () => {
    const md = "- [x] Done\n- [ ] Not done\n- [x] Also done";
    expect(toggleMarkdownCheckbox(md, 1)).toBe(
      "- [x] Done\n- [x] Not done\n- [x] Also done",
    );
  });

  it("handles uppercase X", () => {
    const md = "- [X] Done";
    expect(toggleMarkdownCheckbox(md, 0)).toBe("- [ ] Done");
  });

  it("returns original markdown for out-of-range index", () => {
    const md = "- [ ] Only one";
    expect(toggleMarkdownCheckbox(md, 5)).toBe(md);
  });

  it("works with markdown containing non-checkbox content", () => {
    const md = "# Title\n\nSome text\n\n- [ ] Task\n\nMore text";
    expect(toggleMarkdownCheckbox(md, 0)).toBe(
      "# Title\n\nSome text\n\n- [x] Task\n\nMore text",
    );
  });

  it("handles indented checkboxes", () => {
    const md = "- [ ] Top\n  - [ ] Nested";
    expect(toggleMarkdownCheckbox(md, 1)).toBe("- [ ] Top\n  - [x] Nested");
  });

  it("works with * and + list markers", () => {
    const md = "* [ ] Star\n+ [ ] Plus";
    expect(toggleMarkdownCheckbox(md, 0)).toBe("* [x] Star\n+ [ ] Plus");
    expect(toggleMarkdownCheckbox(md, 1)).toBe("* [ ] Star\n+ [x] Plus");
  });
});
