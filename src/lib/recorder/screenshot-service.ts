import {
  FALLBACK_JPEG,
  drawRedLocatorRing,
  drawSnapshotBackground,
  drawSnapshotCanvasPreview,
  drawSnapshotElementInfo,
  drawSnapshotHeader,
  getVisibleCanvas,
} from "./snapshot-drawer";

export interface CaptureScreenshotOptions {
  title?: string;
  source?: "manual" | "step" | "canvas";
  targetElement?: HTMLElement | null;
  coordinates?: { x: number; y: number } | null;
  seqNumber?: number;
  isFullScreen?: boolean;
  quality?: number;
}

export interface ScreenshotResult {
  hasImage: boolean;
  dataUrl: string;
  fullScreenDataUrl: string;
  elementDataUrl: string;
  viewportDataUrl: string;
  title: string;
  width: number;
  height: number;
  seqNumber?: number;
}

function renderSyntheticSnapshot(
  targetElement: HTMLElement | null,
  title: string,
  quality = 0.6,
  sourceCanvas?: HTMLCanvasElement | null,
  coordinates?: { x: number; y: number } | null,
  seqNumber?: number,
): ScreenshotResult {
  if (typeof document === "undefined") {
    return {
      hasImage: true,
      dataUrl: FALLBACK_JPEG,
      fullScreenDataUrl: FALLBACK_JPEG,
      elementDataUrl: FALLBACK_JPEG,
      viewportDataUrl: FALLBACK_JPEG,
      title,
      width: 1,
      height: 1,
      seqNumber,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return {
      hasImage: true,
      dataUrl: FALLBACK_JPEG,
      fullScreenDataUrl: FALLBACK_JPEG,
      elementDataUrl: FALLBACK_JPEG,
      viewportDataUrl: FALLBACK_JPEG,
      title,
      width: 1024,
      height: 640,
      seqNumber,
    };
  }

  drawSnapshotBackground(ctx, canvas.width, canvas.height);
  drawSnapshotHeader(ctx, title, seqNumber);
  drawSnapshotElementInfo(ctx, targetElement, sourceCanvas ? 380 : 976);

  if (sourceCanvas) {
    drawSnapshotCanvasPreview(ctx, sourceCanvas);
  }

  if (coordinates) {
    const windowW = typeof window !== "undefined" ? window.innerWidth || 1024 : 1024;
    const windowH = typeof window !== "undefined" ? window.innerHeight || 640 : 640;
    const mappedX = Math.round(Math.max(20, Math.min(canvas.width - 20, (coordinates.x / windowW) * canvas.width)));
    const mappedY = Math.round(Math.max(40, Math.min(canvas.height - 20, (coordinates.y / windowH) * canvas.height)));

    drawRedLocatorRing(ctx, mappedX, mappedY);
  }

  const fullScreenDataUrl = canvas.toDataURL("image/jpeg", quality);
  const viewportDataUrl = sourceCanvas
    ? sourceCanvas.toDataURL("image/jpeg", quality)
    : fullScreenDataUrl;

  return {
    hasImage: true,
    dataUrl: fullScreenDataUrl,
    fullScreenDataUrl,
    elementDataUrl: fullScreenDataUrl,
    viewportDataUrl,
    title,
    width: canvas.width,
    height: canvas.height,
    seqNumber,
  };
}

function renderElementCropSnapshot(
  targetElement: HTMLElement | null,
  title: string,
  quality = 0.6,
  sourceCanvas?: HTMLCanvasElement | null,
): string {
  if (typeof document === "undefined") {
    return FALLBACK_JPEG;
  }

  const cropCanvas = document.createElement("canvas");
  const cropW = 480;
  const cropH = 320;
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const ctx = cropCanvas.getContext("2d");

  if (!ctx) {
    return FALLBACK_JPEG;
  }

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, cropW, cropH);

  const margin = 12;
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.strokeRect(margin, margin, cropW - margin * 2, cropH - margin * 2);

  if (sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
    try {
      const innerW = cropW - margin * 2 - 8;
      const innerH = cropH - margin * 2 - 36;
      ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, margin + 4, margin + 28, innerW, innerH);
    } catch {
      // Ignored for tainted canvas
    }
  } else if (targetElement) {
    ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
    ctx.fillRect(margin + 4, margin + 4, cropW - margin * 2 - 8, cropH - margin * 2 - 8);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 13px monospace";
    ctx.fillText("TARGET ELEMENT CROP (12px MARGIN)", margin + 14, margin + 28);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px monospace";
    const tag = targetElement.tagName.toLowerCase();
    const autoId = targetElement.getAttribute("data-automation-id") || "none";
    ctx.fillText(`Tag: <${tag}> | Automation ID: ${autoId}`, margin + 14, margin + 56);
    ctx.fillText(`Action: ${title.slice(0, 40)}`, margin + 14, margin + 80);
  }

  drawRedLocatorRing(ctx, cropW / 2, cropH / 2);

  return cropCanvas.toDataURL("image/jpeg", quality);
}

export function captureScreenSnapshot(options: CaptureScreenshotOptions = {}): ScreenshotResult {
  const title = options.title ?? "In-App Snapshot";
  const quality = typeof options.quality === "number" ? options.quality : 0.6;
  const canvas = getVisibleCanvas();

  let rawViewportDataUrl = "";

  if (canvas) {
    try {
      rawViewportDataUrl = canvas.toDataURL("image/jpeg", quality);
    } catch {
      rawViewportDataUrl = "";
    }
  }

  const syntheticResult = renderSyntheticSnapshot(
    options.targetElement ?? null,
    title,
    quality,
    canvas,
    options.coordinates ?? null,
    options.seqNumber,
  );

  const elementDataUrl = renderElementCropSnapshot(
    options.targetElement ?? null,
    title,
    quality,
    canvas,
  );

  const fullScreenDataUrl = syntheticResult.fullScreenDataUrl || syntheticResult.dataUrl;
  const finalViewportDataUrl = rawViewportDataUrl || syntheticResult.viewportDataUrl || fullScreenDataUrl;

  return {
    hasImage: true,
    dataUrl: fullScreenDataUrl,
    fullScreenDataUrl,
    elementDataUrl,
    viewportDataUrl: finalViewportDataUrl,
    title,
    width: syntheticResult.width,
    height: syntheticResult.height,
    seqNumber: options.seqNumber,
  };
}

export function captureDualSnapshots(options: CaptureScreenshotOptions = {}): ScreenshotResult {
  return captureScreenSnapshot(options);
}
