export function sanitizeText(text: string | null | undefined): string {
  if (!text) {
    return "";
  }

  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function isInvalidLabel(text: string | null | undefined): boolean {
  if (!text) {
    return true;
  }

  const clean = text.trim();

  if (clean.length === 0) {
    return true;
  }

  if (/^\d+$/.test(clean)) {
    return true;
  }

  if (/^div\s+/i.test(clean) && clean.split(/\s+/).length > 2) {
    return true;
  }

  return false;
}

export function resolveTier5LeafText(el: HTMLElement): string | null {
  if (el.children.length > 0) {
    let directText = "";

    for (let i = 0; i < el.childNodes.length; i++) {
      const node = el.childNodes[i];

      if (node.nodeType === 3) {
        directText += ` ${node.textContent ?? ""}`;
      }
    }

    const sanitized = sanitizeText(directText);

    if (!isInvalidLabel(sanitized) && sanitized.length <= 40) {
      return sanitized;
    }

    return null;
  }

  const text = sanitizeText(el.textContent);

  if (!isInvalidLabel(text) && text.length <= 35) {
    return text;
  }

  return null;
}

export function resolveTier6ButtonOrLinkText(el: HTMLElement): string | null {
  const interactive =
    el.tagName === "BUTTON" || el.tagName === "A" || el.getAttribute("role") === "button"
      ? el
      : el.closest<HTMLElement>("button, a, [role='button']");

  if (interactive) {
    let cleanText = "";

    if (typeof interactive.cloneNode === "function") {
      try {
        const clone = interactive.cloneNode(true) as HTMLElement;
        clone
          .querySelectorAll(".badge, [data-badge], [aria-hidden='true'], svg, img")
          .forEach((n) => n.remove());
        cleanText = sanitizeText(clone.textContent);
      } catch {
        cleanText = sanitizeText(interactive.innerText || interactive.textContent);
      }
    } else {
      cleanText = sanitizeText(interactive.innerText || interactive.textContent);
    }

    if (!isInvalidLabel(cleanText)) {
      return cleanText.slice(0, 35);
    }
  }

  return null;
}

export function resolveTier7ContainerHeader(el: HTMLElement): string | null {
  const container = el.closest<HTMLElement>(
    "[data-card-title], [data-panel-title], [data-header], .card, [role='region'], [role='tabpanel']",
  );

  if (container) {
    const titleAttr =
      container.getAttribute("data-card-title") ||
      container.getAttribute("data-panel-title") ||
      container.getAttribute("data-header");

    if (titleAttr && !isInvalidLabel(titleAttr)) {
      return sanitizeText(titleAttr);
    }

    const headerEl = container.querySelector<HTMLElement>(
      "header, h1, h2, h3, h4, h5, h6, [data-slot='title']",
    );

    if (headerEl) {
      const text = sanitizeText(headerEl.textContent);

      if (!isInvalidLabel(text)) {
        return text.slice(0, 40);
      }
    }
  }

  return null;
}

export function resolveTier8RoleFallback(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute("role")?.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase();

  if (tag === "canvas" || el.closest("canvas")) {
    return "Workpiece Canvas";
  }

  if (tag === "input" && (type === "range" || role === "slider")) {
    return "Threshold Slider";
  }

  if (tag === "input" && (type === "checkbox" || role === "checkbox")) {
    return "Checkbox Option";
  }

  if (tag === "select" || role === "combobox" || role === "listbox") {
    return "Selection Dropdown";
  }

  if (tag === "button" || role === "button") {
    const text = sanitizeText(el.textContent).toLowerCase();

    if (text.includes("save")) {
      return "Save Button";
    }

    if (text.includes("cancel")) {
      return "Cancel Button";
    }

    if (text.includes("run") || text.includes("start")) {
      return "Start Run Button";
    }

    return "Action Button";
  }

  if (tag === "a" || role === "link") {
    return "Navigation Link";
  }

  if (tag === "input" || tag === "textarea") {
    return "Input Field";
  }

  return "Workpiece Canvas";
}
