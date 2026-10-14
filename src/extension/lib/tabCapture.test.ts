import { describe, expect, it } from "vitest";
import {
  filterSaveableTabs,
  generateSessionName,
  getDomainFromUrl,
  isSaveableUrl,
  tabToSavedItem,
} from "./tabCapture";
import type { BrowserTabSnapshot } from "@/types/lmn";

describe("tabCapture utilities", () => {
  describe("isSaveableUrl", () => {
    it("accepts valid http and https URLs", () => {
      expect(isSaveableUrl("https://github.com/letsmarknow")).toBe(true);
      expect(isSaveableUrl("http://localhost:5173/dashboard")).toBe(true);
      expect(isSaveableUrl("https://example.com/page?query=1")).toBe(true);
    });

    it("rejects browser internal and non-web URLs", () => {
      expect(isSaveableUrl("chrome://extensions")).toBe(false);
      expect(isSaveableUrl("chrome-extension://abcdef/popup.html")).toBe(false);
      expect(isSaveableUrl("edge://settings")).toBe(false);
      expect(isSaveableUrl("about:blank")).toBe(false);
      expect(isSaveableUrl("javascript:void(0)")).toBe(false);
      expect(isSaveableUrl("data:text/html,<h1>Hi</h1>")).toBe(false);
      expect(isSaveableUrl("")).toBe(false);
      expect(isSaveableUrl(null)).toBe(false);
      expect(isSaveableUrl(undefined)).toBe(false);
    });
  });

  describe("getDomainFromUrl", () => {
    it("extracts clean domain without www", () => {
      expect(getDomainFromUrl("https://www.github.com/foo")).toBe("github.com");
      expect(getDomainFromUrl("https://docs.google.com/document")).toBe("docs.google.com");
      expect(getDomainFromUrl("http://localhost:5173")).toBe("localhost");
    });

    it("handles invalid or empty URLs safely", () => {
      expect(getDomainFromUrl("")).toBe("unknown");
      expect(getDomainFromUrl(null)).toBe("unknown");
      expect(getDomainFromUrl("not-a-url")).toBe("not-a-url");
    });
  });

  describe("filterSaveableTabs", () => {
    it("keeps only saveable http/https tabs", () => {
      const tabs: BrowserTabSnapshot[] = [
        { id: 1, title: "Google", url: "https://google.com" },
        { id: 2, title: "Settings", url: "chrome://settings" },
        { id: 3, title: "GitHub", url: "https://github.com" },
        { id: 4, title: "Blank", url: "about:blank" },
      ];

      const filtered = filterSaveableTabs(tabs);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((t) => t.id)).toEqual([1, 3]);
    });
  });

  describe("tabToSavedItem", () => {
    it("converts a tab snapshot to a SavedItem payload", () => {
      const tab: BrowserTabSnapshot = {
        id: 10,
        title: "Vite Guide",
        url: "https://vitejs.dev/guide/",
        favIconUrl: "https://vitejs.dev/logo.svg",
      };

      const item = tabToSavedItem(tab, {
        source: "current-tab",
        tags: ["build-tool"],
        color: "teal",
      });

      expect(item.title).toBe("Vite Guide");
      expect(item.url).toBe("https://vitejs.dev/guide/");
      expect(item.faviconUrl).toBe("https://vitejs.dev/logo.svg");
      expect(item.source).toBe("current-tab");
      expect(item.color).toBe("teal");
      expect(item.tags).toEqual(["build-tool"]);
      expect(item.isDeleted).toBe(false);
    });

    it("falls back to domain when title is missing", () => {
      const tab: BrowserTabSnapshot = {
        url: "https://tailwindcss.com/",
      };

      const item = tabToSavedItem(tab);
      expect(item.title).toBe("tailwindcss.com");
      expect(item.tags).toEqual(["tailwindcss.com"]);
    });
  });

  describe("generateSessionName", () => {
    it("generates a formatted session name with month and day", () => {
      const date = new Date(2026, 9, 13); // Oct 13, 2026
      expect(generateSessionName(date)).toBe("Session - Oct 13");
    });
  });
});
