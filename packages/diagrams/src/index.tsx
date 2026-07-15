"use client";
import { useState } from "react";

export type DiagramNode = {
  id: string;
  label: string;
  detail: string;
  tone?: "danger" | "active";
  phase?: "build" | "run";
  owner?: string;
  source?: { label: string; url: string };
};
export function FlowDiagram({
  nodes,
  onSelect,
}: {
  nodes: DiagramNode[];
  onSelect?: (node: DiagramNode) => void;
}) {
  const [selected, setSelected] = useState(nodes[0]?.id);
  const phaseGroups = nodes.reduce<
    { phase: NonNullable<DiagramNode["phase"]>; nodes: DiagramNode[] }[]
  >((groups, node) => {
    if (!node.phase) return groups;
    const current = groups.at(-1);
    if (current?.phase === node.phase) current.nodes.push(node);
    else groups.push({ phase: node.phase, nodes: [node] });
    return groups;
  }, []);

  let stepNumber = 0;
  return (
    <div className="flow-diagram" role="group" aria-label="Build and program execution flow">
      <div className="flow-diagram-grid">
        {phaseGroups.flatMap((group, groupIndex) => {
          const phaseStart = stepNumber;
          stepNumber += group.nodes.length;
          const phasePanel = (
            <section className={`flow-phase-panel phase-${group.phase}`} key={group.phase}>
              <header>
                <span>{group.phase === "build" ? "Build phase" : "Program execution"}</span>
                <small>
                  {group.phase === "build"
                    ? "Creates the executable"
                    : "Runs inside the executable"}
                </small>
              </header>
              <ol>
                {group.nodes.map((node, nodeIndex) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      aria-pressed={selected === node.id}
                      className={selected === node.id ? "is-selected" : ""}
                      onClick={() => {
                        setSelected(node.id);
                        onSelect?.(node);
                      }}
                    >
                      <span className="flow-step-number">
                        {String(phaseStart + nodeIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="flow-step-copy">
                        <strong>{node.label}</strong>
                        <small>{node.detail}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          );
          const handoff =
            groupIndex < phaseGroups.length - 1 ? (
              <div className="flow-handoff" key={`${group.phase}-handoff`} aria-hidden="true">
                <span>executable</span>
                <b>→</b>
              </div>
            ) : null;
          return handoff ? [phasePanel, handoff] : [phasePanel];
        })}
      </div>
    </div>
  );
}
