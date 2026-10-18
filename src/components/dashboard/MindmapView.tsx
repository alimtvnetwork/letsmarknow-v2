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
  Tag as TagIcon,
  Globe,
  Sparkles,
  Share2,
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
  updateBackendMindmapLayout,
  deleteBackendMindmapLayout,
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

interface CanvasNode {
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

interface CanvasEdge {
  from: string;
  to: string;
  kind: string;
  label?: string;
}

export const MindmapView: React.FC<MindmapViewProps> = ({
  collection,
  groups,
  items,
  onItemClick,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transformation
  const [viewport, setViewport] = useState({ x: 400, y: 300, zoom: 1.0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, vpX: 0, vpY: 0 });

  // Nodes & Edges state
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

  // Saved layouts state
  const [layouts, setLayouts] = useState<BackendMindmapLayoutSummary[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<string>("Auto Layout");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [isDefaultLayout, setIsDefaultLayout] = useState(false);
  const [isSharedWithOrg, setIsSharedWithOrg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate radial positions if no saved layout
  const generateAutoLayout = useCallback(() => {
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

    // Orbit 1: Groups (radius = 180)
    const validGroups = groups.length > 0 ? groups : [];
    const groupCount = Math.max(validGroups.length, 1);
    const groupAngleStep = (2 * Math.PI) / groupCount;
    const groupRadius = 200;

    const groupPosMap = new Map<string, { x: number; y: number }>();

    validGroups.forEach((grp, idx) => {
      const angle = idx * groupAngleStep;
      const gx = Math.cos(angle) * groupRadius;
      const gy = Math.sin(angle) * groupRadius;
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
      // Find parent group
      const parentGroupId = (item as any).groupId || (item as any).group_id;
      let parentPos = { x: 0, y: 0 };
      let parentId = centerNode.id;

      if (parentGroupId && groupPosMap.has(parentGroupId)) {
        parentPos = groupPosMap.get(parentGroupId)!;
        parentId = `grp-${parentGroupId}`;
      }

      // Spread items around their parent
      const itemAngle = (idx * 0.9) + (parentPos.x !== 0 ? Math.atan2(parentPos.y, parentPos.x) : 0);
      const itemDist = 130 + (idx % 3) * 35;
      const ix = parentPos.x + Math.cos(itemAngle) * itemDist;
      const iy = parentPos.y + Math.sin(itemAngle) * itemDist;

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

    setNodes(newNodes);
    setEdges(newEdges);
    setCurrentLayoutName("Auto Layout");
    setCurrentLayoutId(null);
  }, [collection, groups, items]);

  // Load layouts on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLayouts() {
      try {
        const summaries = await fetchBackendMindmapLayouts({
          scope_type: "collection",
          scope_id: collection.id,
          include_shared: true,
        });
        if (isMounted) {
          setLayouts(summaries);
          const defaultLayout = summaries.find((l) => l.is_default);
          if (defaultLayout) {
            loadLayoutById(defaultLayout.id);
          } else {
            generateAutoLayout();
          }
        }
      } catch (err) {
        // Fallback to local auto layout if API offline
        generateAutoLayout();
      }
    }
    loadLayouts();
    return () => {
      isMounted = false;
    };
  }, [collection.id, generateAutoLayout]);

  const loadLayoutById = async (id: string) => {
    try {
      const full = await fetchBackendMindmapLayout(id);
      setCurrentLayoutId(full.id);
      setCurrentLayoutName(full.name);

      if (full.viewport) {
        setViewport(full.viewport);
      }

      if (full.nodes && full.nodes.length > 0) {
        // Map backend nodes to CanvasNode
        const mappedNodes: CanvasNode[] = full.nodes.map((n) => {
          let label = n.kind;
          let sublabel: string | undefined;
          let url: string | undefined;

          if (n.kind === "collection") {
            label = collection.name;
          } else if (n.kind === "group") {
            const g = groups.find((grp) => grp.id === n.ref_id);
            if (g) label = g.name;
          } else if (n.kind === "item") {
            const it = items.find((item) => item.id === n.ref_id);
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
  };

  // Zoom handlers
  const handleZoomIn = () => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.2, 3.0) }));
  const handleZoomOut = () => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom / 1.2, 0.3) }));
  const handleResetZoom = () => setViewport({ x: 400, y: 300, zoom: 1.0 });

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background (not a node)
    if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).id === "canvas-bg") {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        vpX: viewport.x,
        vpY: viewport.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setViewport((v) => ({
        ...v,
        x: panStartRef.current.vpX + dx,
        y: panStartRef.current.vpY + dy,
      }));
    } else if (draggingNodeId) {
      const dx = (e.clientX - dragStartRef.current.x) / viewport.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / viewport.zoom;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, x: dragStartRef.current.nodeX + dx, y: dragStartRef.current.nodeY + dy }
            : n
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
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

  // Export JSON (spec 15-visualization/04-mindmap-view.md §10)
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
      className={`relative w-full h-[650px] overflow-hidden rounded-xl border border-border/80 bg-background/95 select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Canvas Top Bar HUD */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Left: Saved Views Picker */}
        <div className="pointer-events-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 gap-2 bg-card/80 backdrop-blur shadow-xs border-border/70"
              >
                <Layers className="h-4 w-4 text-indigo-500" />
                <span className="font-medium text-xs truncate max-w-[140px]">
                  {currentLayoutName}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={generateAutoLayout} className="gap-2">
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
            <span>Save View</span>
          </Button>
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-card/80 backdrop-blur p-1 rounded-lg border border-border/70 shadow-xs">
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
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Edges */}
          {edges.map((edge, i) => {
            const source = nodes.find((n) => n.id === edge.from);
            const target = nodes.find((n) => n.id === edge.to);
            if (!source || !target) return null;

            // Draw curved bezier line between nodes
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const isGroupItem = edge.kind === "group-item";

            return (
              <path
                key={`edge-${i}`}
                d={`M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`}
                fill="none"
                stroke={isGroupItem ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(var(--primary) / 0.45)"}
                strokeWidth={isGroupItem ? 1.5 : 2.5}
                strokeDasharray={isGroupItem ? "4 4" : undefined}
                className="transition-all duration-75 pointer-events-none"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isDragging = draggingNodeId === node.id;
            const isCollection = node.kind === "collection";
            const isGroup = node.kind === "group";
            const isItem = node.kind === "item";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onClick={() => {
                  if (isItem && onItemClick) {
                    const item = items.find((it) => it.id === node.ref_id);
                    if (item) onItemClick(item);
                  }
                }}
                className={`cursor-pointer transition-transform ${isDragging ? "scale-105" : "hover:scale-105"}`}
              >
                {/* Node Circle Background */}
                <circle
                  r={node.radius}
                  fill={
                    isCollection
                      ? "hsl(var(--card))"
                      : isGroup
                      ? "hsl(var(--card))"
                      : "hsl(var(--card))"
                  }
                  stroke={
                    node.color ||
                    (isCollection
                      ? "hsl(var(--primary))"
                      : isGroup
                      ? "hsl(var(--chart-2))"
                      : "hsl(var(--border))")
                  }
                  strokeWidth={isCollection ? 3 : isGroup ? 2 : 1.5}
                  className="shadow-sm"
                />

                {/* Node Icon */}
                <foreignObject
                  x={-node.radius}
                  y={-node.radius}
                  width={node.radius * 2}
                  height={node.radius * 2}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                    {isCollection && (
                      <Folder className="h-5 w-5 text-indigo-500 mb-0.5" />
                    )}
                    {isGroup && (
                      <Layers className="h-4 w-4 text-blue-500 mb-0.5" />
                    )}
                    {isItem && (
                      <Globe className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
                    )}
                    <span
                      className={`font-medium line-clamp-1 text-foreground leading-tight ${
                        isCollection ? "text-[11px]" : isGroup ? "text-[10px]" : "text-[8px]"
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
