import { Download, Share2, FileText } from 'lucide-react';

interface TopNavBarProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export function TopNavBar({ title, onTitleChange }: TopNavBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-12 bg-navbar text-navbar-foreground flex items-center px-4 z-50 shadow-md">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <input
            className="bg-transparent border-none outline-none text-sm font-medium text-navbar-foreground placeholder:text-navbar-foreground/50 w-48"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Untitled Map"
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-md hover:bg-primary/20 transition-colors" title="Export">
          <Download className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-md hover:bg-primary/20 transition-colors" title="Share">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
