'use client';
import { useMemo } from 'react';

interface Network {
  center: number;
  nodes: { id: number; name: string; party: string; state: string }[];
  edges: { source: number; target: number; weight: number }[];
}

/**
 * Renderização SVG simples em layout circular do grafo.
 * (Para produção: substituir por d3-force ou cytoscape.)
 */
export function CoauthorshipNetwork({ data }: { data: Network }) {
  const layout = useMemo(() => buildLayout(data), [data]);
  if (!data.nodes.length) return <p className="text-sm text-slate-400">Sem coautores ainda.</p>;

  return (
    <svg viewBox="0 0 600 600" className="w-full h-[480px]">
      {layout.edges.map((e, i) => (
        <line
          key={i}
          x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke="#dc2626"
          strokeOpacity={Math.min(0.15 + e.weight * 0.05, 0.8)}
          strokeWidth={Math.min(1 + e.weight * 0.4, 6)}
        />
      ))}
      {layout.nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x},${n.y})`}>
          <circle r={n.center ? 14 : 8} fill={n.center ? '#dc2626' : '#475569'} />
          <text x={12} y={4} fontSize={10} fill="#64748b">{n.name}</text>
        </g>
      ))}
    </svg>
  );
}

function buildLayout(data: Network) {
  const cx = 300, cy = 300, R = 240;
  const nonCenter = data.nodes.filter((n) => n.id !== data.center);
  const positions = new Map<number, { x: number; y: number }>();
  positions.set(data.center, { x: cx, y: cy });
  nonCenter.forEach((n, i) => {
    const angle = (i / nonCenter.length) * Math.PI * 2;
    positions.set(n.id, { x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R });
  });

  const nodes = data.nodes.map((n) => {
    const p = positions.get(n.id)!;
    return { ...n, ...p, center: n.id === data.center };
  });

  const edges = data.edges
    .map((e) => {
      const a = positions.get(e.source);
      const b = positions.get(e.target);
      if (!a || !b) return null;
      return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, weight: e.weight };
    })
    .filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; weight: number }[];

  return { nodes, edges };
}
