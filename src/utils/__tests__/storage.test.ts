import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getFromStorage,
  getStringFromStorage,
  saveToStorage,
  saveStringToStorage,
  removeFromStorage,
} from "../storage";

describe("storage utilities", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("getFromStorage", () => {
    it("returns fallback when key does not exist", () => {
      const result = getFromStorage("non-existent", { default: true });
      expect(result).toEqual({ default: true });
    });

    it("returns stored value when key exists", () => {
      localStorage.setItem("test-key", JSON.stringify({ value: 42 }));
      const result = getFromStorage("test-key", { value: 0 });
      expect(result).toEqual({ value: 42 });
    });

    it("handles primitive values", () => {
      localStorage.setItem("string", JSON.stringify("hello"));
      localStorage.setItem("number", JSON.stringify(123));
      localStorage.setItem("boolean", JSON.stringify(true));

      expect(getFromStorage("string", "")).toBe("hello");
      expect(getFromStorage("number", 0)).toBe(123);
      expect(getFromStorage("boolean", false)).toBe(true);
    });

    it("handles arrays", () => {
      localStorage.setItem("array", JSON.stringify([1, 2, 3]));
      const result = getFromStorage("array", [] as number[]);
      expect(result).toEqual([1, 2, 3]);
    });

    it("returns fallback when parsing fails", () => {
      localStorage.setItem("invalid", "not valid JSON");
      const result = getFromStorage("invalid", { default: true });
      expect(result).toEqual({ default: true });
    });

    it("returns fallback when localStorage throws", () => {
      const spy = vi.spyOn(Storage.prototype, "getItem");
      spy.mockImplementation(() => {
        throw new Error("localStorage disabled");
      });

      const result = getFromStorage("test", { default: true });
      expect(result).toEqual({ default: true });

      spy.mockRestore();
    });
  });

  describe("getStringFromStorage", () => {
    it("returns fallback when key does not exist", () => {
      const result = getStringFromStorage("non-existent", "default");
      expect(result).toBe("default");
    });

    it("returns stored string when key exists", () => {
      localStorage.setItem("theme", "dark");
      const result = getStringFromStorage("theme", "light");
      expect(result).toBe("dark");
    });

    it("returns fallback when localStorage throws", () => {
      const spy = vi.spyOn(Storage.prototype, "getItem");
      spy.mockImplementation(() => {
        throw new Error("localStorage disabled");
      });

      const result = getStringFromStorage("test", "default");
      expect(result).toBe("default");

      spy.mockRestore();
    });
  });

  describe("saveToStorage", () => {
    it("saves object to localStorage", () => {
      saveToStorage("test", { value: 42 });
      const stored = localStorage.getItem("test");
      expect(stored).toBe('{"value":42}');
    });

    it("saves primitive values to localStorage", () => {
      saveToStorage("string", "hello");
      saveToStorage("number", 123);
      saveToStorage("boolean", true);

      expect(localStorage.getItem("string")).toBe('"hello"');
      expect(localStorage.getItem("number")).toBe("123");
      expect(localStorage.getItem("boolean")).toBe("true");
    });

    it("saves arrays to localStorage", () => {
      saveToStorage("array", [1, 2, 3]);
      const stored = localStorage.getItem("array");
      expect(stored).toBe("[1,2,3]");
    });

    it("overwrites existing values", () => {
      saveToStorage("test", { old: true });
      saveToStorage("test", { new: true });
      const stored = localStorage.getItem("test");
      expect(stored).toBe('{"new":true}');
    });

    it("handles errors silently", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem");
      spy.mockImplementation(() => {
        throw new Error("Quota exceeded");
      });

      // Should not throw
      expect(() => saveToStorage("test", { value: 42 })).not.toThrow();

      spy.mockRestore();
    });
  });

  describe("saveStringToStorage", () => {
    it("saves string to localStorage", () => {
      saveStringToStorage("theme", "dark");
      const stored = localStorage.getItem("theme");
      expect(stored).toBe("dark");
    });

    it("overwrites existing values", () => {
      saveStringToStorage("theme", "light");
      saveStringToStorage("theme", "dark");
      const stored = localStorage.getItem("theme");
      expect(stored).toBe("dark");
    });

    it("handles errors silently", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem");
      spy.mockImplementation(() => {
        throw new Error("Quota exceeded");
      });

      // Should not throw
      expect(() => saveStringToStorage("test", "value")).not.toThrow();

      spy.mockRestore();
    });
  });

  describe("removeFromStorage", () => {
    it("removes item from localStorage", () => {
      localStorage.setItem("test", "value");
      expect(localStorage.getItem("test")).toBe("value");

      removeFromStorage("test");
      expect(localStorage.getItem("test")).toBeNull();
    });

    it("handles non-existent keys", () => {
      // Should not throw
      expect(() => removeFromStorage("non-existent")).not.toThrow();
    });

    it("handles errors silently", () => {
      const spy = vi.spyOn(Storage.prototype, "removeItem");
      spy.mockImplementation(() => {
        throw new Error("localStorage disabled");
      });

      // Should not throw
      expect(() => removeFromStorage("test")).not.toThrow();

      spy.mockRestore();
    });
  });

  describe("round-trip operations", () => {
    it("can save and retrieve complex objects", () => {
      const data = {
        user: { name: "Test", age: 30 },
        settings: { theme: "dark", notifications: true },
        items: [1, 2, 3],
      };

      saveToStorage("complex", data);
      const retrieved = getFromStorage("complex", {});

      expect(retrieved).toEqual(data);
    });

    it("can save and retrieve strings", () => {
      saveStringToStorage("key", "value");
      const retrieved = getStringFromStorage("key", "");
      expect(retrieved).toBe("value");
    });
  });
});
