import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrCreateDefaultMap, saveNodes, updateMapTitle, type MindMap, type MindMapNode } from '@/lib/db';

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

  useEffect(() => {
    getOrCreateDefaultMap().then(({ map, nodes }) => {
      setMap(map);
      setNodes(nodes);
      setLoading(false);
    });
  }, []);

  const debouncedSave = useCallback((mapId: number, updatedNodes: MindMapNode[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveNodes(mapId, updatedNodes);
    }, 500);
  }, []);

  const updateNodes = useCallback((updatedNodes: MindMapNode[]) => {
    setNodes(updatedNodes);
    if (map?.id) debouncedSave(map.id, updatedNodes);
  }, [map, debouncedSave]);

  const rootNode = nodes.find(n => n.parentId === null);

  const addChild = useCallback((parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent || !map?.id) return;

    const siblings = nodes.filter(n => n.parentId === parentId);
    const depth = getNodeDepth(parentId, nodes) + 1;
    const angle = siblings.length * 0.6 - (Math.max(siblings.length - 1, 0) * 0.3);
    const distance = 200;

    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      mapId: map.id,
      parentId,
      text: '',
      x: parent.x + Math.cos(angle) * distance,
      y: parent.y + Math.sin(angle) * distance,
      color: getChildColor(depth),
    };

    const updated = [...nodes, newNode];
    updateNodes(updated);
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
      x: node.x,
      y: node.y + 80,
      color: getChildColor(depth),
    };

    const updated = [...nodes, newNode];
    updateNodes(updated);
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
    if (!node || !node.parentId) return; // can't delete root

    const toDelete = new Set<string>();
    const collectChildren = (id: string) => {
      toDelete.add(id);
      nodes.filter(n => n.parentId === id).forEach(child => collectChildren(child.id));
    };
    collectChildren(nodeId);

    const updated = nodes.filter(n => !toDelete.has(n.id));
    updateNodes(updated);
    setSelectedNodeId(node.parentId);
  }, [nodes, updateNodes]);

  const setTitle = useCallback((title: string) => {
    if (!map?.id) return;
    setMap(prev => prev ? { ...prev, title } : prev);
    updateMapTitle(map.id, title);
  }, [map]);

  return {
    map, nodes, loading,
    selectedNodeId, setSelectedNodeId,
    editingNodeId, setEditingNodeId,
    rootNode,
    addChild, addSibling,
    updateNodeText, updateNodePosition,
    deleteNode, setTitle,
  };
}
