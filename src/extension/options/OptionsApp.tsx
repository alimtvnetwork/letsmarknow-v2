import React from "react";
import { Bookmark, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openExtensionTab, openWebDashboard } from "../lib/browserApi";
import { ExtensionSettingsView } from "../components/ExtensionSettingsView";

export function OptionsApp() {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div
      data-testid="extension-options-app"
      className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 flex flex-col"
    >
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 px-4 sm:px-6 py-4 backdrop-blur shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Bookmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold tracking-tight text-foreground">LetsMarkNow</span>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">Options & Preferences</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openExtensionTab()}
              className="h-8 text-xs"
            >
              Open Full Tab
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openWebDashboard()}
              className="h-8 text-xs text-muted-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Web App
            </Button>
          </div>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 overflow-y-auto">
        <ExtensionSettingsView />
      </main>
    </div>
  );
}

export default OptionsApp;
