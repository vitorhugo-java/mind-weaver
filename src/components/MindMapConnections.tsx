import type { MindMapNode } from '@/lib/db';

interface Props {
  nodes: MindMapNode[];
  allNodes: MindMapNode[];
}

// Horizontal offset so lines start/end clear of the node's toggle button
const START_X_OFFSET = 18;
const END_X_OFFSET = 8;

export function MindMapConnections({ nodes }: Props) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible text-slate-400 dark:text-slate-500"
      style={{ position: 'absolute', overflow: 'visible' }}
    >
      {nodes.filter(n => n.parentId).map(node => {
        const parent = nodeMap.get(node.parentId!);
        if (!parent) return null;

        const goingRight = node.x >= parent.x;
        const startX = parent.x + (goingRight ? START_X_OFFSET : -START_X_OFFSET);
        const startY = parent.y;
        const endX = node.x + (goingRight ? -END_X_OFFSET : END_X_OFFSET);
        const endY = node.y;

        const dx = endX - startX;
        const cx1 = startX + dx * 0.4;
        const cy1 = startY;
        const cx2 = startX + dx * 0.6;
        const cy2 = endY;

        return (
          <path
            key={`${parent.id}-${node.id}`}
            d={`M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      })}
    </svg>
  );
}
