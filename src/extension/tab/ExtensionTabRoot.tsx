import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ExtensionTabApp } from "./ExtensionTabApp";
import "@/index.css";

const queryClient = new QueryClient();

export function ExtensionTabRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ExtensionTabApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark");
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ExtensionTabRoot />
    </React.StrictMode>
  );
}

export default ExtensionTabRoot;
