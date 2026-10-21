import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthDialog } from "./AuthDialog";
import * as authStore from "@/lib/authStore";

describe("AuthDialog Component", () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.setStoredAuth(null);
    vi.restoreAllMocks();
  });

  it("renders 1-click Google sign in dialog when unauthenticated", () => {
    render(<AuthDialog isOpen={true} onOpenChange={() => {}} />);

    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText(/Automatic bookmark sync across all your browsers/i)).toBeInTheDocument();
    expect(screen.getByText(/1-Click Toby-style public links/i)).toBeInTheDocument();
  });

  it("triggers Google sign in and executes onSuccess callback", async () => {
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();

    vi.spyOn(authStore, "signInWithGoogle").mockResolvedValueOnce({
      account_id: "google-acc-123",
      email: "jane@gmail.com",
      name: "Jane Google",
      default_organization_id: "org-123",
      access_token: "jwt-token-xyz",
    });

    render(
      <AuthDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: "google-acc-123",
          email: "jane@gmail.com",
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("renders active Google session view when user is logged in", () => {
    authStore.setStoredAuth({
      account_id: "google-acc-456",
      email: "alex@gmail.com",
      name: "Alex Cloud",
      default_organization_id: "org-456",
      access_token: "jwt-token-456",
    });

    render(<AuthDialog isOpen={true} onOpenChange={() => {}} />);

    expect(screen.getByText("Google Account & Sync")).toBeInTheDocument();
    expect(screen.getByText("Google Connected")).toBeInTheDocument();
    expect(screen.getByText("Alex Cloud")).toBeInTheDocument();
    expect(screen.getByText("alex@gmail.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign Out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upgrade Plan & Billing/i })).toBeInTheDocument();
  });

  it("allows entering Google email and connects successfully via form submit", async () => {
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();

    vi.spyOn(authStore, "signInWithGoogle").mockResolvedValueOnce({
      account_id: "google-acc-789",
      email: "yeasin@gmail.com",
      name: "Yeasin Kabir",
      default_organization_id: "org-789",
      access_token: "jwt-token-789",
    });

    render(
      <AuthDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/Your Google \/ Gmail Address/i);
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: "yeasin@gmail.com" } });

    const connectBtn = screen.getByRole("button", { name: /Connect Google Account/i });
    fireEvent.click(connectBtn);

    await waitFor(() => {
      expect(authStore.signInWithGoogle).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "yeasin@gmail.com",
        })
      );
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: "google-acc-789",
          email: "yeasin@gmail.com",
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("displays error in alert banner when Google OAuth fails while keeping email input accessible", async () => {
    vi.spyOn(authStore, "signInWithGoogle").mockRejectedValueOnce(
      new Error("Please enter your Google / Gmail account email to connect.")
    );

    render(<AuthDialog isOpen={true} onOpenChange={() => {}} />);

    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter your Google / Gmail account email to connect.")
      ).toBeInTheDocument();
    });

    // Email input field remains in the DOM and is accessible
    const emailInput = screen.getByLabelText(/Your Google \/ Gmail Address/i);
    expect(emailInput).toBeInTheDocument();
  });
});
