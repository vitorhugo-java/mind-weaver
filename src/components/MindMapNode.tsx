import { useRef, useEffect } from 'react';
import type { MindMapNode as NodeType } from '@/lib/db';

interface MindMapNodeProps {
  node: NodeType;
  isSelected: boolean;
  isEditing: boolean;
  isRoot: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onTextChange: (text: string) => void;
}

export function MindMapNodeComponent({
  node, isSelected, isEditing, isRoot,
  onSelect, onStartEdit, onStopEdit, onTextChange,
}: MindMapNodeProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const textStyle = isRoot
    ? 'text-xl font-extrabold text-foreground'
    : 'text-sm font-medium text-foreground/80';

  const selectedRing = isSelected
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-canvas shadow-md'
    : '';

  return (
    <div
      className={`absolute select-none flex items-center justify-center whitespace-nowrap cursor-pointer transition-all duration-150 z-10 px-3 py-1 bg-canvas rounded-md ${textStyle} ${selectedRing}`}
      style={{
        left: node.x,
        top: node.y,
        transform: 'translate(-50%, -50%)',
        ...(isSelected && !isRoot ? { color: node.color } : {}),
        ...(isRoot ? { color: 'hsl(var(--foreground))' } : {}),
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(); }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="bg-transparent outline-none text-center min-w-[60px] border-b-2 border-primary"
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
        <span>{node.text || 'New topic'}</span>
      )}
    </div>
  );
}
