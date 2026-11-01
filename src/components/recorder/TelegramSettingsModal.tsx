import React, { useState, useEffect } from "react";
import { Send, X, CheckCircle2, AlertCircle, Loader2, Key, MessageSquare } from "lucide-react";
import {
  loadTelegramConfig,
  saveTelegramConfig,
  testTelegramConnection,
  type TelegramConfig,
} from "@/lib/recorder/telegram-service";

export interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelegramSettingsModal({ isOpen, onClose }: TelegramSettingsModalProps): React.JSX.Element | null {
  const [config, setConfig] = useState<TelegramConfig>({ botToken: "", chatId: "", isEnabled: true });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ isSuccess: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(loadTelegramConfig());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testTelegramConnection(config.botToken);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveTelegramConfig(config);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-recorder-modal="true"
      className="fixed inset-0 z-[10075] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 shadow-xl text-foreground animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Send className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground">Telegram Integration Settings</h3>
              <p className="text-[11px] text-muted-foreground">Directly dispatch bug reports to your Telegram chat</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="my-4 space-y-3.5 text-xs">
          <div>
            <label className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <Key className="h-3.5 w-3.5 text-primary" />
              <span>Bot API Token</span>
            </label>

            <input
              type="password"
              placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={config.botToken}
              onChange={(e) => setConfig((prev) => ({ ...prev, botToken: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />

            <span className="mt-1 block text-[10px] text-muted-foreground">
              Obtain this token from @BotFather on Telegram.
            </span>
          </div>

          <div>
            <label className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Target Chat ID</span>
            </label>

            <input
              type="text"
              placeholder="e.g. -100123456789 or 987654321"
              value={config.chatId}
              onChange={(e) => setConfig((prev) => ({ ...prev, chatId: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />

            <span className="mt-1 block text-[10px] text-muted-foreground">
              Personal or group chat ID to receive notifications.
            </span>
          </div>

          {testResult ? (
            <div
              className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                testResult.isSuccess
                  ? "border border-primary/30 bg-primary/10 text-primary"
                  : "border border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {testResult.isSuccess ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="leading-tight">{testResult.message}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <button
            type="button"
            disabled={isTesting || !config.botToken.trim()}
            onClick={handleTest}
            className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
