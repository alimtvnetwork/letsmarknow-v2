import { IssueCategoryType, type RecorderSession } from "./types";

export function generateSemanticSessionId(initialRoute: string, customSlug?: string): string {
  let screenSlug = "home-hub";

  if (customSlug && customSlug.trim()) {
    screenSlug = customSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 35);
  } else if (initialRoute) {
    const clean = initialRoute.replace(/^\/+|\/+$/g, "");

    if (!clean || clean === "/") {
      screenSlug = "home-hub";
    } else if (clean.includes("projects/")) {
      const match = clean.match(/projects\/([^/?#]+)/i);
      const prj = match ? match[1].replace(/^prj-/, "") : "project";
      screenSlug = `smt-${prj}`.slice(0, 35);
    } else {
      screenSlug = clean.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 35);
    }
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `session-${screenSlug}-${year}${month}${day}-${hour}${minute}`;
}

export function generateSemanticDefaultTitle(initialRoute: string): string {
  const clean = (initialRoute || "").replace(/^\/+|\/+$/g, "");

  if (!clean) {
    return "Home Hub Navigation & Workflow Defect";
  }

  if (clean.includes("projects/")) {
    const match = clean.match(/projects\/([^/?#]+)/i);
    const prj = match ? match[1].replace(/^prj-/, "").toUpperCase() : "SMT-74HC595";

    return `${prj} High-Speed Line Inspection Defects`;
  }

  if (clean.startsWith("run")) {
    return "Inspection Run Verification Defect";
  }

  if (clean.startsWith("setup")) {
    return "Camera & Optical Setup Defect";
  }

  if (clean.startsWith("rules")) {
    return "Inspection Rules Configuration Defect";
  }

  if (clean.startsWith("errors")) {
    return "Error Management & Logging Defect";
  }

  if (clean.startsWith("diagnostics")) {
    return "System Diagnostics & Telemetry Defect";
  }

  if (clean.startsWith("settings")) {
    return "System Settings Configuration Defect";
  }

  return "Industrial Vision Inspection Workflow Defect";
}

export function createEmptySession(initialRoute: string, customSlug?: string): RecorderSession {
  const startedAt = new Date().toISOString();
  const sessionId = generateSemanticSessionId(initialRoute, customSlug);

  return {
    id: sessionId,
    startedAt,
    durationMs: 0,
    events: [],
    screenshots: [],
    routeHistory: [initialRoute],
    initialRoute,
    finalRoute: initialRoute,
    errors: [],
    isHoverRecording: false,
    isHoverRecordEnabled: false,
  };
}
