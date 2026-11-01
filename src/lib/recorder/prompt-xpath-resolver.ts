import type { RecorderEvent } from "./types";

export function isDynamicId(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }

  const cleanId = id.startsWith("#") ? id.slice(1) : id;
  const dynamicPattern = /^(radix-|_radix|:r|headlessui-|[0-9a-f]{8}-[0-9a-f]{4}-)/i;

  return dynamicPattern.test(cleanId) || cleanId.includes(":r");
}

function isDynamicXPath(xpath: string): boolean {
  return /(@id=['"](radix-|:r|headlessui-)|id\(["'](radix-|:r))/i.test(xpath);
}

function isValidXPath(xpath: string | undefined): boolean {
  if (!xpath || typeof xpath !== "string") {
    return false;
  }

  const trimmed = xpath.trim();

  return trimmed.startsWith("/") || trimmed.startsWith("//");
}

export function resolveEventXPath(evt: RecorderEvent): string {
  if (evt.telemetry?.xpath && isValidXPath(evt.telemetry.xpath) && !isDynamicXPath(evt.telemetry.xpath)) {
    return evt.telemetry.xpath.trim();
  }

  if (evt.xpath && isValidXPath(evt.xpath) && !isDynamicXPath(evt.xpath)) {
    return evt.xpath.trim();
  }

  if (
    typeof evt.details?.xpath === "string" &&
    isValidXPath(evt.details.xpath) &&
    !isDynamicXPath(evt.details.xpath)
  ) {
    return evt.details.xpath.trim();
  }

  if (evt.uiTelemetry?.xpath && isValidXPath(evt.uiTelemetry.xpath) && !isDynamicXPath(evt.uiTelemetry.xpath)) {
    return evt.uiTelemetry.xpath.trim();
  }

  const autoIdMatch =
    (typeof evt.details?.automationId === "string" && evt.details.automationId) ||
    evt.targetComponent?.match(/\[data-automation-id=['"]([^'"]+)['"]\]/)?.[1] ||
    evt.selector?.match(/\[data-automation-id=['"]([^'"]+)['"]\]/)?.[1];

  if (autoIdMatch) {
    return `//*[@data-automation-id='${autoIdMatch}']`;
  }

  const testIdMatch =
    evt.targetComponent?.match(/\[data-testid=['"]([^'"]+)['"]\]/)?.[1] ||
    evt.selector?.match(/\[data-testid=['"]([^'"]+)['"]\]/)?.[1];

  if (testIdMatch) {
    return `//*[@data-testid='${testIdMatch}']`;
  }

  const tourIdMatch =
    evt.targetComponent?.match(/\[data-tour=['"]([^'"]+)['"]\]/)?.[1] ||
    evt.selector?.match(/\[data-tour=['"]([^'"]+)['"]\]/)?.[1];

  if (tourIdMatch) {
    return `//*[@data-tour='${tourIdMatch}']`;
  }

  if (evt.selector && evt.selector !== "unknown" && evt.selector !== "system") {
    if (evt.selector.startsWith("#")) {
      const isDynamic = isDynamicId(evt.selector);

      if (!isDynamic) {
        return `//*[@id='${evt.selector.slice(1)}']`;
      }
    } else {
      if (evt.selector.startsWith("//") || evt.selector.startsWith("/")) {
        return evt.selector;
      }

      const isDynamic = isDynamicId(evt.selector);

      if (!isDynamic) {
        return `//${evt.selector.replace(/\[/g, "[@")}`;
      }
    }
  }

  return "//*[@data-automation-id='unresolved-target']";
}
