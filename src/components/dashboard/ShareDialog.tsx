import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe2,
  Lock,
  Share2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  SharePermission,
  ShareSettings,
  ShareTargetType,
  ShareVisibility,
} from "@/types/lmn";
import { generateShareSlug, getSharePath, getShareUrl } from "@/lib/shareLinks";

export interface ShareSettingsFormValue {
  visibility: ShareVisibility;
  permission: SharePermission;
  publicSlug: string;
  expiresAt?: string;
  passwordEnabled?: boolean;
  password?: string;
  allowCopy?: boolean;
}

export interface ShareDialogProps {
  isOpen: boolean;
  targetType: ShareTargetType;
  targetId?: string;
  targetName: string;
  initialSettings?: ShareSettings;
  value?: ShareSettingsFormValue;
  onValueChange?: (value: ShareSettingsFormValue) => void;
  onOpenChange: (open: boolean) => void;
  onSave?: (settings: ShareSettings) => void;
  onDisable?: (targetType: ShareTargetType, targetId: string) => void;
  onDisableShare?: () => void;
  onCopyLink?: () => void;
  onPreview?: () => void;
}

const targetTypeLabels: Record<ShareTargetType, string> = {
  workspace: "Workspace",
  space: "Space",
  collection: "Collection",
  group: "Group",
  item: "Saved Item",
};

