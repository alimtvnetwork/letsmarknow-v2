import React, { useEffect, useState } from "react";
import {
  Check,
  CreditCard,
  Globe,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAuth,
  signInWithGoogle,
  type AuthSession,
} from "@/lib/authStore";
import { openWebAccount } from "@/extension/lib/browserApi";

export interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  promptMessage?: string;
  onSuccess?: (session: AuthSession) => void;
}

export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AuthDialog({
  isOpen,
  onOpenChange,
  promptMessage,
  onSuccess,
}: AuthDialogProps) {
  const { session, signout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  // Auto-detect Chrome profile email if available
  useEffect(() => {
    if (isOpen && !session && !googleEmail) {
      if (typeof chrome !== "undefined" && chrome?.identity?.getProfileUserInfo) {
        try {
          chrome.identity.getProfileUserInfo({ accountStatus: "ANY" as any }, (info) => {
            if (info && info.email) {
              setGoogleEmail(info.email);
              setGoogleName(info.email.split("@")[0]);
            }
          });
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen, session, googleEmail]);

  const handleGoogleSignIn = async (emailOverride?: string, nameOverride?: string) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const emailToUse = emailOverride || googleEmail.trim();
      const nameToUse = nameOverride || googleName.trim();

      const auth = await signInWithGoogle(
        emailToUse
          ? {
              email: emailToUse,
              name: nameToUse || emailToUse.split("@")[0],
            }
          : undefined
      );

      toast.success("Signed in with Google successfully!");
      onSuccess?.(auth);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in with Google";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMsg("Please enter your Google email address.");
      return;
    }
    handleGoogleSignIn(googleEmail.trim(), googleName.trim());
  };

  const handleSignOut = async () => {
    await signout();
    setGoogleEmail("");
    setGoogleName("");
    toast.success("Signed out successfully");
  };

  const handleOpenBilling = () => {
    openWebAccount("/web/billing");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <GoogleLogo className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {session ? "Google Account & Sync" : "Sign in with Google"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {session
                  ? "Your collections and public share links are synced to your Google account."
                  : promptMessage || "1-click Google sign-in. Zero passwords, seamless cloud sync."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {session ? (
          // LOGGED IN VIEW
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium text-[11px]">Active Profile</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  <ShieldCheck className="h-3 w-3" /> Google Connected
                </span>
              </div>
              <div className="flex items-center gap-3 pt-0.5">
                {session.avatar_url ? (
                  <img
                    src={session.avatar_url}
                    alt={session.name || session.email}
                    className="h-10 w-10 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-violet-500 font-bold text-xs text-white shadow-xs">
                    {(session.name || session.email || "G").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">
                    {session.name || session.email.split("@")[0]}
                  </p>
                  <p className="text-muted-foreground font-mono text-[11px] truncate">
                    {session.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Cloud Sync & Public Sharing status */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Cloud Sync & Public Sharing Enabled</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Collections published from this extension generate live public web links viewable by anyone on the internet.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenBilling}
                className="w-full justify-between h-9 text-xs"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  Upgrade Plan & Billing
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-mono">Web</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          // NOT LOGGED IN VIEW
          <div className="py-2 space-y-3.5">
            {errorMsg && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            {/* Value Props */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Automatic bookmark sync across all your browsers</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>1-Click Toby-style public links for your collections</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Zero passwords to create or remember</span>
              </div>
            </div>

            {/* 1-Click Native Google OAuth Button */}
            <Button
              type="button"
              onClick={() => handleGoogleSignIn()}
              disabled={loading}
              className="w-full h-11 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm flex items-center justify-center gap-3 transition-colors active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <GoogleLogo className="h-4 w-4" />
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80" />
              </div>
              <span className="relative bg-card px-2.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                or connect with google email
              </span>
            </div>

            {/* Direct Google Account Email Connection Form */}
            <form onSubmit={handleCustomSubmit} className="space-y-3 pt-0.5">
              <div className="space-y-1.5">
                <Label htmlFor="google-email-input" className="text-xs font-medium flex items-center justify-between">
                  <span>Your Google / Gmail Address</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">1-Click Sync</span>
                </Label>
                <Input
                  id="google-email-input"
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="google-name-input" className="text-xs font-medium text-muted-foreground">
                  Display Name (Optional)
                </Label>
                <Input
                  id="google-name-input"
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Yeasin Kabir"
                  className="h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !googleEmail.trim()}
                className="w-full h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo className="h-4 w-4" />}
                <span>Connect Google Account</span>
              </Button>
            </form>

            <p className="text-[10px] text-center text-muted-foreground px-4">
              By continuing, you agree to LetsMarkNow&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
