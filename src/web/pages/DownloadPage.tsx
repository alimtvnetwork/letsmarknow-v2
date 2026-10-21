import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Check,
  Chrome,
  Compass,
  Download,
  ExternalLink,
  HelpCircle,
  Laptop,
  Layers,
  LayoutDashboard,
  Pin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/web" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            L
          </div>
          <span className="font-bold text-base tracking-tight">LetsMarkNow</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-xs">
              Preview Extension Tab
            </Button>
          </Link>
          <Link to="/web/account">
            <Button variant="outline" size="sm" className="text-xs">
              Web Account
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Download Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
            <Chrome className="h-3.5 w-3.5" />
            <span>Official Browser Extension</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Install LetsMarkNow for Chrome & Chromium
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            The browser extension is the primary daily app. Save tabs, organize spaces, and restore sessions directly in your browser.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://chromewebstore.google.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="add-to-chrome-button"
            >
              <Button size="lg" className="h-12 px-7 text-sm font-semibold gap-2.5 shadow-lg shadow-primary/30">
                <Chrome className="h-5 w-5" />
                Add to Chrome — Free
              </Button>
            </a>

            <Link to="/">
              <Button size="lg" variant="outline" className="h-12 px-5 text-sm font-medium gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Open Extension Workspace Now
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Also works on Microsoft Edge, Brave, Vivaldi, Opera, and Arc browser.
          </p>
        </div>

        {/* Installation Steps & Developer Mode Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Card 1: Standard Chrome Web Store */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 font-bold text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs">
                1
              </span>
              Standard Installation
            </div>
            <ol className="text-xs text-muted-foreground space-y-3 pl-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">1.</span>
                <span>Click &ldquo;Add to Chrome&rdquo; to visit the Chrome Web Store page.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">2.</span>
                <span>Click &ldquo;Add to Chrome&rdquo; in the store popup and confirm permissions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">3.</span>
                <span>Pin the LetsMarkNow icon to your browser toolbar for fast 1-click access.</span>
              </li>
            </ol>
          </div>

          {/* Card 2: Developer Mode (Load Unpacked) */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 font-bold text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs">
                2
              </span>
              Local Testing (Load Unpacked)
            </div>
            <ol className="text-xs text-muted-foreground space-y-3 pl-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">1.</span>
                <span>Run <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono text-foreground">npm run build:extension</code> in the repository.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">2.</span>
                <span>Open <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono text-foreground">chrome://extensions</code> and toggle &ldquo;Developer mode&rdquo; ON.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">3.</span>
                <span>Click &ldquo;Load unpacked&rdquo; and select the project <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono text-foreground">dist/extension</code> directory.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Pinning Visual Guide */}
        <div className="rounded-xl border border-primary/25 bg-card/60 p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Pin className="h-4 w-4" />
            <span>How to Pin LetsMarkNow for Instant Access</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click the puzzle piece icon (Extensions) in your browser toolbar, find <strong>LetsMarkNow</strong>, and click the Pin icon. This allows you to open the quick capture popup with 1 click or use the shortcut <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono border border-border">Alt+Shift+S</kbd> anytime.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link to="/web" className="hover:text-foreground">Return to Home</Link> &bull;{" "}
        <Link to="/web/help" className="hover:text-foreground">Help & Support</Link>
      </footer>
    </div>
  );
}
