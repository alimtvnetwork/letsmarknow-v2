import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chrome, Lock, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Account created successfully! Welcome to LetsMarkNow.");
    navigate("/web/account");
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

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="space-y-1.5 text-xs">
            <Label className="text-xs">Your Name</Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
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

          <Button type="submit" className="w-full text-xs font-semibold h-9">
            Create Account
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/web/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <div className="pt-2 text-center">
          <Link to="/web/download" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <Chrome className="h-3.5 w-3.5" />
            Looking for the Chrome extension? Add to Chrome
          </Link>
        </div>
      </div>
    </div>
  );
}
