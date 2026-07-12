"use client";
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { go } from "@codemirror/lang-go";

export function GoEditor({
  starter,
  expected,
  test,
  onResult,
}: {
  starter: string;
  expected: string;
  test: (code: string) => { passed: boolean; output: string };
  /** Called after each run so the host can record deterministic-check evidence. */
  onResult?: (result: { passed: boolean; output: string }) => void;
}) {
  const [code, setCode] = useState(starter);
  const [result, setResult] = useState<{ passed: boolean; output: string }>();
  const [showDiff, setShowDiff] = useState(false);
  return (
    <div className="code-lab">
      <div className="code-toolbar">
        <span>main.go</span>
        <div>
          <button
            onClick={() => {
              setCode(starter);
              setResult(undefined);
            }}
          >
            Reset
          </button>
          <button onClick={() => setShowDiff((v) => !v)}>Diff</button>
          <button
            className="run"
            onClick={() => {
              const r = test(code);
              setResult(r);
              onResult?.(r);
            }}
          >
            Run tests
          </button>
        </div>
      </div>
      <CodeMirror
        value={showDiff ? expected : code}
        onChange={setCode}
        editable={!showDiff}
        extensions={[go()]}
        theme="dark"
        height="260px"
        aria-label="Go exercise editor"
      />
      <pre className={result?.passed ? "test-result passed" : "test-result"} aria-live="polite">
        {result
          ? `${result.passed ? "PASS" : "FAIL"}  ${result.output}`
          : "Tests ready · deterministic local validation"}
      </pre>
    </div>
  );
}
