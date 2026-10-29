import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chrome } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupUser } from "@/lib/authStore";
import { ApiError } from "@/lib/apiClient";
import { AuthDialog, GoogleLogo } from "@/components/auth/AuthDialog";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signupUser({ name, email, password });
      toast.success("Account created successfully! Welcome to LetsMarkNow.");
      navigate("/web/account");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to create account. Please try again.";
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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-xs text-muted-foreground">
            Get cloud sync, public shares, and team collaboration.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          {/* 1-Click Google Sign Up */}
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
            <span className="relative bg-card px-2">or register with email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-xs">
              <Label className="text-xs">Your Name</Label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="h-9 text-xs"
              />
            </div>

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
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-9 text-xs"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full text-xs font-semibold h-9">
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/web/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        promptMessage="Create or connect your account with Google for 1-click authentication and seamless extension sync."
        onSuccess={() => {
          navigate("/web/account");
        }}
      />
    </div>
  );
}
