import {
  isInvalidLabel,
  resolveTier5LeafText,
  resolveTier6ButtonOrLinkText,
  resolveTier7ContainerHeader,
  resolveTier8RoleFallback,
  sanitizeText,
} from "./element-label-fallbacks";

export {
  isInvalidLabel,
  sanitizeText,
};

export function toTitleCase(input: string | null | undefined): string {
  if (!input) {
    return "";
  }

  return input
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatAutomationIdToTitle(id: string): string {
  const withoutSuffix = id.replace(/[-_](btn|button)$/i, "");
  const withoutPrefix = withoutSuffix.replace(/^(btn|button)[-_]/i, "");

  return toTitleCase(withoutPrefix || withoutSuffix || id);
}

function resolveTier1AutomationId(el: HTMLElement): string | null {
  const autoEl = el.hasAttribute("data-automation-id")
    ? el
    : el.closest<HTMLElement>("[data-automation-id]");

  if (autoEl) {
    const autoId = autoEl.getAttribute("data-automation-id");

    if (autoId) {
      const title = formatAutomationIdToTitle(autoId);

      if (!isInvalidLabel(title)) {
        return title;
      }
    }
  }

  const testEl = el.hasAttribute("data-testid")
    ? el
    : el.closest<HTMLElement>("[data-testid]");

  if (testEl) {
    const testId = testEl.getAttribute("data-testid");

    if (testId) {
      const title = formatAutomationIdToTitle(testId);

      if (!isInvalidLabel(title)) {
        return title;
      }
    }
  }

  return null;
}

function resolveTier2Aria(el: HTMLElement): string | null {
  const ariaLabel = sanitizeText(el.getAttribute("aria-label"));

  if (!isInvalidLabel(ariaLabel)) {
    return ariaLabel;
  }

  const ariaDesc = sanitizeText(el.getAttribute("aria-description"));

  if (!isInvalidLabel(ariaDesc)) {
    return ariaDesc;
  }

  const parentAria = el.closest<HTMLElement>("[aria-label]");

  if (parentAria && parentAria !== el) {
    const pAria = sanitizeText(parentAria.getAttribute("aria-label"));

    if (!isInvalidLabel(pAria)) {
      return pAria;
    }
  }

  return null;
}

function resolveTier3FormLabel(el: HTMLElement): string | null {
  if (typeof document !== "undefined" && el.id) {
    const labelEl = document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`);

    if (labelEl) {
      const labelText = sanitizeText(labelEl.textContent);

      if (!isInvalidLabel(labelText)) {
        return labelText.slice(0, 35);
      }
    }
  }

  const parentLabel = el.closest<HTMLLabelElement>("label");

  if (parentLabel && parentLabel !== el) {
    const text = sanitizeText(parentLabel.textContent);

    if (!isInvalidLabel(text)) {
      return text.slice(0, 35);
    }
  }

  const placeholder = el.getAttribute("placeholder");

  if (!isInvalidLabel(placeholder)) {
    return sanitizeText(placeholder).slice(0, 35);
  }

  return null;
}

function resolveTier4EntityAttributes(el: HTMLElement): string | null {
  const entityAttrs = ["data-entity-name", "data-rule-name", "data-tour"];

  for (const attr of entityAttrs) {
    const val = el.getAttribute(attr) || el.closest<HTMLElement>(`[${attr}]`)?.getAttribute(attr);

    if (val) {
      const title = toTitleCase(val.replace(/[-_]+/g, " "));

      if (!isInvalidLabel(title)) {
        return title;
      }
    }
  }

  return null;
}

export function resolveCleanElementLabel(el: HTMLElement | null): string {
  if (!el) {
    return "Element";
  }

  const tier1 = resolveTier1AutomationId(el);

  if (tier1) {
    return tier1;
  }

  const tier2 = resolveTier2Aria(el);

  if (tier2) {
    return tier2;
  }

  const tier3 = resolveTier3FormLabel(el);

  if (tier3) {
    return tier3;
  }

  const tier4 = resolveTier4EntityAttributes(el);

  if (tier4) {
    return tier4;
  }

  const tier5 = resolveTier5LeafText(el);

  if (tier5) {
    return tier5;
  }

  const tier6 = resolveTier6ButtonOrLinkText(el);

  if (tier6) {
    return tier6;
  }

  const tier7 = resolveTier7ContainerHeader(el);

  if (tier7) {
    return tier7;
  }

  return resolveTier8RoleFallback(el);
}
