import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  KeyRound,
  Award,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  redeemLifetimeLicense,
  stackLifetimeLicense,
} from "@/lib/workspaceApiClient";
import { useAuth } from "@/lib/authStore";
import { AuthDialog, GoogleLogo } from "@/components/auth/AuthDialog";

export default function BillingPage() {
  const { session } = useAuth();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"Starter" | "Pro" | "Team">("Pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually");
  const [licenseCode, setLicenseCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [lifetimeDeal, setLifetimeDeal] = useState<{
    code_masked: string;
    stacked_seats: number;
  } | null>(null);

  const [invoices, setInvoices] = useState([
    { id: "INV-2026-001", date: "Oct 01, 2026", amount: "$72.00", status: "Paid" },
    { id: "INV-2025-012", date: "Oct 01, 2025", amount: "$72.00", status: "Paid" },
  ]);

  const handleSelectPlan = (plan: "Starter" | "Pro" | "Team") => {
    setCurrentPlan(plan);
    toast.success(`Plan updated to ${plan}`);
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = licenseCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a license code");
      return;
    }
    if (!code.startsWith("LMNL-")) {
      toast.error("License code must start with LMNL-");
      return;
    }

    setIsRedeeming(true);
    try {
      if (lifetimeDeal) {
        // Stack seats
        const res = await stackLifetimeLicense("current", code);
        setLifetimeDeal(res.lifetime_license);
        toast.success(`Code stacked successfully! Total seats: ${res.lifetime_license.stacked_seats}`);
      } else {
        const res = await redeemLifetimeLicense("current", code);
        setLifetimeDeal(res.lifetime_license);
        setCurrentPlan("Pro");
        toast.success(`Lifetime Pro plan activated with code ${res.lifetime_license.code_masked}`);
      }
      setLicenseCode("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to redeem code";
      toast.error(msg);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/web" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
            L
          </div>
          <span className="font-bold text-base tracking-tight">LetsMarkNow Billing</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              Launch Extension
            </Button>
          </Link>
          {session ? (
            <Link to="/web/account">
              <Button size="sm" variant="ghost" className="text-xs">
                {session.name ? session.name.split(" ")[0] : "Account"}
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsAuthDialogOpen(true)}
              className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground"
            >
              <GoogleLogo className="h-3.5 w-3.5" />
              Sign in with Google
            </Button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar / Mobile Nav Bar */}
        <aside className="md:col-span-1 text-xs flex flex-col">
          <nav className="flex md:flex-col overflow-x-auto gap-1.5 pb-2 md:pb-0 whitespace-nowrap scrollbar-none shrink-0">
            <Link
              to="/web/account"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors shrink-0"
            >
              <User className="h-4 w-4" /> Account Profile
            </Link>
            <Link
              to="/web/billing"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shrink-0"
            >
              <CreditCard className="h-4 w-4" /> Billing & Subscription
            </Link>
            <Link
              to="/web/team"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors shrink-0"
            >
              <Users className="h-4 w-4" /> Team & Members
            </Link>
            <Link
              to="/web/import-export"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors shrink-0"
            >
              <Download className="h-4 w-4" /> Import / Export / Backup
            </Link>
            <Link
              to="/web/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium transition-colors shrink-0"
            >
              <Shield className="h-4 w-4" /> Web Portal Settings
            </Link>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3 space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscription & Billing</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage your LetsMarkNow subscription plan, payment methods, and billing receipts.
            </p>
          </div>

          {/* Current Plan Overview Card */}
          <div className="rounded-xl border border-primary/40 bg-card p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Current Active Plan
              </span>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                LetsMarkNow {currentPlan}
                <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 text-xs font-semibold">
                  Active
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Next renewal date: November 1, 2026 &bull; {billingCycle === "annually" ? "$72.00 billed annually" : "$6.00 billed monthly"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Invoice receipt downloaded")}
                className="text-xs"
              >
                Latest Invoice
              </Button>
            </div>
          </div>

          {/* Plan Comparison & Upgrade/Downgrade */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Plan Comparison</h2>
              <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-card text-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    billingCycle === "monthly" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annually")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    billingCycle === "annually" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Annual (Save 20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starter */}
              <div className={`rounded-xl border p-5 flex flex-col justify-between ${currentPlan === "Starter" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="space-y-3">
                  <h3 className="font-bold text-sm">Starter Free</h3>
                  <div className="text-2xl font-extrabold">$0</div>
                  <p className="text-[11px] text-muted-foreground">Full browser extension organizer on local storage.</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Extension daily app</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Unlimited links</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Session snapshots</li>
                  </ul>
                </div>
                <Button
                  variant={currentPlan === "Starter" ? "secondary" : "outline"}
                  disabled={currentPlan === "Starter"}
                  onClick={() => handleSelectPlan("Starter")}
                  size="sm"
                  className="w-full mt-5 text-xs"
                >
                  {currentPlan === "Starter" ? "Current Plan" : "Downgrade to Free"}
                </Button>
              </div>

              {/* Pro */}
              <div className={`rounded-xl border-2 p-5 flex flex-col justify-between ${currentPlan === "Pro" ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border bg-card"}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">Pro Cloud</h3>
                    <span className="rounded bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5">Popular</span>
                  </div>
                  <div className="text-2xl font-extrabold">{billingCycle === "annually" ? "$6" : "$8"} <span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-[11px] text-muted-foreground">Cloud sync, public share links, and auto backup.</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Multi-device sync</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Public share links</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Auto cloud backups</li>
                  </ul>
                </div>
                <Button
                  variant={currentPlan === "Pro" ? "secondary" : "default"}
                  disabled={currentPlan === "Pro"}
                  onClick={() => handleSelectPlan("Pro")}
                  size="sm"
                  className="w-full mt-5 text-xs font-semibold"
                >
                  {currentPlan === "Pro" ? "Current Plan" : "Upgrade to Pro"}
                </Button>
              </div>

              {/* Team */}
              <div className={`rounded-xl border p-5 flex flex-col justify-between ${currentPlan === "Team" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="space-y-3">
                  <h3 className="font-bold text-sm">Team</h3>
                  <div className="text-2xl font-extrabold">{billingCycle === "annually" ? "$12" : "$15"} <span className="text-xs font-normal text-muted-foreground">/user/mo</span></div>
                  <p className="text-[11px] text-muted-foreground">Collaborative shared spaces and role controls.</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Shared workspaces</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Role management</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" /> Audit log access</li>
                  </ul>
                </div>
                <Button
                  variant={currentPlan === "Team" ? "secondary" : "default"}
                  disabled={currentPlan === "Team"}
                  onClick={() => handleSelectPlan("Team")}
                  size="sm"
                  className="w-full mt-5 text-xs"
                >
                  {currentPlan === "Team" ? "Current Plan" : "Upgrade to Team"}
                </Button>
              </div>
            </div>
          </div>

          {/* Payment Method Placeholder */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold border-b border-border/60 pb-3 flex items-center justify-between">
              <span>Payment Method</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Update card modal opened")}
                className="h-7 text-xs"
              >
                Update Card
              </Button>
            </h2>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-12 items-center justify-center rounded border border-border bg-muted/40 font-mono text-[11px] font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-semibold text-foreground">Visa ending in 4242</p>
                  <p className="text-[11px] text-muted-foreground">Expires 12/2028 &bull; Default card</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            </div>
          </div>

          {/* Lifetime License & Deal Redemption (Step 16) */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Lifetime License & Deal Redemption</h2>
              </div>
              {lifetimeDeal && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Lifetime Pro Active ({lifetimeDeal.stacked_seats} seat{lifetimeDeal.stacked_seats > 1 ? "s" : ""})
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Have an AppSumo, Founder, or promotional license code? Enter your code below to activate your lifetime Pro plan or stack additional member seats.
            </p>

            <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Input
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value)}
                  placeholder="LMNL-XXXX-XXXX-XXXX"
                  className="font-mono text-xs uppercase"
                  maxLength={25}
                />
              </div>
              <Button
                type="submit"
                disabled={isRedeeming || !licenseCode.trim()}
                size="sm"
                className="text-xs gap-1.5 shrink-0 w-full sm:w-auto"
              >
                <Award className="h-3.5 w-3.5" />
                {lifetimeDeal ? "Stack Code" : "Redeem Code"}
              </Button>
            </form>

            {lifetimeDeal && (
              <p className="text-[11px] text-muted-foreground bg-muted/30 border border-border/60 rounded-md p-2">
                Active License Key: <code className="font-mono text-foreground font-semibold">{lifetimeDeal.code_masked}</code> &bull; Lifetime updates enabled.
              </p>
            )}
          </div>

          {/* Invoices History Placeholder */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold border-b border-border/60 pb-3">Invoice History</h2>
            <div className="divide-y divide-border/60 text-xs">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{inv.id}</p>
                      <p className="text-[11px] text-muted-foreground">{inv.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-foreground font-semibold">{inv.amount}</span>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                      {inv.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.success(`Downloaded ${inv.id}`)}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </div>
  );
}
