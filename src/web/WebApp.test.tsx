import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import LandingPage from "./pages/LandingPage";
import DownloadPage from "./pages/DownloadPage";
import AccountPage from "./pages/AccountPage";
import BillingPage from "./pages/BillingPage";
import TeamPage from "./pages/TeamPage";
import ImportExportPage from "./pages/ImportExportPage";
import PublicShareViewerPage from "./pages/PublicShareViewerPage";
import HelpPage from "./pages/HelpPage";
import { setStoredAuth } from "@/lib/authStore";

describe("Web App Portal Surface", () => {
  beforeEach(() => {
    localStorage.clear();
    setStoredAuth(null);
  });

  it("renders Landing Page with install CTA", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("LetsMarkNow").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/add to chrome/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/three distinct product surfaces/i)).toBeInTheDocument();
    expect(screen.getByText(/the browser extension is the primary workspace/i)).toBeInTheDocument();
  });

  it("renders Download Page with install CTA", () => {
    render(
      <MemoryRouter>
        <DownloadPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Install LetsMarkNow for Chrome/i)).toBeInTheDocument();
    expect(screen.getByTestId("add-to-chrome-button")).toBeInTheDocument();
    expect(screen.getByText(/How to Pin LetsMarkNow/i)).toBeInTheDocument();
  });

  it("renders Account Page", () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Account Profile/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("jane@letsmarknow.com")).toBeInTheDocument();
    expect(screen.getByText("Connected Browsers & Devices")).toBeInTheDocument();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
  });

  it("renders Billing Page with plan comparison and upgrade options", () => {
    render(
      <MemoryRouter>
        <BillingPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Subscription & Billing")).toBeInTheDocument();
    expect(screen.getByText(/Current Active Plan/i)).toBeInTheDocument();
    expect(screen.getByText("Starter Free")).toBeInTheDocument();
    expect(screen.getByText("Pro Cloud")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Invoice History")).toBeInTheDocument();
  });

  it("handles auth_sync payload seamlessly on Billing Page without infinite loading", () => {
    const rawSync = encodeURIComponent(
      JSON.stringify({
        account_id: "01a15ec4-7b13-7237-8b37-3964c905225b",
        email: "joy.altersense@gmail.com",
        name: "Sk. Yeasin Kabir Joy",
        default_organization_id: "01a15ec4-7b15-78a9-9035-d6f2c3140868",
        access_token: "mock-valid-sync-token",
        expires_in: 3600,
      })
    );

    window.location.hash = `auth_sync=${rawSync}`;

    render(
      <MemoryRouter initialEntries={[`/web/billing#auth_sync=${rawSync}`]}>
        <BillingPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Subscription & Billing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sk\./i })).toBeInTheDocument();
    window.location.hash = "";
  });

  it("renders Team Page unauthenticated and prompts for login without dummy members", () => {
    render(
      <MemoryRouter>
        <TeamPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Workspace Team Members")).toBeInTheDocument();
    expect(screen.getByText(/log in to view team and members/i)).toBeInTheDocument();
    expect(screen.queryByText("Alex Chen")).not.toBeInTheDocument();
    expect(screen.queryByText("Jordan Smith")).not.toBeInTheDocument();
    expect(screen.queryByText("Taylor Swift")).not.toBeInTheDocument();
  });

  it("renders Team Page authenticated with current user and invite controls", () => {
    setStoredAuth({
      account_id: "acc_owner_test",
      email: "sarah@letsmarknow.com",
      name: "Sarah Connor",
      access_token: "mock-jwt-token",
      expires_in: 3600,
      default_organization_id: "org_test",
    });

    render(
      <MemoryRouter>
        <TeamPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Workspace Team Members")).toBeInTheDocument();
    expect(screen.getByText(/Sarah Connor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /invite member/i })).toBeInTheDocument();
    expect(screen.queryByText("Alex Chen")).not.toBeInTheDocument();
  });

  it("renders Import and Export Page unauthenticated with login prompt", () => {
    render(
      <MemoryRouter>
        <ImportExportPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Import, Export & Data Backups")).toBeInTheDocument();
    expect(screen.getByText(/log in to access import & export/i)).toBeInTheDocument();
  });

  it("renders Import and Export Page authenticated with export tools", () => {
    setStoredAuth({
      account_id: "acc_owner_test",
      email: "sarah@letsmarknow.com",
      name: "Sarah Connor",
      access_token: "mock-jwt-token",
      expires_in: 3600,
      default_organization_id: "org_test",
    });

    render(
      <MemoryRouter>
        <ImportExportPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Import, Export & Data Backups")).toBeInTheDocument();
    expect(screen.getByText("Full Workspace JSON Backup")).toBeInTheDocument();
    expect(screen.getByText("Spreadsheet CSV Export")).toBeInTheDocument();
    expect(screen.getByText("Browser Bookmarks")).toBeInTheDocument();
  });

  it("renders Public Share Viewer without extension requirement", () => {
    render(
      <MemoryRouter initialEntries={["/web/share/public-share-demo"]}>
        <PublicShareViewerPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("public-share-page")).toBeInTheDocument();
    expect(screen.getAllByText(/add to chrome/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/search shared links/i)).toBeInTheDocument();
  });

  it("renders Help & Documentation Page", () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>
    );

    expect(screen.getByText("How can we help you?")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
  });
});
