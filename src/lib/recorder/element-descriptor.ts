import { resolveCleanElementLabel } from "./element-label-resolver";

export function isRecorderUiElement(target: HTMLElement | null): boolean {
  if (!target) {
    return false;
  }

  const isHud = Boolean(
    target.closest("[data-recorder-hud='true']") ||
    target.closest("[data-recorder-hud]"),
  );

  if (isHud) {
    return true;
  }

  const isModal = Boolean(
    target.closest("[data-recorder-modal='true']") ||
    target.closest("[data-recorder-modal]"),
  );

  if (isModal) {
    return true;
  }

  return false;
}

export function describeElement(el: HTMLElement): {
  targetComponent: string;
  selector: string;
  description: string;
} {
  const cleanLabel = resolveCleanElementLabel(el);
  const automationId = el.getAttribute("data-automation-id");
  const tour = el.getAttribute("data-tour");
  const testId = el.getAttribute("data-testid");
  const role = el.getAttribute("role");
  const tag = el.tagName.toLowerCase();

  const identifier = automationId
    ? `[data-automation-id='${automationId}']`
    : tour
      ? `[data-tour='${tour}']`
      : testId
        ? `[data-testid='${testId}']`
        : role
          ? `${tag}[role='${role}']`
          : tag;

  const targetComponent = cleanLabel ? `${cleanLabel} (${identifier})` : identifier;
  const description = cleanLabel ? `Clicked "${cleanLabel}"` : `Clicked ${identifier}`;

  return {
    targetComponent,
    selector: identifier,
    description,
  };
}
