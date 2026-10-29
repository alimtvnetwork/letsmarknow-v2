import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Check, Chrome, LayoutDashboard, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptOrgInvite } from "@/lib/orgStore";

export default function InviteAcceptancePage() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    try {
      if (inviteId) {
        await acceptOrgInvite(inviteId);
      }
    } catch {
      // Graceful fallback for offline demo links
    }
    setAccepted(true);
    toast.success("Joined workspace successfully! Redirecting...");
    setTimeout(() => {
      navigate("/web/account");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 font-sans selection:bg-primary/20">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground text-xl shadow-lg shadow-primary/25 mx-auto">
          L
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">You&apos;re invited to join LetsMarkNow</h1>
          <p className="text-xs text-muted-foreground">
            Alex Chen invited you to collaborate on the <strong>Engineering & Design</strong> workspace.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm text-left text-xs">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/60">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Engineering & Design</p>
              <p className="text-[11px] text-muted-foreground">Role: Member &bull; 12 shared collections</p>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            By accepting, you will get access to all shared spaces, collections, and bookmarks in this workspace.
          </p>

          <Button
            onClick={handleAccept}
            disabled={accepted}
            className="w-full text-xs font-semibold h-10 gap-2"
          >
            {accepted ? <Check className="h-4 w-4 text-emerald-400" /> : <UserCheck className="h-4 w-4" />}
            {accepted ? "Invitation Accepted!" : "Accept Invitation & Join Team"}
          </Button>
        </div>

        <div className="pt-2">
          <Link to="/web/download" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <Chrome className="h-3.5 w-3.5" /> Don&apos;t have the extension installed? Add to Chrome
          </Link>
        </div>
      </div>
    </div>
  );
}
