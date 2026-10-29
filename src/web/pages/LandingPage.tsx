import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  Chrome,
  Clock,
  Compass,
  Cpu,
  Download,
  ExternalLink,
  Flame,
  FolderPlus,
  Globe2,
  HelpCircle,
  Laptop,
  Layers,
  LayoutDashboard,
  Lock,
  Menu,
  Minus,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DemoWorkspace {
  name: string;
  category: string;
  ramUsage: string;
  tabs: { title: string; domain: string; tag: string; active?: boolean }[];
  collectionName: string;
  collectionLinks: { title: string; domain: string; tag: string }[];
}

const DEMO_SPACES: Record<string, DemoWorkspace> = {
  dev: {
    name: "Engineering Sprint",
    category: "Development",
    ramUsage: "1.4 GB RAM",
    collectionName: "Frontend Architecture & API",
    collectionLinks: [
      { title: "Radix UI Primitives", domain: "radix-ui.com", tag: "Components" },
      { title: "Tailwind CSS Documentation", domain: "tailwindcss.com", tag: "Styling" },
      { title: "TanStack Query v5 Guide", domain: "tanstack.com", tag: "Data Fetching" },
    ],
    tabs: [
      { title: "GitHub - letsmarknow-v2", domain: "github.com", tag: "active", active: true },
      { title: "Chrome Manifest V3 Documentation", domain: "developer.chrome.com", tag: "pinned" },
      { title: "Next.js 15 Server Actions RFC", domain: "nextjs.org", tag: "ready" },
      { title: "Vite 6 Multi-page Extension Config", domain: "vitejs.dev", tag: "ready" },
    ],
  },
  design: {
    name: "Product & UI Systems",
    category: "Design",
    ramUsage: "2.1 GB RAM",
    collectionName: "Design Systems & Tokens",
    collectionLinks: [
      { title: "Linear App Design Philosophy", domain: "linear.app", tag: "Inspiration" },
      { title: "Figma Component Variables Spec", domain: "figma.com", tag: "Assets" },
      { title: "Apple Human Interface Guidelines", domain: "developer.apple.com", tag: "Guidelines" },
    ],
    tabs: [
      { title: "Figma - LetsMarkNow Webapp v2", domain: "figma.com", tag: "active", active: true },
      { title: "Mobbin - Mobile & Web App Flows", domain: "mobbin.com", tag: "reference" },
      { title: "Fontshare Free Modern Typefaces", domain: "fontshare.com", tag: "assets" },
      { title: "Dribbble SaaS UI Exploration", domain: "dribbble.com", tag: "moodboard" },
    ],
  },
  research: {
    name: "Deep Market Research",
    category: "Strategy",
    ramUsage: "1.8 GB RAM",
    collectionName: "Competitive Landscape Q3",
    collectionLinks: [
      { title: "State of Browser Extensions 2026", domain: "substack.com", tag: "Analysis" },
      { title: "Chrome Web Store Search Engine Stats", domain: "statista.com", tag: "Metrics" },
      { title: "Product Hunt Productivity Launches", domain: "producthunt.com", tag: "Benchmarks" },
    ],
    tabs: [
      { title: "Arxiv: Local-First Vector Storage", domain: "arxiv.org", tag: "active", active: true },
      { title: "Hacker News: Tab Managers Debate", domain: "news.ycombinator.com", tag: "discussion" },
      { title: "Notion: Product Feature Matrix", domain: "notion.so", tag: "roadmap" },
      { title: "Substack: Software Architecture Insights", domain: "substack.com", tag: "reading" },
    ],
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState<string>("dev");
  const [isSavedSnapshot, setIsSavedSnapshot] = useState<boolean>(false);
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const currentSpace = DEMO_SPACES[activeTabKey];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* 1. Global Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/web" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-md shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
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
            <a href="#comparison" className="hover:text-foreground transition-colors">
              Compare
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <Link to="/web/import-export" className="hover:text-foreground transition-colors">
              Import / Export
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/web/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs font-medium">
                Sign in
              </Button>
            </Link>
            <Link to="/web/download">
              <Button size="sm" className="gap-2 text-xs font-semibold shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all">
                <Chrome className="h-4 w-4" />
                <span className="hidden sm:inline">Add to Chrome</span>
                <span className="sm:hidden">Install</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 space-y-1">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Features
            </a>
            <a
              href="#workflow"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              How it works
            </a>
            <a
              href="#comparison"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Compare
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              FAQ
            </a>
            <Link
              to="/web/import-export"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Import / Export
            </Link>
            <Link
              to="/web/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </header>

      {/* 2. Hero Section with Interactive Sandbox Console */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(0,0,0,0))]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3.5 py-1 text-xs text-muted-foreground shadow-xs mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>The Browser Extension is the Primary Workspace</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.12]">
            Save tabs, organize sessions, and{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              reopen your focus
            </span>{" "}
            in seconds.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Forget messy tab hoarders and bloated web apps. LetsMarkNow puts your entire daily tab organizer right inside a browser-native extension page.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/web/download">
              <Button size="lg" className="h-12 px-7 text-sm font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                <Chrome className="h-5 w-5" />
                Add to Chrome — It&apos;s Free
              </Button>
            </Link>

            <Link to="/">
              <Button size="lg" variant="outline" className="h-12 px-6 text-sm font-medium gap-2 hover:bg-muted/60 transition-colors">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Launch Extension App
              </Button>
            </Link>

            <Link to="/web/account">
              <Button size="lg" variant="ghost" className="h-12 px-4 text-sm font-medium text-muted-foreground hover:text-foreground">
                Web Account Portal
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Trust Ratings & Badges */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
              <div className="flex -space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <span className="text-foreground ml-1">4.9 / 5</span>
              <span className="text-muted-foreground font-normal">from 10,000+ power users</span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Manifest V3 High-Speed
            </span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> 100% Local-First Privacy
            </span>
          </div>

          {/* Interactive Live Product Sandbox */}
          <div className="mt-12 max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card/85 p-4 sm:p-6 shadow-2xl backdrop-blur-sm text-left transition-all">
            {/* Window Chrome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/70 pb-3.5 mb-4 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-destructive/60" />
                <span className="h-3 w-3 rounded-full bg-amber-500/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <span className="ml-2 font-mono text-[11px] text-foreground/80">
                  chrome-extension://letsmarknow/app.html
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                  Interactive Live Demo
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Try Clicking Below
                </span>
              </div>
            </div>

            {/* Interactive Mode Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-2 rounded-xl border border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground mr-1.5 pl-1">Switch Space:</span>
                {(["dev", "design", "research"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveTabKey(key);
                      setIsSavedSnapshot(false);
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                      activeTabKey === key
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                    }`}
                  >
                    {DEMO_SPACES[key].name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-muted-foreground text-[11px]">
                  Memory: <strong className="text-foreground">{currentSpace.ramUsage}</strong>
                </span>
              </div>
            </div>

            {/* 3-Column Workspace Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left: Spaces Sidebar */}
              <div className="md:col-span-3 rounded-xl border border-border bg-card/50 p-3 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Workspaces & Spaces
                </span>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center justify-between rounded-md px-2 py-1.5 font-semibold transition-colors ${activeTabKey === "dev" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/40"}`}>
                    <span className="truncate">Engineering Sprint</span>
                    <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded">12</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-md px-2 py-1.5 font-semibold transition-colors ${activeTabKey === "design" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/40"}`}>
                    <span className="truncate">Product & UI Systems</span>
                    <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded">8</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-md px-2 py-1.5 font-semibold transition-colors ${activeTabKey === "research" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/40"}`}>
                    <span className="truncate">Deep Market Research</span>
                    <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded">15</span>
                  </div>
                </div>
              </div>

              {/* Center: Saved Collections */}
              <div className="md:col-span-5 rounded-xl border border-border bg-card/90 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">{currentSpace.collectionName}</h3>
                  <span className="text-[11px] text-muted-foreground">
                    {currentSpace.collectionLinks.length + (isSavedSnapshot ? currentSpace.tabs.length : 0)} items
                  </span>
                </div>

                <div className="space-y-2">
                  {currentSpace.collectionLinks.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/70 p-2.5 flex items-center justify-between bg-background/50 text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="truncate mr-2">
                        <p className="font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{item.domain}</p>
                      </div>
                      <span className="text-[10px] shrink-0 rounded bg-primary/10 text-primary px-1.5 py-0.5">
                        {item.tag}
                      </span>
                    </div>
                  ))}

                  {/* Show saved tabs snapshot if user clicked the button */}
                  {isSavedSnapshot && (
                    <div className="pt-2 border-t border-dashed border-emerald-500/40 space-y-2 animate-in fade-in duration-300">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
                        <Check className="h-3.5 w-3.5" />
                        <span>Just Saved from Window ({currentSpace.tabs.length} tabs)</span>
                      </div>
                      {currentSpace.tabs.map((tab, idx) => (
                        <div
                          key={`saved-${idx}`}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2 flex items-center justify-between text-xs"
                        >
                          <span className="truncate text-foreground/90">{tab.title}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">saved</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Open Browser Tabs with Interactive 1-Click Action */}
              <div className="md:col-span-4 rounded-xl border border-border bg-card/50 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Open Browser Window ({currentSpace.tabs.length})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Ready to Snapshot</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {currentSpace.tabs.map((tab, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-background/70 px-2.5 py-1.5 text-[11px] hover:bg-background transition-colors"
                    >
                      <span className="truncate mr-2">{tab.title}</span>
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          tab.active ? "text-emerald-400" : "text-muted-foreground"
                        }`}
                      >
                        {tab.tag}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant={isSavedSnapshot ? "outline" : "default"}
                  onClick={() => setIsSavedSnapshot(!isSavedSnapshot)}
                  className={`w-full h-8 text-xs font-semibold gap-1.5 transition-all ${
                    isSavedSnapshot
                      ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                      : "shadow-md shadow-primary/20"
                  }`}
                >
                  {isSavedSnapshot ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Session Saved! (Click to Reset)
                    </>
                  ) : (
                    <>
                      <FolderPlus className="h-3.5 w-3.5" />
                      1-Click Snapshot ({currentSpace.tabs.length} tabs)
                    </>
                  )}
                </Button>
                {isSavedSnapshot && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    ⚡ Instant memory recovery: <strong>{currentSpace.ramUsage} freed</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Metric Proof Ribbon (Social Proof & Performance) */}
      <section className="border-y border-border bg-card/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                500,000+
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Tabs Saved & Cataloged</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-400 font-mono">
                85%
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Average Memory Reduction</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary font-mono">
                &lt; 15ms
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Local Search & Recall Latency</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                100%
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Local-First Privacy & Control</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Problem vs. Solution (Tab Chaos vs Focused Zen) */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Tired of 50+ Tabs Slowing Down Your Brain and Machine?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Most bookmark tools are where links go to die. LetsMarkNow transforms tab hoarders into organized power users without the cognitive overload.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Chaos Card */}
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
                  Without LetsMarkNow
                </span>
                <span className="text-xs text-muted-foreground font-mono">4.8 GB RAM Drain</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Tab Fatigue & Lost Context</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <Minus className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>Dozens of microscopic favicon tabs where you can&apos;t read titles.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Minus className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>Accidental window closes that lose crucial research forever.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Minus className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>Heavy web dashboards that force you to log in just to find a link.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Minus className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>Sluggish browser performance and fans spinning constantly.</span>
                </li>
              </ul>
            </div>

            {/* The Zen Card */}
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-6 sm:p-8 space-y-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                  With LetsMarkNow
                </span>
                <span className="text-xs text-emerald-400 font-mono">0 MB Background Drain</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Instant Recall & Clean Zen</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>1-Click Session Snapshots:</strong> Stash 30 tabs instantly and recover full focus.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Native Extension Speed:</strong> Opens in &lt;15ms directly in a clean browser tab.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Strict 5-Level Hierarchy:</strong> Workspaces, spaces, and collections that stay tidy.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Lock-in:</strong> Export your data to JSON or HTML bookmarks anytime.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Surface Roles Explanation (Section 1 in Spec) */}
      <section id="workflow" className="border-t border-border bg-card/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Three Distinct Product Surfaces
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Designed around your real daily browser habits. Fast capture when you need it, dense organization when you review, and clean web management for everything else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Extension Main Page */}
            <div className="rounded-xl border border-primary/40 bg-card p-6 space-y-3 relative shadow-md hover:border-primary/60 transition-all">
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
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Save window sessions in 1 click</li>
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
            <div className="rounded-xl border border-border bg-card p-6 space-y-3 shadow-md hover:border-indigo-400/40 transition-all">
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
            <div className="rounded-xl border border-border bg-card p-6 space-y-3 shadow-md hover:border-emerald-500/40 transition-all">
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

      {/* 6. Feature Highlights Bento Grid */}
      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Built for Speed, Privacy, and Daily Flow
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything you need to keep your browser fast, organized, and clutter-free without friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderPlus className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Session Snapshots</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Save 25 tabs from intense research in one go. Reopen them tomorrow in a clean window, or restore individual links on demand.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Strict 5-Level Hierarchy</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Workspace → Space → Collection → Group → Item. Predictable, clean structure for personal bookmarks, work teams, and side projects.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Share2 className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Public Sharing & Docs</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Share a collection with a colleague or customer. Beautiful, read-only web view with instant fuzzy search and zero extension requirement.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Privacy & Local-First</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your bookmarks and tab data stay stored locally in your browser. Zero tracking, zero telemetry on your urls, and full JSON export anytime.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Undo & History Safety</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Accidentally delete a collection? Recover it instantly from the built-in trash bin with 30-day soft deletion and history tracking.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Download className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">1-Click Migration</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Migrate in 10 seconds from Toby, OneTab, or standard Chrome/Safari HTML bookmarks without losing your folders or tags.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Competitor Comparison Table */}
      <section id="comparison" className="border-t border-border bg-card/20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Why Power Users Switch to LetsMarkNow
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              See how LetsMarkNow compares to traditional bookmark managers and outdated tab extensions.
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto -mx-4 px-4 sm:mx-auto sm:px-0">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80">
                  <th className="py-4 px-4 font-semibold text-foreground">Capability</th>
                  <th className="py-4 px-4 font-bold text-primary bg-primary/10 rounded-t-xl text-center">
                    LetsMarkNow
                  </th>
                  <th className="py-4 px-4 font-medium text-muted-foreground text-center">Toby</th>
                  <th className="py-4 px-4 font-medium text-muted-foreground text-center">OneTab</th>
                  <th className="py-4 px-4 font-medium text-muted-foreground text-center">Raindrop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                <tr>
                  <td className="py-3.5 px-4 font-medium">Manifest V3 Native & High-Speed</td>
                  <td className="py-3.5 px-4 bg-primary/5 text-center text-emerald-400 font-semibold">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">Legacy V2 / Slower</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">Heavy Web App</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Strict 5-Level Architecture</td>
                  <td className="py-3.5 px-4 bg-primary/5 text-center text-emerald-400 font-semibold">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">2 Levels</td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">Flat List Only</td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">Folders & Tags</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Side Panel & Popup Integration</td>
                  <td className="py-3.5 px-4 bg-primary/5 text-center text-emerald-400 font-semibold">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">Popup only</td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">None</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">100% Local-First & Zero Telemetry</td>
                  <td className="py-3.5 px-4 bg-primary/5 text-center text-emerald-400 font-semibold">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-destructive">Forced Cloud Sync</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-destructive">Cloud Account Req</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Standalone Public Share Links</td>
                  <td className="py-3.5 px-4 bg-primary/5 text-center text-emerald-400 font-semibold">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-emerald-400">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">Basic Webpage</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Team Collaboration & Workspaces</td>
                  <td className="py-3.5 px-4 bg-primary/5 text-center text-emerald-400 font-semibold rounded-b-xl">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-emerald-400">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">No</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400">
                    <Check className="h-4 w-4 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 8. Pricing Section with Annual/Monthly Toggle */}
      <section id="pricing" className="border-t border-border py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Simple, Transparent Plans
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started free forever with the browser extension. Upgrade for multi-device sync, cloud backup, and team collaboration.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="mt-6 inline-flex items-center gap-3 p-1 rounded-full border border-border bg-card">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  billingCycle === "monthly"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  billingCycle === "annual"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Annual Billing</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                  Save 28%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Free Starter */}
            <div className="rounded-xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between hover:border-border/80 transition-all">
              <div>
                <h3 className="font-bold text-lg">Starter (Extension)</h3>
                <p className="text-xs text-muted-foreground mt-1">For individual browser power users.</p>
                <div className="mt-5 text-4xl font-extrabold">$0</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Free forever · No credit card</p>
                <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Full Extension Workspace
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Unlimited Collections & Tabs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> 1-Click Session Snapshots
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Full Local JSON & CSV Backup
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Trash & 30-Day Recovery
                  </li>
                </ul>
              </div>
              <Link to="/web/download" className="mt-8">
                <Button variant="outline" className="w-full text-xs font-semibold h-10">
                  Add to Chrome — It&apos;s Free
                </Button>
              </Link>
            </div>

            {/* Pro Cloud (Elevated) */}
            <div className="rounded-xl border-2 border-primary bg-card p-6 sm:p-7 flex flex-col justify-between relative shadow-xl shadow-primary/10">
              <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-extrabold text-primary-foreground shadow-sm">
                MOST POPULAR
              </span>
              <div>
                <h3 className="font-bold text-lg text-foreground">Pro Cloud</h3>
                <p className="text-xs text-muted-foreground mt-1">For professionals managing multi-device tabs.</p>
                <div className="mt-5 text-4xl font-extrabold text-foreground">
                  {billingCycle === "annual" ? "$6" : "$8"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {billingCycle === "annual" ? "Billed annually ($72/year)" : "Billed monthly ($8/month)"}
                </p>
                <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Everything in Starter
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Multi-browser encrypted sync
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Unlimited public share links with search
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Automatic cloud backups & versioning
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Priority developer support
                  </li>
                </ul>
              </div>
              <Link to="/web/billing" className="mt-8">
                <Button className="w-full text-xs font-semibold h-10 shadow-md shadow-primary/25">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </div>

            {/* Team Workspace */}
            <div className="rounded-xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between hover:border-border/80 transition-all">
              <div>
                <h3 className="font-bold text-lg">Team Workspace</h3>
                <p className="text-xs text-muted-foreground mt-1">For teams sharing curated research & libraries.</p>
                <div className="mt-5 text-4xl font-extrabold">
                  {billingCycle === "annual" ? "$12" : "$15"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ user / mo</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {billingCycle === "annual" ? "Billed annually ($144/seat)" : "Billed monthly ($15/seat)"}
                </p>
                <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Everything in Pro Cloud
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Shared team spaces & collections
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Role permissions (Admin, Member, Viewer)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Consolidated billing & tax invoices
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Dedicated onboarding architect
                  </li>
                </ul>
              </div>
              <Link to="/web/team" className="mt-8">
                <Button variant="outline" className="w-full text-xs font-semibold h-10">
                  Create Team Workspace
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 text-center text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> 14-day money back guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" /> Encrypted end-to-end
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-emerald-400" /> Cancel anytime with 1 click
            </span>
          </div>
        </div>
      </section>

      {/* 9. Interactive FAQ Accordion */}
      <section id="faq" className="border-t border-border bg-card/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-3">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to know about LetsMarkNow, privacy, and workflows.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="rounded-xl border border-border bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                Why is the browser extension the primary workspace instead of a web app?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Traditional web apps require opening a new browser tab, waiting for remote servers to render, and logging in. LetsMarkNow opens natively via Chrome&apos;s extension runtime in less than 15ms. It directly talks to your browser&apos;s tab manager, allowing instant 1-click window snapshots and zero remote delay.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="rounded-xl border border-border bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                How does LetsMarkNow compare to Toby or OneTab?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Toby is a legacy extension that relies on forced cloud sync and has grown sluggish over the years. OneTab reduces tabs to a flat unorganized list with no hierarchy. LetsMarkNow offers a modern Manifest V3 foundation, strict 5-level organization (Workspace → Space → Collection → Group → Item), side panel support, and 100% local-first privacy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="rounded-xl border border-border bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                Is my browsing data private? Does LetsMarkNow read my web history?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Absolutely private. LetsMarkNow operates local-first. We do NOT track your browsing habits, inject ads, or sell browsing telemetry. Only the tabs and collections you explicitly save are stored, and they remain in your local browser storage unless you choose to sync with Pro Cloud.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="rounded-xl border border-border bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                Can I easily import my existing bookmarks and Toby collections?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Yes! We built a dedicated <Link to="/web/import-export" className="text-primary underline">Import & Export portal</Link> supporting Toby JSON, standard Netscape HTML bookmarks (Chrome, Safari, Firefox), and full JSON backups with 1-click import.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="rounded-xl border border-border bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                How does public collection sharing work?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                When you share a collection, LetsMarkNow generates a clean, read-only web view. Recipients do not need to install the extension or create an account. They can search links, copy URLs, or import the collection directly into their own workspace.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 10. CTA Footer Banner */}
      <section className="border-t border-border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs text-primary font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Reclaim Your Browser Today</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready for a clean, lightning-fast browser?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Install the extension in less than 30 seconds. No credit card required. Experience focused, clutter-free browsing.
          </p>
          <div className="pt-3 flex flex-wrap justify-center gap-3">
            <Link to="/web/download">
              <Button size="lg" className="h-12 px-7 text-xs sm:text-sm font-semibold gap-2 shadow-lg shadow-primary/25">
                <Chrome className="h-4 w-4" /> Add to Chrome Now — Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="mt-auto border-t border-border bg-card/60 py-10 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                L
              </div>
              <span>LetsMarkNow</span>
            </div>
            <span className="hidden sm:inline text-border">|</span>
            <span>&copy; {new Date().getFullYear()} LetsMarkNow Inc. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
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
