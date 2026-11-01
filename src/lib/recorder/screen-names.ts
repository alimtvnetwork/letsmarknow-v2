/**
 * Canonical Screen Name Mapping & Route Breadcrumb Architecture
 * Single Source of Truth for human-readable screen names across telemetry, HUD, and prompt engines.
 */

/**
 * Canonical dictionary mapping all known application routes to human-readable Screen Names.
 * Strictly frozen and non-mutating.
 */
export const ROUTE_SCREEN_NAMES: Readonly<Record<string, string>> = Object.freeze({
  "/": "Home Hub",
  "/run": "Inspection Run Screen",
  "/projects": "Project Workspace",
  "/setup": "Inspection Setup",
  "/setup/rules": "Rule Setup Screen",
  "/setup/roi": "ROI Configuration",
  "/setup/reference": "Reference Alignment",
  "/settings": "System Settings",
  "/settings/camera": "Camera Configuration",
  "/settings/trigger": "Trigger Settings",
  "/settings/lighting": "Lighting Settings",
  "/settings/shortcuts": "Shortcuts & Hotkeys",
  "/settings/license": "Licensing Screen",
  "/results": "Inspection Results View",
  "/errors": "Error Tracking & Incidents",
  "/diagnostics": "System Diagnostics",
  "/ops": "Operations & Maintenance",
  "/ai-testing": "AI Test Bench",
  "/cli/sessions": "CLI Session Inspector",
  "/trial-run": "Trial Run Studio",
  "/analyze": "Inspection Analysis",
});

/**
 * Resolves any route pathname to an explicit, human-readable Screen Name.
 * Handles trailing slashes, query parameters, hashes, and dynamic route segments.
 *
 * @param routePath - Raw route path (e.g. "/setup/roi?preset=fast", "/projects/p-100")
 * @returns Standardized Screen Name (e.g. "ROI Configuration", "Projects P 100 Screen")
 */
export function resolveScreenName(routePath?: string | null): string {
  if (!routePath || routePath.trim() === "") {
    return "Home Hub";
  }

  // Strip query parameters (?foo=bar) and hash anchors (#section)
  const cleanPath = routePath.split("?")[0].split("#")[0].trim();
  const normalized = cleanPath.replace(/\/+$/, "") || "/";

  const hasKnownScreen = Boolean(ROUTE_SCREEN_NAMES[normalized]);

  if (hasKnownScreen) {
    return ROUTE_SCREEN_NAMES[normalized];
  }

  // Dynamic route fallback: e.g. /projects/demo-run-1 -> "Projects Demo Run 1 Screen"
  const segments = normalized
    .split("/")
    .filter(Boolean)
    .map((seg) =>
      seg
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" "),
    );

  const hasSegments = segments.length > 0;

  if (!hasSegments) {
    return "Home Hub";
  }

  const combined = segments.join(" ");
  const hasScreenSuffix = combined.toLowerCase().endsWith("screen");

  if (hasScreenSuffix) {
    return combined;
  }

  return `${combined} Screen`;
}

/**
 * Formats route history into rich, explicit human and machine navigation breadcrumbs.
 * Consecutive identical routes are deduplicated.
 *
 * @param routes - Array of visited routes (e.g. ["/", "/setup", "/setup", "/run"])
 * @returns Formatted breadcrumb string (e.g. "From Home Hub (`/`) ➔ Inspection Setup (`/setup`) ➔ Inspection Run Screen (`/run`)")
 */
export function formatScreenNavigationPath(
  routes?: readonly string[] | null,
): string {
  if (!routes || routes.length === 0) {
    return "From Home Hub (`/`)";
  }

  const validRoutes = routes.filter((r) => Boolean(r && r.trim()));
  const hasValidRoutes = validRoutes.length > 0;

  if (!hasValidRoutes) {
    return "From Home Hub (`/`)";
  }

  // Deduplicate consecutive identical transitions
  const uniqueTransitions = validRoutes.filter(
    (route, index, arr) => index === 0 || route !== arr[index - 1],
  );

  const formattedSegments = uniqueTransitions.map((r) => {
    const screen = resolveScreenName(r);
    const pathSlug = r.trim() || "/";

    return `${screen} (\`${pathSlug}\`)`;
  });

  return `From ${formattedSegments.join(" ➔ ")}`;
}
