import { useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isValidUrl } from "@/lib/workspaceMutations";
import { COLOR_LABELS, type ColorLabel, type Collection, type Space } from "@/types/lmn";
import { colorLabelClasses } from "./helpers";

export interface WorkspaceFormValue {
  name: string;
  initials: string;
  plan: string;
}

export interface SpaceFormValue {
  name: string;
  description: string;
  accentClass: string;
}

export interface CollectionFormValue {
  name: string;
  note: string;
  color: ColorLabel;
}

export interface GroupFormValue {
  name: string;
}

export interface ItemFormValue {
  title: string;
  url: string;
  description: string;
  tags: string;
  color: ColorLabel;
  collectionId?: string;
  groupId?: string;
}

interface BaseDialogProps<T> {
  isOpen: boolean;
  mode: "create" | "edit";
  value: T;
  onValueChange: (value: T) => void;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}

export function WorkspaceDialog({
  isOpen,
  mode = "create",
  value,
  onValueChange,
  onOpenChange,
  onSubmit,
}: {
  isOpen: boolean;
  mode?: "create" | "edit";
  value: WorkspaceFormValue;
  onValueChange: (value: WorkspaceFormValue) => void;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit workspace" : "Create workspace"}</DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? "Update your workspace name and initials."
                : "Workspaces separate personal, team, and client saved-link systems."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <Field label="Name">
              <Input
                autoFocus
                placeholder="Product Team"
                value={value.name}
                onChange={(event) => onValueChange({ ...value, name: event.target.value })}
              />
            </Field>
            <Field label="Initials">
              <Input
                placeholder="PT"
                maxLength={3}
                value={value.initials}
                onChange={(event) => onValueChange({ ...value, initials: event.target.value.toUpperCase() })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "edit" ? "Save workspace" : "Create workspace"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SpaceDialog({
  isOpen,
  mode,
  value,
  onValueChange,
  onOpenChange,
  onSubmit,
}: BaseDialogProps<SpaceFormValue>) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create space" : "Edit space"}</DialogTitle>
            <DialogDescription>Spaces separate saved links by personal, team, or project context.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <Field label="Name">
              <Input
                autoFocus
                placeholder="Research"
                value={value.name}
                onChange={(event) => onValueChange({ ...value, name: event.target.value })}
              />
            </Field>
            <Field label="Description">
              <Textarea
                placeholder="What belongs in this space?"
                value={value.description}
                onChange={(event) => onValueChange({ ...value, description: event.target.value })}
              />
            </Field>
            <Field label="Accent">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={value.accentClass}
                onChange={(event) => onValueChange({ ...value, accentClass: event.target.value })}
              >
                <option value="bg-primary">Pink</option>
                <option value="bg-sky-500">Sky</option>
                <option value="bg-emerald-500">Emerald</option>
                <option value="bg-amber-500">Amber</option>
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create space" : "Save space"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CollectionDialog({
  isOpen,
  mode,
  value,
  onValueChange,
  onOpenChange,
  onSubmit,
}: BaseDialogProps<CollectionFormValue>) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create collection" : "Edit collection"}</DialogTitle>
            <DialogDescription>Collections hold groups and saved links inside the current space.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <Field label="Name">
              <Input
                autoFocus
                placeholder="Marketing research"
                value={value.name}
                onChange={(event) => onValueChange({ ...value, name: event.target.value })}
              />
            </Field>
            <Field label="Note">
              <Textarea
                placeholder="Short context for this collection"
                value={value.note}
                onChange={(event) => onValueChange({ ...value, note: event.target.value })}
              />
            </Field>
            <ColorField value={value.color} onChange={(color) => onValueChange({ ...value, color })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create collection" : "Save collection"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GroupDialog({
  isOpen,
  mode,
  value,
  onValueChange,
  onOpenChange,
  onSubmit,
}: BaseDialogProps<GroupFormValue>) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create group" : "Edit group"}</DialogTitle>
            <DialogDescription>Groups keep related links together inside a collection.</DialogDescription>
          </DialogHeader>
          <div className="py-5">
            <Field label="Name">
              <Input
                autoFocus
                placeholder="Inbox"
                value={value.name}
                onChange={(event) => onValueChange({ name: event.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create group" : "Save group"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ItemDialog({
  isOpen,
  mode,
  value,
  collections = [],
  isDisabled,
  onValueChange,
  onOpenChange,
  onSubmit,
}: BaseDialogProps<ItemFormValue> & {
  collections?: Collection[];
  isDisabled?: boolean;
}) {
  const isUrlEntered = value.url.trim().length > 0;
  const isUrlValid = !isUrlEntered || isValidUrl(value.url);
  const canSubmit = !isDisabled && value.title.trim().length > 0 && isUrlEntered && isUrlValid;

  const targetCollection = collections.find((c) => c.id === value.collectionId);
  const targetGroup = targetCollection?.groups.find((g) => g.id === value.groupId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? targetGroup
                  ? `Add item to ${targetGroup.name}`
                  : "Add item"
                : "Edit item"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create" && targetGroup
                ? `Adding saved link directly to ${targetCollection?.name ? `${targetCollection.name} → ` : ""}${targetGroup.name}.`
                : "Saved items can be links, docs, references, or pages from the extension later."}
            </DialogDescription>
          </DialogHeader>

          {mode === "create" && collections.length === 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500 dark:text-amber-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <Info className="h-4 w-4 shrink-0" />
                <span>A collection is required before adding items</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                In LetsMarkNow, saved items must belong to a collection and group. Please close this dialog and create a collection first. Once created, you will see a <strong>+</strong> button on each collection card and group header to add items directly!
              </p>
            </div>
          )}

          <div className="grid gap-4 py-5">
            <Field label="Title">
              <Input
                autoFocus
                placeholder="Readable title"
                value={value.title}
                onChange={(event) => onValueChange({ ...value, title: event.target.value })}
              />
            </Field>
            <Field label="URL">
              <Input
                placeholder="https://example.com"
                value={value.url}
                onChange={(event) => onValueChange({ ...value, url: event.target.value })}
              />
              {!isUrlValid && (
                <p className="text-xs text-destructive">
                  Please enter a valid URL starting with http:// or https://
                </p>
              )}
            </Field>
            <Field label="Description">
              <Textarea
                placeholder="Why is this useful?"
                value={value.description}
                onChange={(event) => onValueChange({ ...value, description: event.target.value })}
              />
            </Field>
            <Field label="Tags">
              <Input
                placeholder="design, research"
                value={value.tags}
                onChange={(event) => onValueChange({ ...value, tags: event.target.value })}
              />
            </Field>
            <ColorField value={value.color} onChange={(color) => onValueChange({ ...value, color })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {mode === "create" ? "Add item" : "Save item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MoveItemDialog({
  isOpen,
  collections,
  selectedTarget,
  onTargetChange,
  onOpenChange,
  onSubmit,
}: {
  isOpen: boolean;
  collections: Collection[];
  selectedTarget: string;
  onTargetChange: (target: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Move item</DialogTitle>
            <DialogDescription>Choose the collection and group where this item should live.</DialogDescription>
          </DialogHeader>
          <div className="py-5">
            <Field label="Destination">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedTarget}
                onChange={(event) => onTargetChange(event.target.value)}
              >
                {collections.flatMap((collection) =>
                  collection.groups.map((group) => (
                    <option key={`${collection.id}:${group.id}`} value={`${collection.id}:${group.id}`}>
                      {collection.name} / {group.name}
                    </option>
                  )),
                )}
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Move item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  actionLabel,
  onOpenChange,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel: string;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ColorField({ value, onChange }: { value: ColorLabel; onChange: (color: ColorLabel) => void }) {
  return (
    <Field label="Color">
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {COLOR_LABELS.map((color) => {
          const isSelected = value === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                "flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium capitalize transition",
                colorLabelClasses[color],
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-80 hover:opacity-100",
              )}
              title={color}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {color}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function InviteMemberDialog({
  isOpen,
  onOpenChange,
  onInvite,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onInvite: (email: string, role: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim(), role);
    setEmail("");
    setRole("Member");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>Send an invitation to collaborate in this workspace.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <Field label="Email address">
              <Input
                autoFocus
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Role">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Admin">Admin (can manage collections and members)</option>
                <option value="Member">Member (can add and edit links)</option>
                <option value="Viewer">Viewer (read-only access)</option>
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email.trim()}>
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
