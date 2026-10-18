import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Extension App Surfaces (Primary daily application mounted at "/")
import { ExtensionTabApp } from "./extension/tab/ExtensionTabApp";
import { PopupApp } from "./extension/popup/PopupApp";
import { SidePanelApp } from "./extension/sidepanel/SidePanelApp";
import { OptionsApp } from "./extension/options/OptionsApp";

// Web App Surfaces (Secondary: portal, billing, public sharing, fallback mounted at "/web")
import LandingPage from "./web/pages/LandingPage";
import DownloadPage from "./web/pages/DownloadPage";
import LoginPage from "./web/pages/LoginPage";
import SignupPage from "./web/pages/SignupPage";
import AccountPage from "./web/pages/AccountPage";
import BillingPage from "./web/pages/BillingPage";
import TeamPage from "./web/pages/TeamPage";
import WebSettingsPage from "./web/pages/WebSettingsPage";
import ImportExportPage from "./web/pages/ImportExportPage";
import PublicShareViewerPage from "./web/pages/PublicShareViewerPage";
import InviteAcceptancePage from "./web/pages/InviteAcceptancePage";
import HelpPage from "./web/pages/HelpPage";
import WebOrganizerFallback from "./web/pages/WebOrganizerFallback";
import NotFound from "./web/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Extension Primary Surfaces mounted at root "/" */}
          <Route path="/" element={<ExtensionTabApp />} />
          <Route
            path="/popup"
            element={
              <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4">
                <PopupApp />
              </div>
            }
          />
          <Route path="/sidepanel" element={<SidePanelApp />} />
          <Route path="/options" element={<OptionsApp />} />

          {/* Web App Portal & Account Routes mounted at "/web" */}
          <Route path="/web" element={<LandingPage />} />
          <Route path="/web/download" element={<DownloadPage />} />
          <Route path="/web/login" element={<LoginPage />} />
          <Route path="/web/signup" element={<SignupPage />} />
          <Route path="/web/account" element={<AccountPage />} />
          <Route path="/web/billing" element={<BillingPage />} />
          <Route path="/web/team" element={<TeamPage />} />
          <Route path="/web/settings" element={<WebSettingsPage />} />
          <Route path="/web/import-export" element={<ImportExportPage />} />
          <Route path="/web/share/:shareId" element={<PublicShareViewerPage />} />
          <Route path="/web/invite/:inviteId" element={<InviteAcceptancePage />} />
          <Route path="/web/help" element={<HelpPage />} />

          {/* Web Organizer Fallback Single Route */}
          <Route path="/web/app" element={<WebOrganizerFallback />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
