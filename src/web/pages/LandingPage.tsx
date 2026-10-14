import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Check,
  Chrome,
  Compass,
  Download,
  ExternalLink,
  FolderPlus,
  Globe2,
  Layers,
  LayoutDashboard,
  Lock,
  Search,
  Share2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/web" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-md shadow-primary/25">
                L
              </div>
              <span className="font-bold text-lg tracking-tight">LetsMarkNow</span>
            </Link>
            <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              Extension First
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link to="/web/help" className="hover:text-foreground transition-colors">
              Help & Docs
            </Link>
            <Link to="/web/import-export" className="hover:text-foreground transition-colors">
              Import / Export
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/web/login">
              <Button variant="ghost" size="sm" className="text-xs font-medium">
                Sign in
              </Button>
            </Link>
            <Link to="/web/download">
              <Button size="sm" className="gap-2 text-xs font-semibold shadow-sm shadow-primary/30">
                <Chrome className="h-4 w-4" />
                Add to Chrome
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,70,239,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,70,239,0.12),rgba(0,0,0,0))]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs text-muted-foreground shadow-xs mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>The Browser Extension is the Primary Workspace</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.12]">
            Save tabs, organize sessions, and{" "}
            <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              reopen your focus
            </span>{" "}
            in seconds.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Forget messy tab hoarders and bloated web apps. LetsMarkNow puts your entire daily tab organizer right inside a browser-native extension page.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/web/download">
              <Button size="lg" className="h-12 px-6 text-sm font-semibold gap-2 shadow-lg shadow-primary/25">
                <Chrome className="h-5 w-5" />
                Add to Chrome — It&apos;s Free
              </Button>
            </Link>

            <Link to="/">
              <Button size="lg" variant="outline" className="h-12 px-5 text-sm font-medium gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Launch Extension App
              </Button>
            </Link>

            <Link to="/web/account">
              <Button size="lg" variant="ghost" className="h-12 px-4 text-sm font-medium text-muted-foreground">
                Web Account Portal
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="mt-5 text-xs text-muted-foreground flex items-center justify-center gap-6">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Manifest V3 Ready
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Fast & Keyboard-first
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> No cloud lock-in
            </span>
          </div>

          {/* Interactive Surface Cards Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-destructive/60" />
                <span className="h-3 w-3 rounded-full bg-amber-500/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <span className="ml-2 font-mono text-[11px]">chrome-extension://letsmarknow/app.html</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Daily Workspace
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-left">
              {/* Left: Spaces Sidebar */}
              <div className="md:col-span-3 rounded-xl border border-border bg-card/50 p-3 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Spaces
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between rounded-md bg-primary/15 px-2 py-1.5 font-semibold text-primary">
                    <span>Personal Engine</span>
                    <span className="text-[10px]">12</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted/40">
                    <span>Work Projects</span>
                    <span className="text-[10px]">8</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted/40">
                    <span>Design Systems</span>
                    <span className="text-[10px]">15</span>
                  </div>
                </div>
              </div>

              {/* Center: Saved Collections */}
              <div className="md:col-span-5 rounded-xl border border-border bg-card/90 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Design Systems & UI</h3>
                  <span className="text-[11px] text-muted-foreground">4 links</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg border border-border/70 p-2.5 flex items-center justify-between bg-background/50 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">Radix UI Primitives</p>
                      <p className="text-[11px] text-muted-foreground font-mono">radix-ui.com</p>
                    </div>
                    <span className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">Components</span>
                  </div>
                  <div className="rounded-lg border border-border/70 p-2.5 flex items-center justify-between bg-background/50 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">Tailwind CSS Documentation</p>
                      <p className="text-[11px] text-muted-foreground font-mono">tailwindcss.com</p>
                    </div>
                    <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5">Styling</span>
                  </div>
                </div>
              </div>

              {/* Right: Open Browser Tabs */}
              <div className="md:col-span-4 rounded-xl border border-border bg-card/50 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Open Tabs (4)
                  </span>
                  <span className="text-[10px] text-primary font-semibold">1-Click Save</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between rounded-md border border-border/50 bg-background/70 px-2 py-1.5 text-[11px]">
                    <span className="truncate">GitHub - letsmarknow-v2</span>
                    <span className="text-emerald-400 font-mono text-[10px]">active</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/50 bg-background/70 px-2 py-1.5 text-[11px]">
                    <span className="truncate">Chrome Manifest V3 Guide</span>
                    <span className="text-muted-foreground font-mono text-[10px]">pinned</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/50 bg-background/70 px-2 py-1.5 text-[11px]">
                    <span className="truncate">Next.js App Router Docs</span>
                    <span className="text-muted-foreground font-mono text-[10px]">ready</span>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="w-full h-7 text-xs font-medium">
                  <FolderPlus className="h-3 w-3 mr-1 text-primary" /> Save Window as Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Surface Roles Explanation (Section 1 in Spec) */}
      <section id="workflow" className="border-t border-border bg-card/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Three Distinct Product Surfaces
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Designed around your real daily browser habits. Fast capture when you need it, dense organization when you review, and clean web management for everything else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Extension Main Page */}
            <div className="rounded-xl border border-primary/40 bg-card p-6 space-y-3 relative shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Primary Daily App
              </div>
              <h3 className="text-lg font-bold">Extension Main Page</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Opens as a full browser tab (`app.html`). See your spaces, saved collections, open window tabs, and trash in a high-density, keyboard-friendly workspace.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-border/60">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Organize spaces & collections</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Save window sessions</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Reopen saved groups & items</li>
              </ul>
              <div className="pt-2">
                <Link to="/">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Open Extension Tab
                  </Button>
                </Link>
              </div>
            </div>

            {/* 2. Extension Popup & Side Panel */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3 shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Zap className="h-5 w-5" />
              </div>
              <div className="inline-block rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                Quick Browser Workflow
              </div>
              <h3 className="text-lg font-bold">Popup / Side Panel</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Answers “Where do I save this tab right now?”. Ultra-compact 380px panel to file the current tab, save all tabs, or quick-create destination collections.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-border/60">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400" /> 1-click current tab save</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400" /> Destination picker & inline create</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400" /> Side Panel beside active webpage</li>
              </ul>
              <div className="pt-2">
                <Link to="/popup">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Preview Popup
                  </Button>
                </Link>
              </div>
            </div>

            {/* 3. Web App */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3 shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Globe2 className="h-5 w-5" />
              </div>
              <div className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Portal & Public Sharing
              </div>
              <h3 className="text-lg font-bold">Web App Portal</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Account, billing, team collaboration, heavy bookmarks import/export, and standalone public share preview pages that work without any extension installed.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-border/60">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Public share links with search</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Team workspaces & member roles</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Toby & HTML bookmarks import</li>
              </ul>
              <div className="pt-2">
                <Link to="/web/account">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Account Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Designed for Daily Power Browsing
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything you need to keep your browser fast, organized, and clutter-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderPlus className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-sm">Session Snapshots</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Save 20 tabs from research in one go. Reopen them tomorrow or restore individual links.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-sm">Strict 5-Level Hierarchy</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Workspace → Space → Collection → Group → Item. Predictable, clean structure for every project.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Share2 className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-sm">Public Sharing</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Share a collection with a colleague or customer. Beautiful, read-only web view with instant search.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-sm">Privacy & Local First</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your bookmarks and tab data stay stored locally in your browser with full JSON export and backup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-border bg-card/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Simple, Transparent Plans
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started free forever with the browser extension. Upgrade for team collaboration and cloud backup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base">Starter (Extension)</h3>
                <p className="text-xs text-muted-foreground mt-1">For individual browser power users.</p>
                <div className="mt-4 text-3xl font-extrabold">$0</div>
                <p className="text-[11px] text-muted-foreground">Free forever</p>
                <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Full Extension Workspace</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Unlimited Collections & Tabs</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> 1-Click Session Snapshots</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Local JSON Backup</li>
                </ul>
              </div>
              <Link to="/web/download" className="mt-6">
                <Button variant="outline" className="w-full text-xs">Add to Chrome</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-xl border-2 border-primary bg-card p-6 flex flex-col justify-between relative shadow-lg shadow-primary/10">
              <span className="absolute -top-3 right-6 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                Popular
              </span>
              <div>
                <h3 className="font-bold text-base">Pro Cloud</h3>
                <p className="text-xs text-muted-foreground mt-1">For professionals managing multi-device tabs.</p>
                <div className="mt-4 text-3xl font-extrabold">$6 <span className="text-xs font-normal text-muted-foreground">/ month</span></div>
                <p className="text-[11px] text-muted-foreground">Billed annually ($72/yr)</p>
                <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Everything in Starter</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Multi-browser sync</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Public share links</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Auto cloud backups</li>
                </ul>
              </div>
              <Link to="/web/billing" className="mt-6">
                <Button className="w-full text-xs font-semibold">Start 14-Day Trial</Button>
              </Link>
            </div>

            {/* Team */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base">Team Workspace</h3>
                <p className="text-xs text-muted-foreground mt-1">For teams sharing curated research & libraries.</p>
                <div className="mt-4 text-3xl font-extrabold">$12 <span className="text-xs font-normal text-muted-foreground">/ user / mo</span></div>
                <p className="text-[11px] text-muted-foreground">Billed monthly</p>
                <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Everything in Pro</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Shared team spaces</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Role permissions (Admin, Member)</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Centralized billing & invoices</li>
                </ul>
              </div>
              <Link to="/web/team" className="mt-6">
                <Button variant="outline" className="w-full text-xs">Create Team</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="border-t border-border bg-primary/5 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready for a clean, fast browser?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Install the extension in less than 30 seconds. No card required.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link to="/web/download">
              <Button size="lg" className="h-11 px-6 text-xs font-semibold gap-2 shadow-md">
                <Chrome className="h-4 w-4" /> Add to Chrome Now
              </Button>
            </Link>
            <Link to="/web/app">
              <Button size="lg" variant="outline" className="h-11 px-5 text-xs font-medium">
                Open Fallback Web Organizer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/60 py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">LetsMarkNow</span>
            <span>&copy; {new Date().getFullYear()} LetsMarkNow Inc. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link to="/web/download" className="hover:text-foreground transition-colors">Download</Link>
            <Link to="/web/account" className="hover:text-foreground transition-colors">Account</Link>
            <Link to="/web/billing" className="hover:text-foreground transition-colors">Billing</Link>
            <Link to="/web/team" className="hover:text-foreground transition-colors">Team</Link>
            <Link to="/web/import-export" className="hover:text-foreground transition-colors">Import/Export</Link>
            <Link to="/web/help" className="hover:text-foreground transition-colors">Help</Link>
            <Link to="/web/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
