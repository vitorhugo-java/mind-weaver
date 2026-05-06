import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrCreateDefaultMap, saveNodes, updateMapTitle, type MindMap, type MindMapNode } from '@/lib/db';
import { readMapFromUrl, writeMapToUrl } from '@/lib/urlState';

const NODE_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(262, 83%, 58%)',
  'hsl(340, 82%, 52%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
];

function getChildColor(depth: number): string {
  return NODE_COLORS[depth % NODE_COLORS.length];
}

function getNodeDepth(nodeId: string, nodes: MindMapNode[]): number {
  let depth = 0;
  let current = nodes.find(n => n.id === nodeId);
  while (current?.parentId) {
    depth++;
    current = nodes.find(n => n.id === current!.parentId);
  }
  return depth;
}

export function useMindMap() {
  const [map, setMap] = useState<MindMap | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const needsLayout = useRef(false);

  const initialLayoutDone = useRef(false);

  useEffect(() => {
    const shared = readMapFromUrl();
    getOrCreateDefaultMap().then(({ map, nodes }) => {
      if (shared && shared.nodes?.length) {
        setMap({ ...map, title: shared.map?.title ?? map.title });
        // Re-bind mapId so persistence still works locally
        setNodes(shared.nodes.map(n => ({ ...n, mapId: map.id! })));
      } else {
        setMap(map);
        setNodes(nodes);
      }
      setLoading(false);
    });
  }, []);

  const debouncedSave = useCallback((mapId: number, updatedNodes: MindMapNode[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveNodes(mapId, updatedNodes);
    }, 500);
  }, []);

  // Sync to URL hash whenever nodes/title change
  useEffect(() => {
    if (loading || !map) return;
    writeMapToUrl({ map: { title: map.title }, nodes });
  }, [nodes, map, loading]);

  const applyLayout = useCallback((inputNodes: MindMapNode[]): MindMapNode[] => {
    const root = inputNodes.find(n => n.parentId === null);
    if (!root) return inputNodes;

    const HORIZONTAL_GAP = 250;
    const VERTICAL_GAP = 80;

    const childrenMap = new Map<string, MindMapNode[]>();
    inputNodes.forEach(n => {
      if (n.parentId) {
        const siblings = childrenMap.get(n.parentId) || [];
        siblings.push(n);
        childrenMap.set(n.parentId, siblings);
      }
    });

    const subtreeHeight = new Map<string, number>();
    function calcHeight(id: string): number {
      const node = inputNodes.find(n => n.id === id);
      const children = (node?.collapsed) ? [] : (childrenMap.get(id) || []);
      if (children.length === 0) { subtreeHeight.set(id, VERTICAL_GAP); return VERTICAL_GAP; }
      const h = children.reduce((sum, c) => sum + calcHeight(c.id), 0);
      subtreeHeight.set(id, h);
      return h;
    }
    calcHeight(root.id);

    const positions = new Map<string, { x: number; y: number }>();
    positions.set(root.id, { x: 0, y: 0 });

    function layout(id: string, x: number, yStart: number) {
      const node = inputNodes.find(n => n.id === id);
      const children = (node?.collapsed) ? [] : (childrenMap.get(id) || []);
      let yOffset = yStart;
      children.forEach(child => {
        const h = subtreeHeight.get(child.id) || VERTICAL_GAP;
        const cy = yOffset + h / 2;
        positions.set(child.id, { x, y: cy });
        layout(child.id, x + HORIZONTAL_GAP, yOffset);
        yOffset += h;
      });
    }

    const totalH = subtreeHeight.get(root.id) || 0;
    layout(root.id, HORIZONTAL_GAP, -totalH / 2);

    return inputNodes.map(n => {
      const pos = positions.get(n.id);
      return pos ? { ...n, ...pos } : n;
    });
  }, []);

  const updateNodes = useCallback((updatedNodes: MindMapNode[], runLayout = false) => {
    const final = runLayout ? applyLayout(updatedNodes) : updatedNodes;
    setNodes(final);
    if (map?.id) debouncedSave(map.id, final);
  }, [map, debouncedSave, applyLayout]);

  const rootNode = nodes.find(n => n.parentId === null);

  const addChild = useCallback((parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent || !map?.id) return;

    const depth = getNodeDepth(parentId, nodes) + 1;

    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      mapId: map.id,
      parentId,
      text: '',
      x: 0,
      y: 0,
      color: getChildColor(depth),
    };

    const updated = [...nodes, newNode];
    updateNodes(updated, true);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
    return newNode.id;
  }, [nodes, map, updateNodes]);

  const addSibling = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.parentId || !map?.id) return;

    const depth = getNodeDepth(nodeId, nodes);
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      mapId: map.id,
      parentId: node.parentId,
      text: '',
      x: 0,
      y: 0,
      color: getChildColor(depth),
    };

    const updated = [...nodes, newNode];
    updateNodes(updated, true);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
    return newNode.id;
  }, [nodes, map, updateNodes]);

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    const updated = nodes.map(n => n.id === nodeId ? { ...n, text } : n);
    updateNodes(updated);
  }, [nodes, updateNodes]);

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    const updated = nodes.map(n => n.id === nodeId ? { ...n, x, y } : n);
    updateNodes(updated);
  }, [nodes, updateNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.parentId) return;

    const toDelete = new Set<string>();
    const collectChildren = (id: string) => {
      toDelete.add(id);
      nodes.filter(n => n.parentId === id).forEach(child => collectChildren(child.id));
    };
    collectChildren(nodeId);

    const updated = nodes.filter(n => !toDelete.has(n.id));
    updateNodes(updated, true);
    setSelectedNodeId(node.parentId);
  }, [nodes, updateNodes]);

  const autoLayout = useCallback(() => {
    if (!rootNode || !map?.id) return;
    updateNodes(nodes, true);
  }, [nodes, rootNode, map, updateNodes]);

  const toggleCollapse = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const updated = nodes.map(n => n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n);
    updateNodes(updated, true);
  }, [nodes, updateNodes]);

  const setNodeImage = useCallback((nodeId: string, image: string | undefined) => {
    const updated = nodes.map(n => n.id === nodeId ? { ...n, image } : n);
    updateNodes(updated, true);
  }, [nodes, updateNodes]);

  // Compute visible nodes (filter out children of collapsed nodes)
  const visibleNodes = (() => {
    const hiddenSet = new Set<string>();
    const collectHidden = (parentId: string) => {
      nodes.filter(n => n.parentId === parentId).forEach(child => {
        hiddenSet.add(child.id);
        collectHidden(child.id);
      });
    };
    nodes.filter(n => n.collapsed).forEach(n => collectHidden(n.id));
    return nodes.filter(n => !hiddenSet.has(n.id));
  })();

  const setTitle = useCallback((title: string) => {
    if (!map?.id) return;
    setMap(prev => prev ? { ...prev, title } : prev);
    updateMapTitle(map.id, title);
  }, [map]);

  return {
    map, nodes: visibleNodes, allNodes: nodes, loading,
    selectedNodeId, setSelectedNodeId,
    editingNodeId, setEditingNodeId,
    rootNode,
    addChild, addSibling,
    updateNodeText, updateNodePosition,
    deleteNode, setTitle, autoLayout,
    toggleCollapse, setNodeImage,
  };
}
