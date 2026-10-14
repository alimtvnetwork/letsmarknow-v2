import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PopupApp } from "./PopupApp";
import "@/index.css";

const queryClient = new QueryClient();

export function PopupRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PopupApp />
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
      <PopupRoot />
    </React.StrictMode>
  );
}

export default PopupRoot;
