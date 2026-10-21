import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import AccountPage from "./AccountPage";
import { setStoredAuth, ingestUrlAuthSync, type AuthSession } from "@/lib/authStore";

describe("AccountPage Google Login & Account Sync", () => {
  beforeEach(() => {
    localStorage.clear();
    setStoredAuth(null);
    vi.clearAllMocks();
  });

  it("renders Google Sync banner and Sign in with Google button when unauthenticated", () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Connect Google Account for Cloud Sync")).toBeInTheDocument();
    expect(screen.getByText("Not Signed In")).toBeInTheDocument();

    const googleButtons = screen.getAllByRole("button", { name: /sign in with google/i });
    expect(googleButtons.length).toBeGreaterThan(0);
  });

  it("opens AuthDialog when clicking Sign in with Google", async () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    const googleBtn = screen.getAllByRole("button", { name: /sign in with google/i })[0];
    fireEvent.click(googleBtn);

    // AuthDialog modal should open with dialog role
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("renders authenticated Google session details and passwordless indicator", () => {
    const mockSession: AuthSession = {
      account_id: "acc_google_123",
      email: "googleuser@gmail.com",
      name: "Google User",
      default_organization_id: "org_123",
      access_token: "jwt_token_123",
      auth_provider: "google",
      has_password: false,
    };
    setStoredAuth(mockSession);

    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Account Cloud Sync Active")).toBeInTheDocument();
    expect(screen.getByText("Google OAuth Connected")).toBeInTheDocument();
    expect(screen.getByText("Passwordless Single Sign-On")).toBeInTheDocument();
    expect(screen.getByText("Google OAuth 2.0 Single Sign-On")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Google User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("googleuser@gmail.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign out$/i })).toBeInTheDocument();
  });

  it("ingests auth_sync payload from URL correctly into session", () => {
    const mockSyncSession: AuthSession = {
      account_id: "acc_synced_999",
      email: "synced_from_ext@example.com",
      name: "Synced Extension User",
      default_organization_id: "org_sync_999",
      access_token: "token_abc_xyz",
    };

    delete (window as any).location;
    window.location = {
      hash: `#auth_sync=${encodeURIComponent(JSON.stringify(mockSyncSession))}`,
      search: "",
      pathname: "/web/account",
      replace: vi.fn(),
    } as any;

    const ingested = ingestUrlAuthSync();
    expect(ingested).not.toBeNull();
    expect(ingested?.account_id).toBe("acc_synced_999");
    expect(ingested?.email).toBe("synced_from_ext@example.com");
  });
});
