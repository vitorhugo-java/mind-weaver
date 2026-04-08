import { useRef, useEffect, useCallback } from 'react';
import type { MindMapNode as NodeType } from '@/lib/db';

interface MindMapNodeProps {
  node: NodeType;
  isSelected: boolean;
  isEditing: boolean;
  isRoot: boolean;
  zoom: number;
  onSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onTextChange: (text: string) => void;
  onDrag: (x: number, y: number) => void;
}

export function MindMapNodeComponent({
  node, isSelected, isEditing, isRoot, zoom,
  onSelect, onStartEdit, onStopEdit, onTextChange, onDrag,
}: MindMapNodeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startX) / zoom;
      const dy = (e.clientY - dragRef.current.startY) / zoom;
      onDrag(dragRef.current.nodeX + dx, dragRef.current.nodeY + dy);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isEditing, node.x, node.y, zoom, onSelect, onDrag]);

  const baseSize = isRoot ? 'min-w-[140px] px-6 py-3 text-base font-bold' : 'min-w-[100px] px-4 py-2 text-sm font-medium';

  return (
    <div
      className={`absolute cursor-grab active:cursor-grabbing select-none ${baseSize} rounded-xl border-2 transition-shadow duration-150 flex items-center justify-center whitespace-nowrap`}
      style={{
        left: node.x,
        top: node.y,
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'hsl(var(--node-bg))',
        borderColor: isSelected ? node.color : 'hsl(var(--node-border))',
        boxShadow: isSelected
          ? `0 0 0 3px ${node.color}33, 0 4px 20px ${node.color}22`
          : '0 2px 8px rgba(0,0,0,0.06)',
        color: 'hsl(var(--foreground))',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(); }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="bg-transparent outline-none text-center w-full min-w-[60px]"
          value={node.text}
          onChange={e => onTextChange(e.target.value)}
          onBlur={onStopEdit}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault();
              onStopEdit();
            }
          }}
          style={{ color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}
        />
      ) : (
        <span style={{ color: node.parentId === null ? node.color : 'inherit' }}>
          {node.text || 'New topic'}
        </span>
      )}
    </div>
  );
}
