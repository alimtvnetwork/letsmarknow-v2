import React from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Chrome,
  Command,
  FileQuestion,
  FolderPlus,
  HelpCircle,
  Keyboard,
  Layers,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  const faqs = [
    {
      q: "Where do my bookmarks get saved?",
      a: "In LetsMarkNow V1, all your collections, spaces, and links are stored locally in your browser storage (chrome.storage.local / localStorage). You can also export a full JSON or CSV backup anytime.",
    },
    {
      q: "Why is the extension the primary app?",
      a: "Because tab management belongs where you browse! By keeping the organizer inside the extension main page (app.html), you can save active tabs, organize spaces, and restore sessions without switching to an external website.",
    },
    {
      q: "How do I save an entire browser window as a session?",
      a: "In the extension popup or main page, click 'Save Window as Session'. Give your session a name and destination space, and all valid tabs will be neatly saved into a new collection.",
    },
    {
      q: "Can I share collections with people who don't have the extension?",
      a: "Yes! Every collection can generate a public share link. Visitors can view the links, search them, and open original URLs on the web without installing anything.",
    },
  ];

  const shortcuts = [
    { key: "Alt + Shift + S", desc: "Open extension quick capture popup" },
    { key: "Ctrl / Cmd + K", desc: "Open global link search" },
    { key: "Escape", desc: "Close popup or modal dialog" },
    { key: "Enter", desc: "Open selected saved bookmark" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/web" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            L
          </div>
          <span className="font-bold text-base tracking-tight">LetsMarkNow Help & Support</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/web/download">
            <Button size="sm" className="gap-1.5 text-xs"><Chrome className="h-3.5 w-3.5" /> Add to Chrome</Button>
          </Link>
          <Link to="/web/account">
            <Button size="sm" variant="outline" className="text-xs">Account Portal</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 sm:py-16 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
            <HelpCircle className="h-3.5 w-3.5" /> Documentation & Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How can we help you?</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Everything you need to know about using LetsMarkNow, shortcuts, and troubleshooting.
          </p>
        </div>

        {/* Keyboard Shortcuts Section */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm border-b border-border/60 pb-3">
            <Keyboard className="h-4 w-4 text-primary" />
            <span>Keyboard Shortcuts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {shortcuts.map((sc) => (
              <div key={sc.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-muted-foreground">{sc.desc}</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] border border-border font-semibold text-foreground">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm border-b border-border/60 pb-3">
            <FileQuestion className="h-4 w-4 text-primary" />
            <span>Frequently Asked Questions</span>
          </div>

          <div className="divide-y divide-border/60">
            {faqs.map((faq, i) => (
              <div key={i} className="py-4 space-y-1.5 text-xs">
                <h3 className="font-semibold text-foreground text-sm">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-6 text-center space-y-3">
          <h2 className="text-base font-bold">Still have questions?</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Our team is here to help with bug reports, feature requests, or enterprise inquiries.
          </p>
          <a href="mailto:support@letsmarknow.com">
            <Button size="sm" className="text-xs gap-1.5 mt-2">
              <Mail className="h-3.5 w-3.5" /> Contact Support Team
            </Button>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link to="/web" className="hover:text-foreground">Home</Link> &bull;{" "}
        <Link to="/web/download" className="hover:text-foreground">Download</Link> &bull;{" "}
        <Link to="/web/account" className="hover:text-foreground">Account</Link>
      </footer>
    </div>
  );
}
