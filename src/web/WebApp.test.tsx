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

describe("Web App Portal Surface", () => {
  beforeEach(() => {
    localStorage.clear();
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

  it("renders Team Page and lists members", () => {
    render(
      <MemoryRouter>
        <TeamPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Workspace Team Members")).toBeInTheDocument();
    expect(screen.getByText("Alex Chen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /invite member/i })).toBeInTheDocument();
  });

  it("renders Import and Export Page", () => {
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
