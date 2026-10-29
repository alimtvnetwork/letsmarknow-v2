export type ExtensionTabRoute = "dashboard" | "open-tabs" | "trash" | "workspace" | "settings";

/**
 * Returns the path or relative URL to the full extension tab page with optional view query.
 */
export function getExtensionTabUrl(page?: ExtensionTabRoute): string {
  if (!page || page === "dashboard") {
    return "app.html";
  }
  return `app.html?page=${page}`;
}

/**
 * Returns the path to the options page.
 */
export function getOptionsPageUrl(): string {
  return "options.html";
}

/**
 * Returns the path to the popup page.
 */
export function getPopupPageUrl(): string {
  return "popup.html";
}

/**
 * Extracts the active sub-page route from query parameters.
 */
export function parseExtensionTabRoute(searchString: string): ExtensionTabRoute {
  try {
    const params = new URLSearchParams(searchString);
    const page = params.get("page");
    if (page === "open-tabs" || page === "trash" || page === "workspace" || page === "settings") {
      return page;
    }
  } catch {
    // fallback
  }
  return "dashboard";
}
