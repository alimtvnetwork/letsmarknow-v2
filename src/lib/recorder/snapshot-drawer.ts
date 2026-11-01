export const FALLBACK_JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

export function getVisibleCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const canvases = Array.from(document.querySelectorAll("canvas"));
  const visible = canvases.find((c) => {
    const rect = c.getBoundingClientRect();

    return rect.width > 20 && rect.height > 20;
  });

  return visible ?? null;
}

export function drawSnapshotBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = "#0c1017";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, width - 20, height - 20);
}

export function drawSnapshotHeader(
  ctx: CanvasRenderingContext2D,
  title: string,
  seqNumber?: number,
): void {
  ctx.fillStyle = "#22d3ee";
  ctx.font = "bold 16px monospace";
  const prefix = typeof seqNumber === "number" ? `#${String(seqNumber).padStart(2, "0")} ` : "";
  ctx.fillText(`LetsMarkNow BUG SNAPSHOT ${prefix}`, 24, 38);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px sans-serif";
  ctx.fillText(`Action: ${title}`, 24, 64);

  const route = typeof window !== "undefined" ? window.location.pathname : "/";
  ctx.fillText(`Route: ${route} | Time: ${new Date().toLocaleTimeString()}`, 24, 86);
}

export function drawSnapshotElementInfo(
  ctx: CanvasRenderingContext2D,
  targetElement: HTMLElement | null,
  width = 380,
): void {
  ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
  ctx.fillRect(24, 110, width, 480);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.strokeRect(24, 110, width, 480);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "14px monospace";

  if (!targetElement) {
    ctx.fillText("In-App View / Canvas Active State", 40, 150);

    return;
  }

  const tag = targetElement.tagName.toLowerCase();
  const text = targetElement.innerText?.slice(0, 50) ?? "";
  const tour = targetElement.getAttribute("data-tour") ?? "none";
  const rawClass =
    typeof targetElement.className === "string"
      ? targetElement.className
      : typeof (targetElement.className as any)?.baseVal === "string"
        ? (targetElement.className as any).baseVal
        : String(targetElement.className ?? "");

  ctx.fillText(`Element: <${tag}>`, 40, 150);
  ctx.fillText(`Text: "${text}"`, 40, 180);
  ctx.fillText(`data-tour: ${tour}`, 40, 210);
  ctx.fillText(`CSS Class: ${rawClass.slice(0, 36)}`, 40, 240);
}

export function drawSnapshotCanvasPreview(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
): void {
  try {
    if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(430, 110, 560, 480);

      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
      ctx.strokeRect(430, 110, 560, 480);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 12px monospace";
      ctx.fillText("INSPECTION CANVAS VIEWPORT", 445, 135);

      const maxWidth = 530;
      const maxHeight = 430;
      const scale = Math.min(maxWidth / sourceCanvas.width, maxHeight / sourceCanvas.height);
      const drawWidth = sourceCanvas.width * scale;
      const drawHeight = sourceCanvas.height * scale;
      const drawX = 445 + (maxWidth - drawWidth) / 2;
      const drawY = 150 + (maxHeight - drawHeight) / 2;

      ctx.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);
    }
  } catch {
    // Security or tainted canvas
  }
}

export function drawRedLocatorRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
