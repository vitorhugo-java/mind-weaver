import { useState, useCallback, useRef, useEffect } from 'react';
import { useMindMap } from '@/hooks/useMindMap';
import { TopNavBar } from './TopNavBar';
import { FloatingToolbar } from './FloatingToolbar';
import { MindMapNodeComponent } from './MindMapNode';
import { MindMapConnections } from './MindMapConnections';
import { Loader2 } from 'lucide-react';

export function MindMapCanvas() {
  const {
    map, nodes, allNodes, loading,
    selectedNodeId, setSelectedNodeId,
    editingNodeId, setEditingNodeId,
    rootNode,
    addChild, addSibling,
    updateNodeText, updateNodePosition,
    deleteNode, setTitle, autoLayout,
    toggleCollapse,
  } = useMindMap();

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Center canvas and auto-layout on first load
  useEffect(() => {
    if (!loading && rootNode && containerRef.current) {
      autoLayout();
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2 - rootNode.x, y: rect.height / 2 - rootNode.y });
    }
  }, [loading, rootNode?.id]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(3, Math.max(0.2, z * delta)));
  }, []);

  const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('[data-canvas-bg]')) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setSelectedNodeId(null);
    setEditingNodeId(null);
  }, [pan, setSelectedNodeId, setEditingNodeId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedNodeId || editingNodeId) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        addChild(selectedNodeId);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        addSibling(selectedNodeId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteNode(selectedNodeId);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setEditingNodeId(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodeId, editingNodeId, addChild, addSibling, deleteNode, setEditingNodeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas flex flex-col">
      <TopNavBar title={map?.title || ''} onTitleChange={setTitle} />

      <div
        ref={containerRef}
        className="flex-1 mt-12 relative cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleBgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-canvas-bg
      >
        {/* Dot grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" data-canvas-bg>
          <defs>
            <pattern id="dots" x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)} width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
              <circle cx={1} cy={1} r={1} fill="hsl(var(--canvas-dot))" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Zoom/Pan layer */}
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <MindMapConnections nodes={nodes} allNodes={allNodes} onToggleCollapse={toggleCollapse} />
          {nodes.map(node => (
            <MindMapNodeComponent
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              isEditing={node.id === editingNodeId}
              isRoot={node.parentId === null}
              onSelect={() => setSelectedNodeId(node.id)}
              onStartEdit={() => { setSelectedNodeId(node.id); setEditingNodeId(node.id); }}
              onStopEdit={() => setEditingNodeId(null)}
              onTextChange={(text) => updateNodeText(node.id, text)}
            />
          ))}
        </div>
      </div>

      {(() => {
        const containerRect = containerRef.current?.getBoundingClientRect();
        const toolbarPos = selectedNode && containerRect
          ? {
              x: containerRect.left + pan.x + selectedNode.x * zoom,
              y: containerRect.top + pan.y + (selectedNode.y - 20) * zoom,
            }
          : null;
        return (
          <FloatingToolbar
            hasSelection={!!selectedNodeId}
            isRoot={selectedNode?.parentId === null}
            position={toolbarPos}
            onAddChild={() => selectedNodeId && addChild(selectedNodeId)}
            onDelete={() => selectedNodeId && deleteNode(selectedNodeId)}
            onAutoLayout={autoLayout}
          />
        );
      })()}
    </div>
  );
}
