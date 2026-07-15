import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 2 — maps: Go's built-in hash table. Written in the same beginner-friendly
 * voice as Module 0/1: plain language, one analogy per hard idea, a concrete
 * example before every abstract rule. Reframes go.dev material on maps, the
 * comma-ok idiom, deletion, unspecified iteration order, and nil-map panics into
 * learner-facing prose.
 */
export const goMaps: Lesson = {
  id: "go-maps",
  slug: "maps",
  title: "Maps",
  description:
    "Learn Go's built-in key→value collection: lookup, the comma-ok idiom, why a missing key is not an error, and why iteration order must not be relied on.",
  moduleId: "go-2",
  estimatedMinutes: 50,
  difficulty: "beginner",
  prerequisites: ["go-slices"],
  learningObjectives: [
    "Create, read, write, and delete map entries, and predict what a missing key returns",
    "Use the comma-ok idiom to tell 'absent' apart from 'present but zero'",
    "Explain why map iteration order is unspecified and never write code that depends on it",
  ],
  concepts: ["maps", "comma-ok", "iteration-order"],
  references: [
    {
      title: "Go maps in action — The Go Blog",
      url: "https://go.dev/blog/maps",
      teaches:
        "How to create, read, write, delete, and iterate maps, plus the comma-ok idiom and nil-map behavior.",
      relevance:
        "The authoritative, example-driven walkthrough of exactly the material in this lesson.",
      required: false,
      section: "Iteration order; Exploiting zero values; The comma ok idiom",
    },
    {
      title: "A Tour of Go: Maps",
      url: "https://go.dev/tour/moretypes/19",
      teaches:
        "The syntax for make, insert, read, delete, and the two-value comma-ok read, with runnable examples.",
      relevance: "The gentlest official introduction to the map operations practiced here.",
      required: false,
      section: "Maps; Mutating Maps",
    },
    {
      title: "The Go Programming Language Specification: Map types",
      url: "https://go.dev/ref/spec#Map_types",
      teaches:
        "The normative rules: keys must be comparable, a nil map is read-only, and reading a missing key yields the zero value.",
      relevance:
        "Confirms the comparable-key and nil-map rules are language guarantees, not compiler accidents.",
      required: false,
      section: "Map types",
    },
  ],
  exercises: [
    {
      id: "go2mp-predict-missing",
      type: "prediction",
      prompt:
        'Given `counts := map[string]int{}` and no writes yet, predict what `fmt.Println(counts["apple"])` prints, and why it doesn\'t error.',
      expectedAnswer:
        "0 — reading a key that is absent returns the value type's zero value (int → 0), never an error.",
      hints: ["A missing key is not an error in Go.", "What is the zero value of int?"],
    },
    {
      id: "go2mp-read-commaok",
      type: "code-reading",
      prompt:
        'Read `m := map[string]int{"a": 0}` then `v, ok := m["a"]` and `w, ok2 := m["b"]`. State the value of v, ok, w, and ok2, and explain what ok distinguishes that the value alone cannot.',
      hints: [
        "Both a's value and a missing key look like 0.",
        "ok is true only when the key is actually present.",
      ],
    },
    {
      id: "go2mp-implement-wordcount",
      type: "implementation",
      prompt:
        "Implement countWords so it returns a map from each word to the number of times it appears in the input slice.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc countWords(words []string) map[string]int {\n  // build and return a frequency map\n  return nil\n}\n\nfunc main() {\n  fmt.Println(countWords([]string{"go", "go", "map"}))\n} // want: map[go:2 map:1]',
      expectedAnswer:
        "func countWords(words []string) map[string]int {\n  counts := make(map[string]int)\n  for _, w := range words {\n    counts[w]++\n  }\n  return counts\n}",
      hints: [
        "make the map first — writing to a nil map panics.",
        "counts[w]++ works even the first time, because the missing key reads as 0.",
      ],
    },
    {
      id: "go2mp-debug-nilmap",
      type: "debugging",
      prompt:
        'This panics at runtime: `var seen map[string]bool` then `seen["x"] = true`. Explain the panic message and fix it with a one-line change.',
      hints: [
        "A var-declared map is nil until you make it.",
        "Reading a nil map is fine; writing to it panics.",
      ],
    },
    {
      id: "go2mp-refactor-slice-lookup",
      type: "refactoring",
      prompt:
        "A function finds an account by scanning a `[]Account` slice in a loop (O(n) per lookup). Refactor it to index the accounts in a `map[string]Account` and explain what the lookup cost becomes.",
      hints: [
        "Build the map once, then look up by key.",
        "Slice scan is O(n); a map lookup is average O(1).",
      ],
    },
    {
      id: "go2mp-design-order",
      type: "design",
      prompt:
        "A report must list accounts in a stable, alphabetical order, but the data lives in a map. Design how you produce the ordered output, and state why ranging over the map directly is wrong.",
      hints: ["Collect the keys into a slice.", "sort the keys, then range over the sorted slice."],
    },
    {
      id: "go2mp-advanced-set",
      type: "advanced",
      prompt:
        "Using a map, implement a set of strings with add, contains, and remove. Explain why `map[string]struct{}` is the idiomatic value type for a set and what it saves compared to `map[string]bool`.",
      hints: [
        "struct{} occupies zero bytes — you only care about the key's presence.",
        "Use comma-ok for contains; delete for remove.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-missing-key",
      kind: "explain",
      description:
        "Explain what reading a missing key returns and why the comma-ok idiom is needed.",
      required: true,
    },
    {
      id: "predict-iteration",
      kind: "predict",
      description:
        "Correctly predict that map iteration order is unspecified and may differ between runs.",
      required: true,
    },
    {
      id: "implement-frequency-map",
      kind: "implement",
      description:
        "Write a correctly-initialized map that counts or indexes values and compiles cleanly.",
      required: true,
    },
    {
      id: "design-ordered-output",
      kind: "design",
      description: "Defend a design that produces deterministic ordered output from map data.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Programs constantly need to answer 'given this key, what's the value?' — given an account ID, which account; given a word, how many times it appeared. You could keep a list and search it every time, but searching a list means checking items one by one, which gets slower as the list grows.\n\nGo's answer is the **map**: a built-in structure that stores key→value pairs and finds the value for a key almost instantly, no matter how many pairs it holds. A map is Go's version of what other languages call a hash table, dictionary, or associative array.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A map is like a coat check. You hand over a coat (the value) and get a numbered ticket (the key). Later you show the ticket and the attendant walks straight to that slot — they don't check every coat on the rack. That direct jump is what makes lookups fast.",
          },
        },
        {
          type: "points",
          items: [
            "A **map** stores **key→value** pairs and looks up a value by its key.",
            "Lookup is **average O(1)** — roughly constant time, regardless of size.",
            "It replaces slow 'scan the whole list' searches with a direct jump to the answer.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep four facts in your head and almost everything about maps follows.\n\nFirst, **a missing key reads as the zero value, never an error**. Second, **the comma-ok read `v, ok := m[k]` tells you presence** — `ok` is `true` only when the key exists. Third, **iteration order is unspecified** — it is not guaranteed to stay the same, so never rely on it. Fourth, **a nil map reads fine but panics if you write to it** — you must `make` it (or use a literal) before adding entries.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The four-sentence rule",
            text: "Missing key → zero value (not an error). `v, ok := m[k]` → ok reveals presence. Iteration order → unspecified, never depend on it. Nil map → readable, but writing panics until you make it.",
          },
        },
        {
          type: "example",
          example: {
            title: "Comma-ok in one glance",
            language: "go",
            code: 'ages := map[string]int{"ada": 36}\n\nv, ok := ages["ada"]  // v == 36, ok == true\nw, ok2 := ages["bob"] // w == 0,  ok2 == false\n\nif _, exists := ages["bob"]; !exists {\n    fmt.Println("bob not found")\n}',
            takeaway:
              "`ok` is the signal: 36/true means present, 0/false means absent. The value 0 alone could never tell you that.",
          },
        },
      ],
    },
    mechanics: {
      body: 'Now the precise operations. You create a map with `make(map[K]V)` (K is the key type, V the value type), or with a literal like `map[string]int{"a": 1}`. You **write** with `m[key] = value`, **read** with `m[key]` (or the two-value `v, ok := m[key]`), **delete** one key with `delete(m, key)`, remove every entry with `clear(m)`, and get the number of entries with `len(m)`.\n\nTwo rules constrain what you can do. Keys must be **comparable** — usable with `==` — so strings, numbers, booleans, and structs of those work as keys, but slices, maps, and functions cannot be keys. And a map you only *declared* (`var m map[K]V`) is **nil**: reading it is safe and returns zero values, but writing to it panics. You must initialize it first.',
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The map operations",
            kind: "stack",
            nodes: [
              {
                id: "make",
                label: "make(map[string]int)",
                detail: "create an empty, writable map",
              },
              { id: "write", label: 'm["a"] = 1', detail: "insert or overwrite a key" },
              {
                id: "read",
                label: 'v, ok := m["a"]',
                detail: "read value + presence flag",
                tone: "accent",
              },
              { id: "del", label: 'delete(m, "a")', detail: "remove a key (safe even if absent)" },
              { id: "len", label: "len(m)", detail: "number of entries" },
            ],
          },
        },
        {
          type: "example",
          example: {
            title: "Every operation once",
            language: "go",
            code: 'm := make(map[string]int) // empty, writable\nm["a"] = 1                 // write\nm["a"]++                   // read-modify-write → 2\nv, ok := m["a"]            // v == 2, ok == true\ndelete(m, "a")             // remove; deleting a missing key is a no-op\nfmt.Println(len(m), v, ok) // 0 2 true',
            takeaway:
              "make, write, read-with-ok, delete, len — these five cover almost all day-to-day map use.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Nil map trap",
            text: '`var m map[string]int` is nil. `m["a"] = 1` panics with \'assignment to entry in nil map\'. Reading `m["a"]` is fine (returns 0). Always `make` a map before writing to it.',
          },
        },
      ],
    },
    diagram: {
      body: "Let's picture the difference between a nil map and a made map — the distinction behind the most common beginner panic. A nil map is a map-shaped variable with no underlying storage: you can look at it, but there's nowhere to put anything. `make` allocates the actual hash table, giving writes a place to land. Select a state below to see what each operation does.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Nil map vs made map",
            kind: "compare",
            nodes: [
              {
                id: "nil",
                label: "var m map[string]int (nil)",
                detail: "read → 0 (ok); write → PANIC; no storage allocated",
                tone: "danger",
              },
              {
                id: "made",
                label: "m := make(map[string]int)",
                detail: "read → 0 (ok); write → stored; storage allocated",
                tone: "success",
              },
            ],
            caption:
              "Reading behaves the same for both. Only writing separates them: a nil map has nowhere to store the entry.",
          },
        },
      ],
    },
    implementation: {
      body: "The most common real use is counting or indexing. Both lean on the zero-value rule: because a missing key reads as `0`, you can write `counts[word]++` without first checking whether the word is there — the first `++` starts from `0` and becomes `1`. This is what makes map code short and clean in Go.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A frequency counter",
            language: "go",
            code: 'package main\n\nimport "fmt"\n\nfunc main() {\n    words := []string{"go", "go", "map", "go"}\n    counts := make(map[string]int)\n\n    for _, w := range words {\n        counts[w]++ // first time: 0 + 1; the zero value does the setup for you\n    }\n\n    fmt.Println(counts["go"])  // 3\n    fmt.Println(counts["map"]) // 1\n}',
            takeaway:
              "`counts[w]++` works on the first sight of a word because the absent key reads as 0. No 'if key exists' check needed.",
          },
        },
        {
          type: "points",
          items: [
            "Initialize with `make` (or a literal) before writing.",
            "Lean on the zero value: `m[k]++` and `m[k] += n` need no prior check.",
            "For indexing, store whole values keyed by their ID: `byID[a.ID] = a`.",
          ],
        },
      ],
    },
    experiment: {
      body: 'Before reading on, commit to a prediction — a corrected wrong guess sticks far better than a right answer you skimmed. Consider this loop that prints a map\'s keys, run twice in the same program:\n\n`m := map[string]int{"a": 1, "b": 2, "c": 3}` then two separate `for k := range m { fmt.Print(k) }` loops.\n\nWill the two loops print the keys in the *same* order? Decide now, then reveal.\n\nThe answer is **no — the order is not guaranteed, and Go deliberately randomizes it**. You might see `abc` then `cab`, or any other arrangement. Go\'s runtime intentionally starts iteration at a random point precisely so that programmers *cannot* accidentally depend on a stable order. The lesson: a map has no order.\n\nIf you need one — alphabetical, insertion order, sorted by value — you must produce it yourself by collecting the keys into a slice and sorting that slice. Relying on `range` order is a classic bug that appears to work on your machine and then breaks somewhere else.',
    },
    "failure-cases": {
      body: "Almost every map bug at this level is one of a small handful. Here are the ones you'll actually meet, and the signal each gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**Writing to a nil map** → runtime panic `assignment to entry in nil map`. You forgot to `make` it.",
            "**Trusting a zero value** → treating `0`/`\"\"`/`false` as 'present'. Use `v, ok := m[k]` instead.",
            "**Depending on iteration order** → works locally, breaks elsewhere. Sort keys explicitly for stable output.",
            "**Using an uncomparable key type** → compile error `invalid map key type`. Slices, maps, and funcs can't be keys.",
            "**Expecting delete to error on a missing key** → it doesn't; `delete(m, k)` on an absent key is a safe no-op.",
            "**Replacing a map just to empty it** → `clear(m)` removes all entries while keeping the map ready for reuse.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The nil-map panic, live",
            language: "go",
            code: 'var seen map[string]bool // nil: declared but not made\nseen["x"] = true         // panic: assignment to entry in nil map\n\n// fix:\nseen = make(map[string]bool)\nseen["x"] = true         // ok',
            takeaway:
              "A declared-but-not-made map is nil. Reading it is fine; the first write panics until you make it.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Maps are the right default for lookups, but they come with costs. The goal is a choice you can defend, plus the evidence that would change it.",
      blocks: [
        {
          type: "points",
          items: [
            "**Map vs slice**: a map gives average O(1) lookup by key; a slice keeps order and is faster to iterate in sequence. Choose by whether you look up by key or process in order.",
            "**No inherent order**: maps trade ordering for speed. If you need stable output, you pay to sort keys — an explicit, visible cost.",
            "**Average O(1), not guaranteed**: lookups are usually constant time, but hashing has overhead and worst cases exist. For tiny fixed sets, a slice can be simpler and just as fast.",
            "**Comparable keys only**: convenient for strings and ints, but you cannot key by a slice or another map without first turning it into something comparable (like a string).",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into habits. Reach for a map when the main operation is 'look up a value by a key'. Always initialize before writing. Use comma-ok whenever a zero value could also be a legitimate stored value. And treat map order as nonexistent: if output must be ordered, sort the keys explicitly so the behavior is deterministic and visible to the next reader.",
      blocks: [
        {
          type: "points",
          items: [
            "Use a map for keyed lookup; use a slice when order or sequential processing matters.",
            "Always `make` (or use a literal) before writing.",
            "Use comma-ok whenever absent and zero must be told apart.",
            "For ordered output, collect keys into a slice and sort — never rely on `range` order.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A deterministic report",
            context:
              "A monthly statement lists accounts stored in a map. Ranging the map directly produced a different order every run, confusing reviewers who diffed the output.",
            insight:
              "Collecting the keys, sorting them, then ranging the sorted slice makes the report identical across runs — order becomes a design decision, not an accident.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain what a missing key returns and why comma-ok exists, predict that iteration order is unspecified and may change between runs, write a correctly-initialized counting or indexing map, and defend a design that produces deterministic ordered output from a map. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "A map is Go's built-in hash table: key→value lookup in average O(1). Four facts carry the whole lesson — keep them straight and maps stop surprising you.",
      blocks: [
        {
          type: "points",
          items: [
            "Reading a missing key returns the value's **zero value**, never an error.",
            "`v, ok := m[k]` — `ok` reveals presence, distinguishing absent from present-but-zero.",
            "Iteration order is **not specified or guaranteed** — sort keys yourself for stable output.",
            "A **nil map** reads fine but panics on write; `make` it first. Keys must be comparable.",
            "Next: learn how Go stores and iterates over UTF-8 text.",
          ],
        },
      ],
    },
  },
};
