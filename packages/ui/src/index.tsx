import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import type {
  ContentBlock,
  Reference,
  Resource,
  StageContent,
  StageDiagram as StageDiagramSpec,
  StageExample,
  StageNote as StageNoteSpec,
  StageScenario,
} from "@platform/content-schema";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx("ui-button", className)} {...props} />;
}
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={clsx("ui-badge", className)} {...props} />;
}
export function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="progress-ring"
      style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}
      aria-label={`${label}: ${value}%`}
    >
      <span>
        {value}
        <small>%</small>
      </span>
    </div>
  );
}
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="section-label">{children}</p>;
}

/**
 * Minimal inline formatter: renders `code` spans and **bold** spans found in
 * authored text. Anything else passes through as plain text.
 */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code className="inline-code" key={i}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function Paragraphs({ text }: { text: string }) {
  const segments = text.split(/(```[\s\S]*?```)/g).filter(Boolean);
  return (
    <>
      {segments.flatMap((segment, segmentIndex) => {
        if (segment.startsWith("```") && segment.endsWith("```")) {
          const fenced = segment.slice(3, -3).replace(/^\n/, "").replace(/\n$/, "");
          const firstNewline = fenced.indexOf("\n");
          const firstLine = firstNewline === -1 ? "" : fenced.slice(0, firstNewline).trim();
          const hasLanguageLabel = /^[a-zA-Z0-9_+-]+$/.test(firstLine);
          const code = hasLanguageLabel ? fenced.slice(firstNewline + 1) : fenced;
          return (
            <pre className="stage-inline-code-block" key={`code-${segmentIndex}`}>
              <code>{code}</code>
            </pre>
          );
        }

        return segment
          .split("\n\n")
          .filter(Boolean)
          .map((paragraph, paragraphIndex) => (
            <p className="stage-para" key={`text-${segmentIndex}-${paragraphIndex}`}>
              {renderInline(paragraph)}
            </p>
          ));
      })}
    </>
  );
}

function KeyPoints({ items }: { items: string[] }) {
  return (
    <ul className="stage-keypoints">
      {items.map((point) => (
        <li key={point}>{renderInline(point)}</li>
      ))}
    </ul>
  );
}

export function CodeExample({ example }: { example: StageExample }) {
  return (
    <figure className="stage-example">
      <figcaption>
        <span className="stage-example-lang">{example.language}</span>
        {example.title}
      </figcaption>
      <pre>
        <code>{example.code}</code>
      </pre>
      <p className="stage-example-takeaway">{renderInline(example.takeaway)}</p>
    </figure>
  );
}

export function Scenario({ scenario }: { scenario: StageScenario }) {
  return (
    <aside className="stage-scenario" aria-label="Use-case scenario">
      <p className="stage-scenario-label">Scenario</p>
      <strong>{scenario.title}</strong>
      <p className="stage-scenario-context">{renderInline(scenario.context)}</p>
      <p className="stage-scenario-insight">{renderInline(scenario.insight)}</p>
    </aside>
  );
}

export function StageNote({ note }: { note: StageNoteSpec }) {
  const label = { tip: "Tip", analogy: "Analogy", warning: "Watch out", info: "Note" }[note.tone];
  return (
    <aside className={`stage-note note-${note.tone}`}>
      <p className="stage-note-label">{note.title ?? label}</p>
      <p className="stage-note-text">{renderInline(note.text)}</p>
    </aside>
  );
}

/**
 * A declarative, CSS-laid-out diagram. Node tone and the diagram `kind` drive
 * appearance; the host stylesheet supplies colors so it themes per app.
 */
export function StageDiagram({ diagram }: { diagram: StageDiagramSpec }) {
  return (
    <figure className={`stage-diagram diagram-${diagram.kind}`}>
      {diagram.title && <figcaption className="stage-diagram-title">{diagram.title}</figcaption>}
      <div className="stage-diagram-body">
        {diagram.nodes.map((node, i) => (
          <div className="diagram-item" key={node.id}>
            <div className={clsx("diagram-node", node.tone && `tone-${node.tone}`)}>
              {diagram.kind === "sequence" && <span className="diagram-step">{i + 1}</span>}
              <strong>{node.label}</strong>
              {node.detail && <span className="diagram-detail">{node.detail}</span>}
            </div>
            {i < diagram.nodes.length - 1 && <span className="diagram-connector" aria-hidden />}
          </div>
        ))}
      </div>
      {diagram.caption && (
        <figcaption className="stage-diagram-caption">{diagram.caption}</figcaption>
      )}
    </figure>
  );
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return <Paragraphs text={block.text} />;
    case "points":
      return <KeyPoints items={block.items} />;
    case "example":
      return <CodeExample example={block.example} />;
    case "scenario":
      return <Scenario scenario={block.scenario} />;
    case "diagram":
      return <StageDiagram diagram={block.diagram} />;
    case "note":
      return <StageNote note={block.note} />;
    default:
      return null;
  }
}

/**
 * Renders one lesson stage. Order: lead body → key points → interleaved blocks
 * (diagrams/examples/notes in author order) → flat example → flat scenario.
 */
export function StageArticle({ content }: { content: StageContent }) {
  return (
    <div className="stage-article">
      <Paragraphs text={content.body} />
      {content.keyPoints && content.keyPoints.length > 0 ? (
        <KeyPoints items={content.keyPoints} />
      ) : null}
      {content.blocks?.map((block, i) => (
        <Block block={block} key={i} />
      ))}
      {content.example ? <CodeExample example={content.example} /> : null}
      {content.scenario ? <Scenario scenario={content.scenario} /> : null}
    </div>
  );
}

/** External learning resources for a lesson (reference form: what it teaches). */
export function ReferenceList({
  items,
  title = "Further reading",
}: {
  items: Reference[];
  title?: string;
}) {
  if (!items.length) return null;
  return (
    <div className="reference-list">
      <SectionLabel>{title}</SectionLabel>
      <ul>
        {items.map((r) => (
          <li key={r.url}>
            <a href={r.url} target="_blank" rel="noreferrer">
              <span className="reference-title">
                {r.title}
                <em className={r.required ? "reference-req" : "reference-opt"}>
                  {["go.dev", "pkg.go.dev"].includes(new URL(r.url).hostname)
                    ? `official · ${r.required ? "required" : "optional"}`
                    : `supplemental · ${r.required ? "required" : "optional"}`}
                </em>
              </span>
              <small>{r.teaches}</small>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** External resources (docs, repos, videos) shown in modules and the resources hub. */
export function ResourceList({ items, title }: { items: Resource[]; title?: string }) {
  if (!items.length) return null;
  return (
    <div className="resource-list">
      {title && <SectionLabel>{title}</SectionLabel>}
      <ul>
        {items.map((r) => (
          <li key={r.url}>
            <a href={r.url} target="_blank" rel="noreferrer">
              <span className="resource-head">
                <em className={`resource-kind kind-${r.kind}`}>{r.kind}</em>
                <span className="resource-label">{r.label}</span>
                {r.stars && <span className="resource-stars">★ {r.stars}</span>}
              </span>
              <small>{r.description}</small>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
