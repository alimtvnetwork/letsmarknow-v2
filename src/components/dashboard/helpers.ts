import type { Collection, ColorLabel } from "@/types/lmn";

export const colorLabelClasses: Record<ColorLabel, string> = {
  none: "bg-muted text-muted-foreground border-border",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  yellow: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  teal: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  blue: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  purple: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  pink: "bg-primary/15 text-primary border-primary/30",
};

export const colorDotClasses: Record<ColorLabel, string> = {
  none: "bg-muted-foreground/40",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-emerald-500",
  teal: "bg-teal-500",
  blue: "bg-sky-500",
  purple: "bg-violet-500",
  pink: "bg-primary",
};

export const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
};

export const getHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "saved link";
  }
};

export const getFaviconUrl = (url: string) => {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return "";
  }
};

export const countActiveItems = (collections: Collection[]) =>
  collections.reduce(
    (total, collection) =>
      total +
      collection.groups.reduce(
        (groupTotal, group) => groupTotal + group.items.filter((item) => !item.isDeleted).length,
        0,
      ),
    0,
  );

export const getCollectionSearchText = (collection: Collection) =>
  [
    collection.name,
    collection.note,
    ...collection.groups.flatMap((group) => [
      group.name,
      ...group.items.flatMap((item) => [item.title, item.url, item.description, ...item.tags]),
    ]),
  ]
    .join(" ")
    .toLowerCase();

export interface DomainBadgeStyle {
  bg: string;
  text: string;
  border: string;
}

export function getDomainBadgeStyle(host: string): DomainBadgeStyle {
  const h = host.toLowerCase();
  if (h.includes("github")) {
    return { bg: "bg-slate-800/80", text: "text-slate-200", border: "border-slate-700/80" };
  }
  if (h.includes("figma")) {
    return { bg: "bg-purple-950/60", text: "text-purple-300", border: "border-purple-800/60" };
  }
  if (h.includes("linear")) {
    return { bg: "bg-indigo-950/60", text: "text-indigo-300", border: "border-indigo-800/60" };
  }
  if (h.includes("youtube") || h.includes("youtu.be")) {
    return { bg: "bg-rose-950/60", text: "text-rose-300", border: "border-rose-800/60" };
  }
  if (h.includes("google") || h.includes("notion")) {
    return { bg: "bg-sky-950/60", text: "text-sky-300", border: "border-sky-800/60" };
  }
  if (h.includes("twitter") || h.includes("x.com")) {
    return { bg: "bg-zinc-800/80", text: "text-zinc-200", border: "border-zinc-700/80" };
  }
  if (h.includes("tailwindcss") || h.includes("tailwind")) {
    return { bg: "bg-cyan-950/60", text: "text-cyan-300", border: "border-cyan-800/60" };
  }
  return { bg: "bg-muted/70", text: "text-muted-foreground", border: "border-border/60" };
}

