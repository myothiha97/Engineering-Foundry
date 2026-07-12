import type { Resource } from "@platform/content-schema";

/**
 * Curated, widely-recommended Go resources shown in the portal's Resources hub.
 * Popular GitHub repositories plus the official interactive docs. Star counts are
 * rough display hints, not live data.
 */
export const goResources: Resource[] = [
  {
    label: "A Tour of Go",
    url: "https://go.dev/tour/",
    kind: "playground",
    description: "The official interactive tour — run Go in the browser, concept by concept.",
  },
  {
    label: "Go by Example",
    url: "https://gobyexample.com/",
    kind: "doc",
    description: "Hands-on, annotated example programs for nearly every language feature.",
  },
  {
    label: "Effective Go",
    url: "https://go.dev/doc/effective_go",
    kind: "doc",
    description: "How to write clear, idiomatic Go — the canonical style reference.",
  },
  {
    label: "The Go Programming Language Specification",
    url: "https://go.dev/ref/spec",
    kind: "doc",
    description: "The normative language rules: types, initialization, and execution.",
  },
  {
    label: "golang/go",
    url: "https://github.com/golang/go",
    kind: "repo",
    description: "The Go language, compiler, runtime, and standard library source.",
    stars: "126k",
  },
  {
    label: "avelino/awesome-go",
    url: "https://github.com/avelino/awesome-go",
    kind: "repo",
    description: "A massive curated list of Go frameworks, libraries, and tools.",
    stars: "140k",
  },
  {
    label: "quii/learn-go-with-tests",
    url: "https://github.com/quii/learn-go-with-tests",
    kind: "repo",
    description: "Learn Go (and TDD) by writing tests first — beginner-friendly and thorough.",
    stars: "23k",
  },
  {
    label: "inancgumus/learngo",
    url: "https://github.com/inancgumus/learngo",
    kind: "repo",
    description: "1000+ hands-on Go exercises and examples, from basics to advanced.",
    stars: "20k",
  },
  {
    label: "tmrts/go-patterns",
    url: "https://github.com/tmrts/go-patterns",
    kind: "repo",
    description: "Idiomatic design, creational, and concurrency patterns in Go.",
    stars: "24k",
  },
  {
    label: "uber-go/guide",
    url: "https://github.com/uber-go/guide",
    kind: "repo",
    description: "Uber's widely-adopted Go style guide with rationale for each rule.",
    stars: "17k",
  },
  {
    label: "golang-standards/project-layout",
    url: "https://github.com/golang-standards/project-layout",
    kind: "repo",
    description: "A common (community) layout for structuring real Go applications.",
    stars: "51k",
  },
  {
    label: "The Go Blog",
    url: "https://go.dev/blog/",
    kind: "article",
    description: "Authoritative deep-dives from the Go team on slices, errors, concurrency, GC, and more.",
  },
  {
    label: "How to Write Go Code",
    url: "https://go.dev/doc/code",
    kind: "doc",
    description: "The canonical guide to organizing packages, modules, and a Go workspace.",
  },
  {
    label: "Go FAQ",
    url: "https://go.dev/doc/faq",
    kind: "doc",
    description: "Answers to the design and 'why does Go do X' questions every learner hits.",
  },
  {
    label: "Editor plugins & gopls",
    url: "https://go.dev/gopls",
    kind: "tool",
    description: "Set up a first-class Go editing experience with the official language server.",
  },
  {
    label: "Managing dependencies",
    url: "https://go.dev/doc/modules/managing-dependencies",
    kind: "doc",
    description: "Day-to-day workflow for adding, upgrading, and pruning module dependencies.",
  },
  {
    label: "Learn Go Programming — freeCodeCamp (7h)",
    url: "https://www.youtube.com/watch?v=YS4e4q9oBaU",
    kind: "video",
    description: "A thorough, beginner-friendly full-length Go video course.",
  },
  {
    label: "Rob Pike — Go Concurrency Patterns",
    url: "https://www.youtube.com/watch?v=f6kdp27TYZs",
    kind: "video",
    description: "The classic talk on goroutines, channels, and composition from a Go creator.",
  },
  {
    label: "Rob Pike — Concurrency is not Parallelism",
    url: "https://www.youtube.com/watch?v=oV9rvDllKEg",
    kind: "video",
    description: "The mental model that clears up the most common concurrency confusion.",
  },
  {
    label: "justforfunc — Programming in Go",
    url: "https://www.youtube.com/c/justforfunc",
    kind: "video",
    description: "Francesc Campoy's hands-on Go series covering many practical topics.",
  },
];
