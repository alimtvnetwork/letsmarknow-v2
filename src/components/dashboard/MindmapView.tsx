import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  RotateCcw,
  Download,
  Folder,
  Layers,
  Globe,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Collection, Group, SavedItem } from "@/types/lmn";
import {
  fetchBackendMindmapLayouts,
  fetchBackendMindmapLayout,
  createBackendMindmapLayout,
  type BackendMindmapLayoutSummary,
  type BackendMindmapNode,
  type BackendMindmapEdge,
} from "@/lib/workspaceApiClient";

export interface MindmapViewProps {
  collection: Collection;
  groups: Group[];
  items: SavedItem[];
  onItemClick?: (item: SavedItem) => void;
  className?: string;
}

export interface CanvasNode {
  id: string;
  kind: "collection" | "group" | "item" | "tag";
  ref_id?: string;
  label: string;
  sublabel?: string;
  url?: string;
  color?: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  radius: number;
  parentId?: string;
}

export interface CanvasEdge {
  from: string;
  to: string;
  kind: string;
  label?: string;
}

/**
 * Pure auto-layout generator placing groups and items radially around the center collection node.
 */
export function computeAutoLayout(
  collection: Collection,
  groups: Group[],
  items: SavedItem[]
): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const newNodes: CanvasNode[] = [];
  const newEdges: CanvasEdge[] = [];

  // Center Node: Collection
  const centerNode: CanvasNode = {
    id: `col-${collection.id}`,
    kind: "collection",
    ref_id: collection.id,
    label: collection.name,
    sublabel: `${items.length} items`,
    color: collection.color !== "none" ? collection.color : "#6366f1",
    x: 0,
    y: 0,
    radius: 42,
  };
  newNodes.push(centerNode);

  // Orbit 1: Groups (radius = 200)
  // Suppress default placeholder "Inbox" or empty groups so collections display cleanly as Collection -> Items
  const isSingleDefaultInbox =
    groups.length === 1 &&
    (groups[0].name.trim().toLowerCase() === "inbox" ||
      groups[0].name.trim().toLowerCase() === "default");

  const validGroups = isSingleDefaultInbox
    ? []
    : groups.filter((grp) => {
        if (grp.name.trim().toLowerCase() === "inbox") {
          const count = items.filter(
            (item) =>
              (item as any).groupId === grp.id || (item as any).group_id === grp.id
          ).length;
          return count > 0;
        }
        return true;
      });

  const groupCount = Math.max(validGroups.length, 1);
  const groupAngleStep = (2 * Math.PI) / groupCount;
  const groupRadius = 200;

  const groupPosMap = new Map<string, { x: number; y: number }>();

  validGroups.forEach((grp, idx) => {
    const angle = idx * groupAngleStep;
    const gx = Math.round(Math.cos(angle) * groupRadius);
    const gy = Math.round(Math.sin(angle) * groupRadius);
    groupPosMap.set(grp.id, { x: gx, y: gy });

    const gNode: CanvasNode = {
      id: `grp-${grp.id}`,
      kind: "group",
      ref_id: grp.id,
      label: grp.name,
      color: grp.color !== "none" ? grp.color : "#3b82f6",
      x: gx,
      y: gy,
      radius: 32,
      parentId: centerNode.id,
    };
    newNodes.push(gNode);

    newEdges.push({
      from: centerNode.id,
      to: gNode.id,
      kind: "collection-group",
    });
  });

  // Orbit 2: Items attached to Groups or Collection
  items.forEach((item, idx) => {
    const parentGroupId = (item as any).groupId || (item as any).group_id;
    let parentPos = { x: 0, y: 0 };
    let parentId = centerNode.id;

    if (parentGroupId && groupPosMap.has(parentGroupId)) {
      parentPos = groupPosMap.get(parentGroupId)!;
      parentId = `grp-${parentGroupId}`;
    }

    // Spread items around their parent
    const itemAngle = idx * 0.9 + (parentPos.x !== 0 ? Math.atan2(parentPos.y, parentPos.x) : 0);
    const itemDist = 130 + (idx % 3) * 35;
    const ix = Math.round(parentPos.x + Math.cos(itemAngle) * itemDist);
    const iy = Math.round(parentPos.y + Math.sin(itemAngle) * itemDist);

    const iNode: CanvasNode = {
      id: `item-${item.id}`,
      kind: "item",
      ref_id: item.id,
      label: item.title,
      url: item.url,
      color: item.color !== "none" ? item.color : undefined,
      x: ix,
      y: iy,
      radius: 22,
      parentId,
    };
    newNodes.push(iNode);

    newEdges.push({
      from: parentId,
      to: iNode.id,
      kind: "group-item",
    });
  });

  return { nodes: newNodes, edges: newEdges };
}

