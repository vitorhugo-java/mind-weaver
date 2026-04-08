import type { MindMapNode } from '@/lib/db';

interface Props {
  nodes: MindMapNode[];
}

export function MindMapConnections({ nodes }: Props) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      {nodes.filter(n => n.parentId).map(node => {
        const parent = nodeMap.get(node.parentId!);
        if (!parent) return null;

        const dx = node.x - parent.x;
        const dy = node.y - parent.y;
        const cx1 = parent.x + dx * 0.4;
        const cy1 = parent.y;
        const cx2 = parent.x + dx * 0.6;
        const cy2 = node.y;

        return (
          <path
            key={`${parent.id}-${node.id}`}
            d={`M ${parent.x} ${parent.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${node.x} ${node.y}`}
            fill="none"
            stroke={node.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.6}
          />
        );
      })}
    </svg>
  );
}
