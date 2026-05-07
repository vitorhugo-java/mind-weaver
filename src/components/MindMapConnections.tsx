import type { MindMapNode } from '@/lib/db';

interface Props {
  nodes: MindMapNode[];
  allNodes: MindMapNode[];
  onToggleCollapse: (nodeId: string) => void;
}

export function MindMapConnections({ nodes, allNodes, onToggleCollapse }: Props) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Find which visible nodes have children (in allNodes) to show toggle buttons
  const childCountMap = new Map<string, number>();
  allNodes.forEach(n => {
    if (n.parentId) {
      childCountMap.set(n.parentId, (childCountMap.get(n.parentId) || 0) + 1);
    }
  });

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
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
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      })}

      {/* Collapse/expand toggle buttons on parent nodes that have children */}
      {nodes.filter(n => (childCountMap.get(n.id) || 0) > 0).map(node => {
        const isCollapsed = !!node.collapsed;
        const childCount = childCountMap.get(node.id) || 0;
        // Position the button to the right of the node
        const btnX = node.x + 60;
        const btnY = node.y;

        return (
          <g
            key={`toggle-${node.id}`}
            className="pointer-events-auto cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }}
          >
            <circle
              cx={btnX}
              cy={btnY}
              r={10}
              fill={node.color}
              opacity={0.9}
            />
            <text
              x={btnX}
              y={btnY}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={isCollapsed ? 11 : 14}
              fontWeight="bold"
              className="select-none"
            >
              {isCollapsed ? childCount : '−'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
