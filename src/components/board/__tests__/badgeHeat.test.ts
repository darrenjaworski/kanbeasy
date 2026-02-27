import { describe, it, expect } from "vitest";
import { getBadgeHeat } from "../badgeHeat";

describe("getBadgeHeat", () => {
  describe("returns null for non-middle columns", () => {
    it("returns null when index is undefined", () => {
      expect(getBadgeHeat(5, undefined, 3)).toBeNull();
    });

    it("returns null when columnCount is undefined", () => {
      expect(getBadgeHeat(5, 1, undefined)).toBeNull();
    });

    it("returns null for first column (index === 0)", () => {
      expect(getBadgeHeat(5, 0, 3)).toBeNull();
    });

    it("returns null for last column (index === columnCount - 1)", () => {
      expect(getBadgeHeat(5, 2, 3)).toBeNull();
    });

    it("returns null when columnCount < 3 (1 column)", () => {
      expect(getBadgeHeat(5, 0, 1)).toBeNull();
    });

    it("returns null when columnCount < 3 (2 columns)", () => {
      expect(getBadgeHeat(5, 1, 2)).toBeNull();
    });
  });

  describe("returns null for low card counts on middle columns", () => {
    it("returns null for 0 cards", () => {
      expect(getBadgeHeat(0, 1, 3)).toBeNull();
    });

    it("returns null for 1 card", () => {
      expect(getBadgeHeat(1, 1, 3)).toBeNull();
    });

    it("returns null for 2 cards", () => {
      expect(getBadgeHeat(2, 1, 3)).toBeNull();
    });
  });

  describe("returns correct heat for card counts 3–10", () => {
    const cases: [number, number, boolean][] = [
      [3, 10, false],
      [4, 18, false],
      [5, 25, false],
      [6, 33, false],
      [7, 42, false],
      [8, 50, false],
      [9, 58, false],
      [10, 65, true],
    ];

    it.each(cases)(
      "returns accentPercent=%i and bold=%s for %i cards",
      (cardCount, expectedPercent, expectedBold) => {
        const result = getBadgeHeat(cardCount, 1, 3);
        expect(result).toEqual({
          accentPercent: expectedPercent,
          bold: expectedBold,
        });
      },
    );
  });

  describe("returns max heat for 11+ cards", () => {
    it("returns accentPercent 75 and bold for 11 cards", () => {
      expect(getBadgeHeat(11, 1, 3)).toEqual({
        accentPercent: 75,
        bold: true,
      });
    });

    it("returns accentPercent 75 and bold for 50 cards", () => {
      expect(getBadgeHeat(50, 1, 3)).toEqual({
        accentPercent: 75,
        bold: true,
      });
    });
  });

  describe("bold threshold", () => {
    it("is not bold for counts 3–9", () => {
      for (let count = 3; count <= 9; count++) {
        expect(getBadgeHeat(count, 1, 3)?.bold).toBe(false);
      }
    });

    it("is bold for counts 10+", () => {
      for (let count = 10; count <= 15; count++) {
        expect(getBadgeHeat(count, 1, 3)?.bold).toBe(true);
      }
    });
  });

  describe("works with various middle column indices", () => {
    it("works for index 1 of 5 columns", () => {
      expect(getBadgeHeat(5, 1, 5)).toEqual({
        accentPercent: 25,
        bold: false,
      });
    });

    it("works for index 2 of 5 columns", () => {
      expect(getBadgeHeat(5, 2, 5)).toEqual({
        accentPercent: 25,
        bold: false,
      });
    });

    it("works for index 3 of 5 columns", () => {
      expect(getBadgeHeat(5, 3, 5)).toEqual({
        accentPercent: 25,
        bold: false,
      });
    });
  });
});
