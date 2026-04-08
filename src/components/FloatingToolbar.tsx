import { Plus, Trash2, LayoutGrid } from 'lucide-react';

interface FloatingToolbarProps {
  hasSelection: boolean;
  isRoot: boolean;
  onAddChild: () => void;
  onDelete: () => void;
  onAutoLayout: () => void;
}

export function FloatingToolbar({ hasSelection, isRoot, onAddChild, onDelete, onAutoLayout }: FloatingToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-toolbar text-toolbar-foreground rounded-xl shadow-2xl px-2 py-1.5 flex items-center gap-1 z-50">
      <button
        onClick={onAutoLayout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors text-sm"
        title="Re-organize Map"
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Re-organize Map</span>
      </button>
      {hasSelection && (
        <>
          <div className="w-px h-5 bg-muted-foreground/30 mx-1" />
          <button
            onClick={onAddChild}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors text-sm"
            title="Add child (Tab)"
          >
            <Plus className="w-4 h-4" />
            <span>Add child</span>
          </button>
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
        </>
      )}
    </div>
  );
}
