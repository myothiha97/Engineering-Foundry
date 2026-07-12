"use client";
import { useState } from "react";

export type DiagramNode = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  tone?: "danger" | "active";
};
export function FlowDiagram({
  nodes,
  onSelect,
}: {
  nodes: DiagramNode[];
  onSelect?: (node: DiagramNode) => void;
}) {
  const [selected, setSelected] = useState(nodes[0]?.id);
  return (
    <div className="flow-diagram" role="group" aria-label="Interactive system flow">
      <svg viewBox="0 0 800 240" role="img" aria-labelledby="diagram-title diagram-desc">
        <title id="diagram-title">System flow</title>
        <desc id="diagram-desc">Select a stage for its explanation.</desc>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 10 5 0 10z" fill="currentColor" />
          </marker>
        </defs>
        {nodes.slice(1).map((node, index) => {
          const prev = nodes[index];
          return prev ? (
            <line
              key={`edge-${node.id}`}
              x1={prev.x + 60}
              y1={prev.y + 25}
              x2={node.x}
              y2={node.y + 25}
              stroke="currentColor"
              strokeOpacity=".35"
              markerEnd="url(#arrow)"
            />
          ) : null;
        })}
        {nodes.map((node) => (
          <g
            key={node.id}
            onClick={() => {
              setSelected(node.id);
              onSelect?.(node);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(node.id);
                onSelect?.(node);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`${node.label}: ${node.detail}`}
            className={selected === node.id ? "is-selected" : ""}
          >
            <rect x={node.x} y={node.y} width="120" height="50" rx="8" />
            <text x={node.x + 60} y={node.y + 30} textAnchor="middle">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
