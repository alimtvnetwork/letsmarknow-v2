export function computeDeterministicXPath(element: Element | null): string {
  if (!element || element.nodeType !== 1) {
    return "";
  }

  const el = element as HTMLElement;

  const autoEl = el.hasAttribute("data-automation-id")
    ? el
    : el.closest<HTMLElement>("[data-automation-id]");

  if (autoEl) {
    const automationId = autoEl.getAttribute("data-automation-id");

    if (automationId) {
      return `//*[@data-automation-id="${automationId}"]`;
    }
  }

  const idEl =
    el.id && !el.id.startsWith("radix-") && !el.id.startsWith(":r")
      ? el
      : el.closest<HTMLElement>(
          "button[id]:not([id^='radix-']):not([id^=':r']), a[id]:not([id^='radix-']):not([id^=':r']), input[id]:not([id^='radix-']):not([id^=':r']), select[id]:not([id^='radix-']):not([id^=':r']), textarea[id]:not([id^='radix-']):not([id^=':r']), [id]:not([id^='radix-']):not([id^=':r'])",
        );

  if (idEl?.id && !idEl.id.startsWith("radix-") && !idEl.id.startsWith(":r")) {
    return `//*[@id="${idEl.id}"]`;
  }

  const tourEl = el.hasAttribute("data-tour")
    ? el
    : el.closest<HTMLElement>("[data-tour]");

  if (tourEl) {
    const tourAttr = tourEl.getAttribute("data-tour");

    if (tourAttr) {
      return `//*[@data-tour="${tourAttr}"]`;
    }
  }

  const testIdEl = el.hasAttribute("data-testid")
    ? el
    : el.closest<HTMLElement>("[data-testid]");

  if (testIdEl) {
    const testIdAttr = testIdEl.getAttribute("data-testid");

    if (testIdAttr) {
      return `//*[@data-testid="${testIdAttr}"]`;
    }
  }

  const paths: string[] = [];
  let current: Element | null = el;

  while (current && current.nodeType === 1 && current !== document.body) {
    let index = 1;
    let sibling = current.previousElementSibling;

    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index += 1;
      }

      sibling = sibling.previousElementSibling;
    }

    const tag = current.tagName.toLowerCase();
    paths.unshift(`${tag}[${index}]`);
    current = current.parentElement;
  }

  return `/html/body/${paths.join("/")}`;
}

export function computeElementXPath(element: Element | null): string {
  return computeDeterministicXPath(element);
}

export function resolveXPathStrategy(
  el: HTMLElement,
): "automation-id" | "id" | "tour" | "testid" | "structural" {
  if (el.hasAttribute("data-automation-id")) {
    return "automation-id";
  }

  if (el.id && !el.id.startsWith("radix-") && !el.id.startsWith(":r")) {
    return "id";
  }

  if (el.hasAttribute("data-tour")) {
    return "tour";
  }

  if (el.hasAttribute("data-testid")) {
    return "testid";
  }

  return "structural";
}
