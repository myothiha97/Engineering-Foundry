import type { Resource } from "@platform/content-schema";

/**
 * A deliberately small companion shelf. The lab is the primary explanation;
 * these links provide another example, practice, or an authoritative lookup.
 */
export const goResources: Resource[] = [
  {
    label: "Official: Getting started with Go",
    url: "https://go.dev/doc/tutorial/getting-started",
    kind: "doc",
    description: "The official first-program tutorial. Use this before the deeper reference pages.",
  },
  {
    label: "Official: A Tour of Go",
    url: "https://go.dev/tour/",
    kind: "playground",
    description: "Run short official examples in the browser after learning each core topic here.",
  },
  {
    label: "Official: The Go Playground",
    url: "https://go.dev/play/",
    kind: "playground",
    description: "A zero-setup place to change a small program and immediately run it.",
  },
  {
    label: "Community: Go by Example",
    url: "https://gobyexample.com/",
    kind: "doc",
    description: "A quick second example when you want to see one Go feature in isolation.",
  },
  {
    label: "Community: Learn Go with Tests",
    url: "https://github.com/quii/learn-go-with-tests",
    kind: "repo",
    description: "A beginner-friendly, exercise-led path that teaches Go by writing small tests.",
  },
  {
    label: "Official: Create a Go module",
    url: "https://go.dev/doc/tutorial/create-module",
    kind: "doc",
    description:
      "The official step-by-step module tutorial; use it after functions and basic types.",
  },
  {
    label: "Official: Standard library packages",
    url: "https://pkg.go.dev/std",
    kind: "doc",
    description:
      "Look up packages such as fmt, strings, slices, maps, net/http, and testing as needed.",
  },
  {
    label: "Official: How to Write Go Code",
    url: "https://go.dev/doc/code",
    kind: "doc",
    description: "Official guidance for packages, modules, tests, and a normal Go workspace.",
  },
  {
    label: "Official: Effective Go — use after the fundamentals",
    url: "https://go.dev/doc/effective_go",
    kind: "doc",
    description:
      "Useful idiom and style guidance, but better as a later reference than a first tutorial.",
  },
  {
    label: "Official: The Go Blog",
    url: "https://go.dev/blog/",
    kind: "article",
    description:
      "Authoritative focused explanations from the Go team; follow links from a lesson, not cover to cover.",
  },
  {
    label: "Official: Go language specification — lookup only",
    url: "https://go.dev/ref/spec",
    kind: "doc",
    description: "The exact language rules. Use it to verify a detail, not as a beginner course.",
  },
  {
    label: "Official: Go diagnostics — advanced",
    url: "https://go.dev/doc/diagnostics",
    kind: "doc",
    description:
      "Official guide to profiling, tracing, and runtime diagnostics after the core course.",
  },
  {
    label: "Official talk: Go Concurrency Patterns",
    url: "https://www.youtube.com/watch?v=f6kdp27TYZs",
    kind: "video",
    description: "A classic talk from the Go team; save it for the optional concurrency module.",
  },
  {
    label: "Official: Editor setup with gopls",
    url: "https://go.dev/gopls/",
    kind: "tool",
    description:
      "Set up the official language server for completion, navigation, formatting, and diagnostics.",
  },
  {
    label: "Official: Go documentation index",
    url: "https://go.dev/doc/",
    kind: "doc",
    description:
      "The complete official index for tutorials, module guidance, diagnostics, security, and reference material not expanded into a core lesson.",
  },
];
