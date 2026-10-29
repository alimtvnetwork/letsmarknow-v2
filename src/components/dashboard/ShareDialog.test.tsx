import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ShareDialog } from "./ShareDialog";
import type { ShareSettings } from "@/types/lmn";

describe("ShareDialog", () => {
  const defaultShare: ShareSettings = {
    id: "share-123",
    targetType: "collection",
    targetId: "col-1",
    visibility: "public",
    permission: "view",
    publicSlug: "design-systems-3701",
    createdAt: new Date().toISOString(),
  };

  it("renders with correct target name and visibility options", () => {
    const onOpenChange = vi.fn();
    const onSave = vi.fn();

    render(
      <ShareDialog
        isOpen={true}
        targetType="collection"
        targetId="col-1"
        targetName="Design Systems"
        initialSettings={defaultShare}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    );

    expect(screen.getByText(/Share.*Design Systems/i)).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
  });

  it("calls onSave with updated visibility and permission when submitted", () => {
    const onSave = vi.fn();

    render(
      <ShareDialog
        isOpen={true}
        targetType="collection"
        targetId="col-1"
        targetName="Design Systems"
        initialSettings={defaultShare}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />
    );

    // Switch to private
    fireEvent.click(screen.getByText("Private"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "collection",
        targetId: "col-1",
        visibility: "private",
      })
    );
  });

  it("calls onDisable when Disable Access button is clicked", () => {
    const onDisable = vi.fn();

    render(
      <ShareDialog
        isOpen={true}
        targetType="collection"
        targetId="col-1"
        targetName="Design Systems"
        initialSettings={defaultShare}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onDisable={onDisable}
      />
    );

    const disableBtn = screen.getByRole("button", { name: /disable access/i });
    expect(disableBtn).toBeInTheDocument();
    fireEvent.click(disableBtn);

    expect(onDisable).toHaveBeenCalledWith("collection", "col-1");
  });
});
