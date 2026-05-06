import { useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';

interface FloatingToolbarProps {
  hasSelection: boolean;
  isRoot: boolean;
  hasImage: boolean;
  position?: { x: number; y: number } | null;
  onAddChild: () => void;
  onDelete: () => void;
  onSetImage: (dataUrl: string | undefined) => void;
}

export function FloatingToolbar({ hasSelection, isRoot, hasImage, position, onAddChild, onDelete, onSetImage }: FloatingToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  if (!hasSelection || !position) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onSetImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed bg-toolbar text-toolbar-foreground rounded-xl shadow-2xl px-2 py-1.5 flex items-center gap-1 z-50 -translate-x-1/2 -translate-y-full"
      style={{ left: position.x, top: position.y - 16 }}
    >
      <button
        onClick={onAddChild}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors text-sm"
        title="Add child (Tab)"
      >
        <Plus className="w-4 h-4" />
        <span>Add child</span>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors text-sm"
        title="Add image"
      >
        <ImageIcon className="w-4 h-4" />
        <span>Image</span>
      </button>
      {hasImage && (
        <button
          onClick={() => onSetImage(undefined)}
          className="flex items-center px-2 py-1.5 rounded-lg hover:bg-destructive/20 text-destructive transition-colors text-sm"
          title="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {!isRoot && (
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-destructive/20 text-destructive transition-colors text-sm"
          title="Delete (Del)"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      )}
    </div>
  );
}
