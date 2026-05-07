import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExportFabProps {
  onExport: () => void;
  onClear: () => void;
  canClear: boolean;
}

export function ExportFab({ onExport, onClear, canClear }: ExportFabProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div
        data-export-ignore
        className="fixed top-4 left-4 flex items-center gap-2 z-50"
      >
        <button
          onClick={onExport}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          title="Export as PNG"
          aria-label="Export as PNG"
        >
          <Download className="w-4 h-4" />
        </button>
        {canClear && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            title="Clear map"
            aria-label="Clear map"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear mind map?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all nodes and reset the canvas to a single root node. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClear}>Clear map</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
