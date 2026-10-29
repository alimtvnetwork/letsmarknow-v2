import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chrome, Lock, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signinUser } from "@/lib/authStore";
import { ApiError } from "@/lib/apiClient";
import { AuthDialog, GoogleLogo } from "@/components/auth/AuthDialog";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signinUser({ email, password });
      toast.success("Signed in successfully");
      navigate("/web/account");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to sign in. Please verify your email and password.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 font-sans selection:bg-primary/20">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/web" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground text-base shadow-md shadow-primary/20">
              L
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to LetsMarkNow</h1>
          <p className="text-xs text-muted-foreground">
            Manage your account, billing, team, and public shares.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          {/* Primary Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAuthDialogOpen(true)}
            className="w-full text-xs font-semibold h-10 gap-2.5 border-border/80 hover:bg-muted/50"
          >
            <GoogleLogo className="h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative py-1 text-center text-[11px] text-muted-foreground">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-2">or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-xs">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Password</Label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Password reset instructions sent to your email.");
                  }}
                  className="text-[11px] text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-9 text-xs"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full text-xs font-semibold h-9">
              {isLoading ? "Signing In..." : "Sign In with Email"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/web/signup" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>

        <div className="pt-2 text-center">
          <Link
            to="/web/download"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <Chrome className="h-3.5 w-3.5" />
            Prefer to install the extension first? Add to Chrome
          </Link>
        </div>
      </div>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        promptMessage="Sign in with your Google account to sync your LetsMarkNow bookmarks, billing, and team workspaces."
        onSuccess={() => {
          navigate("/web/account");
        }}
      />
    </div>
  );
}