export function ShareDialog({
  isOpen,
  targetType,
  targetId,
  targetName,
  initialSettings,
  value,
  onValueChange,
  onOpenChange,
  onSave,
  onDisable,
  onDisableShare,
  onCopyLink,
  onPreview,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const defaultSlug = generateShareSlug(targetName, targetId || "share");

  const [internalValue, setInternalValue] = useState<ShareSettingsFormValue>(() => ({
    visibility: initialSettings?.visibility ?? "public",
    permission: initialSettings?.permission ?? "view",
    publicSlug: initialSettings?.publicSlug ?? defaultSlug,
    expiresAt: initialSettings?.expiresAt,
    passwordEnabled: initialSettings?.passwordEnabled ?? false,
    password: "",
    allowCopy: initialSettings?.allowCopy ?? true,
  }));

  useEffect(() => {
    if (initialSettings) {
      setInternalValue({
        visibility: initialSettings.visibility,
        permission: initialSettings.permission,
        publicSlug: initialSettings.publicSlug,
        expiresAt: initialSettings.expiresAt,
        passwordEnabled: initialSettings.passwordEnabled ?? false,
        password: "",
        allowCopy: initialSettings.allowCopy ?? true,
      });
    } else {
      setInternalValue({
        visibility: "public",
        permission: "view",
        publicSlug: generateShareSlug(targetName, targetId || "share"),
        passwordEnabled: false,
        password: "",
        allowCopy: true,
      });
    }
  }, [initialSettings, targetName, targetId, isOpen]);

  const effectiveValue = value ?? internalValue;

  const handleValueChange = (next: ShareSettingsFormValue) => {
    if (onValueChange) {
      onValueChange(next);
    } else {
      setInternalValue(next);
    }
  };

  const fullShareUrl = getShareUrl(targetType, effectiveValue.publicSlug);

  const handleCopy = () => {
    if (onCopyLink) {
      onCopyLink();
    } else {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(fullShareUrl).catch(() => {});
      }
      toast.success("Share link copied to clipboard");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else {
      const path = getSharePath(targetType, effectiveValue.publicSlug);
      window.open(path, "_blank", "noopener,noreferrer");
    }
  };

  const handleSave = () => {
    const updatedSettings: ShareSettings = {
      id: initialSettings?.id || `share-${Date.now()}`,
      targetType,
      targetId: targetId || initialSettings?.targetId || "",
      visibility: effectiveValue.visibility,
      permission: effectiveValue.permission,
      publicSlug: effectiveValue.publicSlug,
      expiresAt: effectiveValue.expiresAt,
      passwordEnabled: effectiveValue.passwordEnabled,
      allowCopy: effectiveValue.allowCopy,
      createdAt: initialSettings?.createdAt || new Date().toISOString(),
    };
    onSave?.(updatedSettings);
    onOpenChange(false);
  };

  const handleDisable = () => {
    if (onDisable) {
      onDisable(targetType, targetId || initialSettings?.targetId || "");
    }
    onDisableShare?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
              {targetTypeLabels[targetType]}
            </span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              {effectiveValue.publicSlug}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share "{targetName}"
          </DialogTitle>
          <DialogDescription className="text-xs">
            Generate and manage access links for this {targetType.toLowerCase()}. Control whether
            visitors can only view or clone saved bookmarks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* VISIBILITY SELECTOR */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Who can access
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleValueChange({ ...effectiveValue, visibility: "private" })}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition",
                  effectiveValue.visibility === "private"
                    ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Lock className="h-4 w-4 mb-1" />
                <span className="text-xs">Private</span>
              </button>

              <button
                type="button"
                onClick={() => handleValueChange({ ...effectiveValue, visibility: "public" })}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition",
                  effectiveValue.visibility === "public"
                    ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Globe2 className="h-4 w-4 mb-1" />
                <span className="text-xs">Public</span>
              </button>

              <button
                type="button"
                onClick={() => handleValueChange({ ...effectiveValue, visibility: "members" })}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition",
                  effectiveValue.visibility === "members"
                    ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Users className="h-4 w-4 mb-1" />
                <span className="text-xs">Members</span>
              </button>
            </div>
          </div>

          {/* PUBLIC LINK FIELD */}
          {effectiveValue.visibility !== "private" ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="share-slug" className="text-xs font-medium">
                  Public Share Link
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePreview}
                  className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Preview page
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  id="share-slug"
                  value={fullShareUrl}
                  readOnly
                  className="h-9 font-mono text-xs bg-background"
                />
                <Button
                  type="button"
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* PERMISSION SELECT */}
              <div className="grid gap-2 pt-1">
                <Label htmlFor="share-permission" className="text-xs text-muted-foreground">
                  Visitor Permission
                </Label>
                <select
                  id="share-permission"
                  value={effectiveValue.permission}
                  onChange={(e) =>
                    handleValueChange({
                      ...effectiveValue,
                      permission: e.target.value as SharePermission,
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="view">Can view only (Read-only)</option>
                  <option value="organize">Can organize and clone (Collaborator)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
              <Lock className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
              <p className="text-xs font-medium">This {targetType} is currently private</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Only you and assigned team members can view this content.
              </p>
            </div>
          )}

          {/* ADVANCED TOGGLES */}
          <div className="space-y-3 pt-1 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Allow copying & exporting</Label>
                <p className="text-[11px] text-muted-foreground">
                  Visitors can export or save bookmarks into their own accounts.
                </p>
              </div>
              <Switch
                checked={effectiveValue.allowCopy ?? true}
                onCheckedChange={(checked) =>
                  handleValueChange({ ...effectiveValue, allowCopy: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Password protection</Label>
                <p className="text-[11px] text-muted-foreground">
                  Require a passphrase before displaying saved links.
                </p>
              </div>
              <Switch
                checked={effectiveValue.passwordEnabled ?? false}
                onCheckedChange={(checked) =>
                  handleValueChange({ ...effectiveValue, passwordEnabled: checked })
                }
              />
            </div>

            {effectiveValue.passwordEnabled && (
              <div className="pt-1">
                <Input
                  type="password"
                  placeholder="Enter access passphrase"
                  value={effectiveValue.password || ""}
                  onChange={(e) =>
                    handleValueChange({ ...effectiveValue, password: e.target.value })
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-0 pt-2 border-t border-border">
          {effectiveValue.visibility !== "private" ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDisable}
              className="text-xs"
            >
              Disable Access
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
