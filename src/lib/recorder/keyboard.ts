/**
 * Keyboard-key predicates for the bug recorder.
 *
 * Replaces cat-my-v12's `@/types/ui/KeyboardKeyType` with a tiny local
 * equivalent so the ported recorder code compiles without the source repo's
 * UI type library.
 */
export function isEscape(key: string): boolean {
  return key === "Escape";
}

export function isEnterOrSpace(key: string): boolean {
  return key === "Enter" || key === " " || key === "Spacebar";
}

export function isArrowDown(key: string): boolean {
  return key === "ArrowDown";
}

export function isArrowUp(key: string): boolean {
  return key === "ArrowUp";
}

/** Drop-in namespace matching the old `KeyboardKeyType` usage. */
export const KeyboardKeyType = {
  isEscape,
  isEnterOrSpace,
  isArrowDown,
  isArrowUp,
};
