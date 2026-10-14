import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaveCurrentTabCard } from "./SaveCurrentTabCard";

describe("SaveCurrentTabCard", () => {
  it("renders tab information and calls onSave when idle", () => {
    const onSave = vi.fn();
    render(
      <SaveCurrentTabCard
        tab={{
          id: 1,
          title: "Vite Docs",
          url: "https://vitejs.dev",
          favIconUrl: "https://vitejs.dev/logo.svg",
        }}
        status="idle"
        onSave={onSave}
      />
    );

    expect(screen.getByText("Vite Docs")).toBeInTheDocument();
    expect(screen.getByText("vitejs.dev")).toBeInTheDocument();

    const saveButton = screen.getByTestId("save-current-tab-button");
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalled();
  });

  it("renders disabled state when tab is a browser internal page", () => {
    render(
      <SaveCurrentTabCard
        tab={{
          id: 2,
          title: "Extensions",
          url: "chrome://extensions",
        }}
        status="idle"
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText(/cannot be saved/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cannot save this page/i })).toBeDisabled();
  });

  it("renders loading and saved states correctly", () => {
    const { rerender } = render(
      <SaveCurrentTabCard
        tab={{ id: 3, title: "GitHub", url: "https://github.com" }}
        status="loading"
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText(/saving tab.../i)).toBeInTheDocument();

    rerender(
      <SaveCurrentTabCard
        tab={{ id: 3, title: "GitHub", url: "https://github.com" }}
        status="saved"
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
  });

  it("renders already saved badge with save again option", () => {
    const onSave = vi.fn();
    render(
      <SaveCurrentTabCard
        tab={{ id: 4, title: "Tailwind", url: "https://tailwindcss.com" }}
        status="idle"
        alreadySaved={true}
        onSave={onSave}
      />
    );

    expect(screen.getByText(/already in collection/i)).toBeInTheDocument();
    const saveAgainBtn = screen.getByRole("button", { name: /save again/i });
    fireEvent.click(saveAgainBtn);
    expect(onSave).toHaveBeenCalled();
  });
});
