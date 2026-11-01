import React, { useState } from "react";

interface RecorderNoteInputProps {
  onSave: (note: string) => void;
  onClose: () => void;
}

export function RecorderNoteInput({ onSave, onClose }: RecorderNoteInputProps): React.JSX.Element {
  const [text, setText] = useState("");

  const handleSave = () => {
    if (!text.trim()) {
      onClose();

      return;
    }

    onSave(text.trim());
    setText("");
    onClose();
  };

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-popover/95 p-1.5 shadow-xl">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder="What looks wrong here?"
        className="w-56 rounded bg-background border border-input px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="button"
        onClick={handleSave}
        className="rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Save
      </button>
    </div>
  );
}