export const MindmapView: React.FC<MindmapViewProps> = ({
  collection,
  groups,
  items,
  onItemClick,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep stable refs to avoid resetting layout when parent re-renders
  const collectionRef = useRef(collection);
  collectionRef.current = collection;
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Viewport transformation
  const [viewport, setViewport] = useState({ x: 400, y: 300, zoom: 1.0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, vpX: 0, vpY: 0 });

  // Nodes & Edges state
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef({
    startX: 0,
    startY: 0,
    nodeX: 0,
    nodeY: 0,
    nodeId: "",
    moved: false,
  });

  // Saved layouts state
  const [layouts, setLayouts] = useState<BackendMindmapLayoutSummary[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<string>("Auto Layout");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [isDefaultLayout, setIsDefaultLayout] = useState(false);
  const [isSharedWithOrg, setIsSharedWithOrg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initial center alignment based on container size
  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      if (width > 0 && height > 0) {
        setViewport((v) => ({ ...v, x: Math.round(width / 2), y: Math.round(height / 2) }));
      }
    }
  }, []);

  // Quick node map for O(1) edge lookups
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Load backend layout by ID
  const loadLayoutById = useCallback(async (id: string) => {
    try {
      const full = await fetchBackendMindmapLayout(id);
      setCurrentLayoutId(full.id);
      setCurrentLayoutName(full.name);

      if (full.viewport) {
        setViewport(full.viewport);
      }

      if (full.nodes && full.nodes.length > 0) {
        const mappedNodes: CanvasNode[] = full.nodes.map((n) => {
          let label = n.kind;
          let sublabel: string | undefined;
          let url: string | undefined;

          if (n.kind === "collection") {
            label = collectionRef.current.name;
          } else if (n.kind === "group") {
            const g = groupsRef.current.find((grp) => grp.id === n.ref_id);
            if (g) label = g.name;
          } else if (n.kind === "item") {
            const it = itemsRef.current.find((item) => item.id === n.ref_id);
            if (it) {
              label = it.title;
              url = it.url;
            }
          }

          return {
            id: n.id,
            kind: n.kind as any,
            ref_id: n.ref_id,
            label,
            sublabel,
            url,
            color: n.color || undefined,
            x: n.x,
            y: n.y,
            radius: n.kind === "collection" ? 42 : n.kind === "group" ? 32 : 22,
          };
        });

        setNodes(mappedNodes);
        setEdges(full.edges || []);
      }
      toast.success(`Loaded "${full.name}" layout`);
    } catch (err: any) {
      toast.error("Failed to load layout: " + (err.message || "Unknown error"));
    }
  }, []);

  // Reset to auto layout on demand
  const handleResetAutoLayout = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = computeAutoLayout(
      collectionRef.current,
      groupsRef.current,
      itemsRef.current
    );
    setNodes(newNodes);
    setEdges(newEdges);
    setCurrentLayoutName("Auto Layout");
    setCurrentLayoutId(null);
  }, []);

  // Load layouts only when collection.id changes (NOT on every parent re-render)
  useEffect(() => {
    let isMounted = true;
    async function loadLayouts() {
      try {
        const summaries = await fetchBackendMindmapLayouts({
          scope_type: "collection",
          scope_id: collection.id,
          include_shared: true,
        });
        if (!isMounted) return;
        setLayouts(summaries);
        const defaultLayout = summaries.find((l) => l.is_default);
        if (defaultLayout) {
          await loadLayoutById(defaultLayout.id);
        } else {
          const { nodes: newNodes, edges: newEdges } = computeAutoLayout(
            collectionRef.current,
            groupsRef.current,
            itemsRef.current
          );
          setNodes(newNodes);
          setEdges(newEdges);
          setCurrentLayoutName("Auto Layout");
          setCurrentLayoutId(null);
        }
      } catch {
        if (!isMounted) return;
        const { nodes: newNodes, edges: newEdges } = computeAutoLayout(
          collectionRef.current,
          groupsRef.current,
          itemsRef.current
        );
        setNodes(newNodes);
        setEdges(newEdges);
        setCurrentLayoutName("Auto Layout");
        setCurrentLayoutId(null);
      }
    }
    loadLayouts();
    return () => {
      isMounted = false;
    };
  }, [collection.id, loadLayoutById]);

  // Synchronize item and group label updates without wiping user-positioned (x, y) coordinates
  useEffect(() => {
    setNodes((prevNodes) => {
      if (prevNodes.length === 0) return prevNodes;
      let hasChanges = false;
      const updated = prevNodes.map((n) => {
        if (n.kind === "collection" && n.label !== collection.name) {
          hasChanges = true;
          return { ...n, label: collection.name };
        }
        if (n.kind === "group") {
          const g = groups.find((grp) => grp.id === n.ref_id);
          if (g && (n.label !== g.name || (g.color !== "none" && n.color !== g.color))) {
            hasChanges = true;
            return { ...n, label: g.name, color: g.color !== "none" ? g.color : n.color };
          }
        }
        if (n.kind === "item") {
          const it = items.find((item) => item.id === n.ref_id);
          if (it && (n.label !== it.title || n.url !== it.url)) {
            hasChanges = true;
            return { ...n, label: it.title, url: it.url };
          }
        }
        return n;
      });
      return hasChanges ? updated : prevNodes;
    });
  }, [collection.name, groups, items]);

  // Process pointer movement for pan and node drag
  const processPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (isPanning) {
        const dx = clientX - panStartRef.current.startX;
        const dy = clientY - panStartRef.current.startY;
        setViewport((v) => ({
          ...v,
          x: panStartRef.current.vpX + dx,
          y: panStartRef.current.vpY + dy,
        }));
      } else {
        const activeNodeId = dragStartRef.current.nodeId || draggingNodeId;
        if (!activeNodeId) return;

        const dx = (clientX - dragStartRef.current.startX) / viewport.zoom;
        const dy = (clientY - dragStartRef.current.startY) / viewport.zoom;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          dragStartRef.current.moved = true;
        }
        setNodes((prev) =>
          prev.map((n) =>
            n.id === activeNodeId
              ? {
                  ...n,
                  x: Math.round(dragStartRef.current.nodeX + dx),
                  y: Math.round(dragStartRef.current.nodeY + dy),
                }
              : n
          )
        );
      }
    },
    [isPanning, draggingNodeId, viewport.zoom]
  );

  const processPointerUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
    dragStartRef.current.nodeId = "";
  }, []);

  // Global pointer tracking during active drag or pan (handles movement outside container)
  useEffect(() => {
    if (!isPanning && !draggingNodeId) return;

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      processPointerMove(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      processPointerUp();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [isPanning, draggingNodeId, processPointerMove, processPointerUp]);

  // Non-passive wheel listener for trackpad pan and pinch/ctrl-wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = -e.deltaY * 0.002;
        setViewport((prev) => {
          const newZoom = Math.min(Math.max(prev.zoom * (1 + zoomDelta), 0.25), 3.0);
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const newX = mouseX - ((mouseX - prev.x) * newZoom) / prev.zoom;
          const newY = mouseY - ((mouseY - prev.y) * newZoom) / prev.zoom;
          return { x: newX, y: newY, zoom: newZoom };
        });
      } else {
        setViewport((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Zoom button handlers
  const handleZoomIn = () => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.2, 3.0) }));
  const handleZoomOut = () => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom / 1.2, 0.3) }));
  const handleResetZoom = () => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    setViewport({ x: Math.round(width / 2), y: Math.round(height / 2), zoom: 1.0 });
  };

  // Canvas background pointer down (pan trigger)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement | SVGElement;
    if (
      target.id === "canvas-bg" ||
      target.tagName === "svg" ||
      (target.tagName === "rect" && target.getAttribute("fill")?.includes("obsidian-mindmap-grid"))
    ) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX ?? 0,
        startY: e.clientY ?? 0,
        vpX: viewport.x,
        vpY: viewport.y,
      };
    }
  };

  // Node pointer down (drag trigger)
  const handleNodePointerDown = (e: React.PointerEvent, node: CanvasNode) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingNodeId(node.id);
    dragStartRef.current = {
      startX: e.clientX ?? 0,
      startY: e.clientY ?? 0,
      nodeX: node.x,
      nodeY: node.y,
      nodeId: node.id,
      moved: false,
    };
  };

  // Node click: only trigger navigation if it wasn't a drag gesture
  const handleNodeClick = (node: CanvasNode) => {
    if (dragStartRef.current.moved) {
      dragStartRef.current.moved = false;
      return;
    }
    if (node.kind === "item" && onItemClick) {
      const item = itemsRef.current.find((it) => it.id === node.ref_id);
      if (item) onItemClick(item);
    }
  };

  // Save current view
  const handleSaveCurrentView = async () => {
    if (!newLayoutName.trim()) {
      toast.error("Please enter a layout name");
      return;
    }

    setIsSaving(true);
    try {
      const backendNodes: BackendMindmapNode[] = nodes.map((n) => ({
        id: n.id,
        kind: n.kind,
        ref_id: n.ref_id,
        x: Math.round(n.x),
        y: Math.round(n.y),
        color: n.color || null,
      }));

      const backendEdges: BackendMindmapEdge[] = edges.map((e) => ({
        from: e.from,
        to: e.to,
        kind: e.kind,
        label: e.label,
      }));

      const created = await createBackendMindmapLayout({
        name: newLayoutName.trim(),
        scope_type: "collection",
        scope_id: collection.id,
        is_default: isDefaultLayout,
        shared_with_org: isSharedWithOrg,
        viewport,
        nodes: backendNodes,
        edges: backendEdges,
      });

      setCurrentLayoutId(created.id);
      setCurrentLayoutName(created.name);
      setLayouts((prev) => [
        {
          id: created.id,
          name: created.name,
          scope_type: created.scope_type,
          scope_id: created.scope_id,
          is_default: created.is_default,
          node_count: created.nodes.length,
          created_by_account_id: created.created_by_account_id,
          shared_with_org: created.shared_with_org,
          created_at: created.created_at,
          updated_at: created.updated_at,
        },
        ...prev.map((l) => (isDefaultLayout ? { ...l, is_default: false } : l)),
      ]);

      setIsSaveDialogOpen(false);
      setNewLayoutName("");
      toast.success(`Saved layout "${created.name}"`);
    } catch (err: any) {
      toast.error("Failed to save layout: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const exportData = {
      version: "1",
      exported_at: new Date().toISOString(),
      scope: { type: "collection", id: collection.id, name: collection.name },
      viewport,
      nodes: nodes.map((n) => ({
        id: n.id,
        kind: n.kind,
        label: n.label,
        x: n.x,
        y: n.y,
        color: n.color,
      })),
      edges,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindmap-${collection.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported Mindmap layout JSON");
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[650px] overflow-hidden rounded-xl border border-border/80 bg-background/95 select-none touch-none ${className}`}
      onPointerMove={(e) => {
        if (isPanning || dragStartRef.current.nodeId || draggingNodeId) {
          processPointerMove(e.clientX, e.clientY);
        }
      }}
      onPointerUp={processPointerUp}
    >
      {/* Canvas Top Bar HUD */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Saved Views Picker */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 sm:px-3 gap-1.5 sm:gap-2 bg-card/80 backdrop-blur shadow-xs border-border/70"
              >
                <Layers className="h-4 w-4 text-indigo-500" />
                <span className="font-medium text-xs truncate max-w-[100px] sm:max-w-[140px]">
                  {currentLayoutName}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={handleResetAutoLayout} className="gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">Auto Layout (Default)</span>
              </DropdownMenuItem>
              {layouts.length > 0 && <DropdownMenuSeparator />}
              {layouts.map((l) => (
                <DropdownMenuItem
                  key={l.id}
                  onClick={() => loadLayoutById(l.id)}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate">{l.name}</span>
                  <div className="flex items-center gap-1.5">
                    {l.is_default && (
                      <span className="text-[10px] px-1 py-0.2 bg-primary/10 text-primary rounded">
                        Default
                      </span>
                    )}
                    {currentLayoutId === l.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSaveDialogOpen(true)}
            className="h-9 px-2.5 gap-1.5 bg-card/80 backdrop-blur shadow-xs border-border/70 text-xs"
          >
            <Save className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Save View</span>
          </Button>
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-card/80 backdrop-blur p-1 rounded-lg border border-border/70 shadow-xs">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[11px] font-mono w-10 text-center text-muted-foreground">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleResetZoom}
            title="Reset View"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <div className="h-3.5 w-px bg-border/60 mx-0.5" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleExportJSON}
            title="Export Layout as JSON"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        id="canvas-bg"
        className={`w-full h-full select-none ${
          isPanning ? "cursor-grabbing" : draggingNodeId ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={handleCanvasPointerDown}
      >
        <defs>
          <pattern
            id="obsidian-mindmap-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.07)" />
          </pattern>
          <filter id="glow-edge" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#obsidian-mindmap-grid)" />
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Edges - zero CSS transition delays to avoid stuttering */}
          {edges.map((edge, i) => {
            const source = nodeMap.get(edge.from);
            const target = nodeMap.get(edge.to);
            if (!source || !target) return null;

            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const isGroupItem = edge.kind === "group-item";

            return (
              <path
                key={`edge-${edge.from}-${edge.to}-${i}`}
                d={`M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`}
                fill="none"
                stroke={isGroupItem ? "hsl(var(--muted-foreground) / 0.35)" : "hsl(var(--primary) / 0.65)"}
                strokeWidth={isGroupItem ? 1.5 : 2.5}
                strokeDasharray={isGroupItem ? "4 4" : undefined}
                filter={isGroupItem ? undefined : "url(#glow-edge)"}
                className="pointer-events-none"
              />
            );
          })}

          {/* Nodes - zero scale transitions on hover/drag to eliminate hit-test oscillations */}
          {nodes.map((node) => {
            const isDragging = draggingNodeId === node.id;
            const isCollection = node.kind === "collection";
            const isGroup = node.kind === "group";
            const isItem = node.kind === "item";

            return (
              <g
                key={node.id}
                data-testid={`mindmap-node-${node.id}`}
                transform={`translate(${node.x}, ${node.y})`}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerMove={(e) => {
                  if (dragStartRef.current.nodeId || draggingNodeId) {
                    processPointerMove(
                      e.clientX ?? (e.nativeEvent as any)?.clientX ?? 0,
                      e.clientY ?? (e.nativeEvent as any)?.clientY ?? 0
                    );
                  }
                }}
                onPointerUp={processPointerUp}
                onClick={() => handleNodeClick(node)}
                className="group cursor-grab active:cursor-grabbing select-none"
              >
                {/* Node Pill / Squircle Background */}
                <rect
                  x={-node.radius * 1.3}
                  y={-node.radius * 0.75}
                  width={node.radius * 2.6}
                  height={node.radius * 1.5}
                  rx={node.radius * 0.4}
                  fill="hsl(var(--card))"
                  stroke={
                    isDragging
                      ? "hsl(var(--primary))"
                      : node.color ||
                        (isCollection
                          ? "hsl(var(--primary))"
                          : isGroup
                          ? "rgba(255, 255, 255, 0.18)"
                          : "rgba(255, 255, 255, 0.08)")
                  }
                  strokeWidth={isDragging ? 3 : isCollection ? 2.5 : isGroup ? 1.5 : 1}
                  className={`shadow-sm transition-colors duration-150 ${
                    isDragging
                      ? "ring-2 ring-primary/50"
                      : "group-hover:stroke-primary group-hover:brightness-110"
                  }`}
                />

                {/* Node Icon & Text */}
                <foreignObject
                  x={-node.radius * 1.3}
                  y={-node.radius * 0.75}
                  width={node.radius * 2.6}
                  height={node.radius * 1.5}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex items-center justify-center gap-1.5 px-2 text-center pointer-events-none select-none">
                    {isCollection && (
                      <Folder className="h-4 w-4 text-primary shrink-0" />
                    )}
                    {isGroup && (
                      <Layers className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    )}
                    {isItem && (
                      <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={`font-semibold truncate text-foreground leading-tight ${
                        isCollection ? "text-xs" : isGroup ? "text-[11px]" : "text-[10px]"
                      }`}
                    >
                      {node.label}
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Save Layout Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Mindmap View</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="layout-name">View Name</Label>
              <Input
                id="layout-name"
                placeholder="e.g. Q1 Architecture Map"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-default" className="text-sm font-medium">
                  Set as Default View
                </Label>
                <p className="text-xs text-muted-foreground">
                  Auto-load this view when opening mindmap mode
                </p>
              </div>
              <Switch
                id="is-default"
                checked={isDefaultLayout}
                onCheckedChange={setIsDefaultLayout}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="shared-org" className="text-sm font-medium">
                  Share with Workspace
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow other team members to view this layout
                </p>
              </div>
              <Switch
                id="shared-org"
                checked={isSharedWithOrg}
                onCheckedChange={setIsSharedWithOrg}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCurrentView} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Layout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
