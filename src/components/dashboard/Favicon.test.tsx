import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Favicon } from "./Favicon";
import { getFaviconUrl } from "./helpers";

describe("Favicon Component and Helper", () => {
  it("generates correct favicon URL for valid URLs", () => {
    expect(getFaviconUrl("https://github.com/facebook/react")).toBe(
      "https://www.google.com/s2/favicons?domain=github.com&sz=64"
    );
    expect(getFaviconUrl("https://linear.app")).toBe(
      "https://www.google.com/s2/favicons?domain=linear.app&sz=64"
    );
  });

  it("handles invalid URLs defensively in getFaviconUrl", () => {
    expect(getFaviconUrl("not-a-valid-url")).toBe("");
  });

  it("renders an image with the favicon URL", () => {
    render(<Favicon url="https://github.com" size="md" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "src",
      "https://www.google.com/s2/favicons?domain=github.com&sz=64"
    );
    expect(img).toHaveAttribute("alt", "github.com");
  });

  it("falls back to globe icon when image load fails", () => {
    render(<Favicon url="https://example.com" size="sm" />);
    const img = screen.getByRole("img");

    fireEvent.error(img);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("favicon-fallback")).toBeInTheDocument();
  });
});
