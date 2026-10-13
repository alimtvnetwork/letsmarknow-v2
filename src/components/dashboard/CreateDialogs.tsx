import { FormEvent } from "react";

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

interface CreateCollectionDialogProps {
  isOpen: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}

export function CreateCollectionDialog({
  isOpen,
  name,
  onNameChange,
  onOpenChange,
  onSubmit,
}: CreateCollectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create collection</DialogTitle>
            <DialogDescription>Collections hold groups and saved links inside the current Space.</DialogDescription>
          </DialogHeader>
          <div className="py-5">
            <Input
              autoFocus
              placeholder="Marketing research"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create collection</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CreateItemDialogProps {
  isOpen: boolean;
  title: string;
  url: string;
  isDisabled: boolean;
  onTitleChange: (title: string) => void;
  onUrlChange: (url: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}

export function CreateItemDialog({
  isOpen,
  title,
  url,
  isDisabled,
  onTitleChange,
  onUrlChange,
  onOpenChange,
  onSubmit,
}: CreateItemDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add item</DialogTitle>
            <DialogDescription>
              This mock flow saves into the first visible collection so the UI can be tested now.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-5">
            <Input
              autoFocus
              placeholder="Readable title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
            />
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled}>
              Add item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
