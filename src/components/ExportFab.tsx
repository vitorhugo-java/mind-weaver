import { Download } from 'lucide-react';

interface ExportFabProps {
  onClick: () => void;
}

export function ExportFab({ onClick }: ExportFabProps) {
  return (
    <button
      data-export-ignore
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50"
      title="Export as PNG"
      aria-label="Export as PNG"
    >
      <Download className="w-6 h-6" />
    </button>
  );
}
