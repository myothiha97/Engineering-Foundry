import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 2, lesson 1 — arrays, slices, and the backing array. Written in the same
 * beginner-friendly voice as Modules 0 and 1: plain language, one analogy per hard
 * idea, a concrete example before every abstract rule. Reframes go.dev's slice
 * material around the emotional core: the aliasing trap, where append into a
 * sub-slice silently overwrites its parent because they share memory.
 */
export const goSlices: Lesson = {
  id: "go-slices",
  slug: "slices",
  title: "Arrays, slices & backing arrays",
  description:
    "Learn how a slice is a small window onto a shared backing array, when append reallocates, and why two slices can quietly corrupt each other's data.",
  moduleId: "go-2",
  estimatedMinutes: 60,
  difficulty: "beginner",
  prerequisites: ["go-copy-semantics"],
  learningObjectives: [
    "Predict when append reallocates a slice and when it writes into shared memory",
    "Explain the three fields of a slice header — pointer, length, capacity — in plain words",
    "Use s[i:j:k] and copy to hand out slice data without aliasing the original",
  ],
  concepts: ["arrays", "slices", "backing-array", "append", "aliasing"],
  references: [
    {
      title: "Go Slices: usage and internals — The Go Blog",
      url: "https://go.dev/blog/slices-intro",
      teaches:
        "How arrays and slices relate, the slice header, and how slicing shares a backing array.",
      relevance:
        "The gentlest official walkthrough of exactly the mental model this lesson builds.",
      required: false,
      section: "Arrays; Slices; Slice internals",
    },
    {
      title: "Arrays, slices (and strings): The mechanics of 'append' — The Go Blog",
      url: "https://go.dev/blog/slices",
      teaches: "Exactly how append grows a slice and when it allocates a new backing array.",
      relevance:
        "The authoritative explanation behind this lesson's reallocation and aliasing stages.",
      required: false,
      section: "The anatomy of append; Growing slices",
    },
    {
      title: "The Go Programming Language Specification: Slice types",
      url: "https://go.dev/ref/spec#Slice_types",
      teaches:
        "The normative rules for slice length, capacity, and the three-index slice expression.",
      relevance: "Confirms the s[i:j:k] capacity rule is a language guarantee, not a convention.",
      required: false,
      section: "Slice types; Slice expressions",
    },
  ],
  exercises: [
    {
      id: "go2sl-predict-alias",
      type: "prediction",
      prompt:
        "Given `a := []int{1, 2, 3, 4}` and `b := a[0:2]`, then `b = append(b, 99)`, predict what `a` prints afterward and explain why.",
      expectedAnswer:
        "a prints [1 2 99 4] — b had spare capacity, so append overwrote a[2] in the shared backing array.",
      hints: [
        "b's length is 2 but what is its capacity?",
        "append writes into spare capacity before it ever reallocates.",
      ],
    },
    {
      id: "go2sl-read-header",
      type: "code-reading",
      prompt:
        "Read `s := make([]int, 2, 8)`. State the length, the capacity, and how many more elements you can append before append must reallocate.",
      hints: [
        "make([]T, len, cap) sets both.",
        "Reallocation happens only when length would exceed capacity.",
      ],
    },
    {
      id: "go2sl-implement-safeslice",
      type: "implementation",
      prompt:
        "Implement clone so it returns an independent copy of the input slice — mutating the result must never affect the original.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc clone(src []int) []int {\n  // return a copy that shares no backing array with src\n  return nil\n}\n\nfunc main() {\n  a := []int{1, 2, 3}\n  b := clone(a)\n  b[0] = 99\n  fmt.Println(a, b) // want: [1 2 3] [99 2 3]\n}',
      expectedAnswer:
        "func clone(src []int) []int { dst := make([]int, len(src)); copy(dst, src); return dst }",
      hints: [
        "make a destination of len(src).",
        "copy(dst, src) copies element-by-element into fresh memory.",
      ],
    },
    {
      id: "go2sl-debug-append",
      type: "debugging",
      prompt:
        "A function does `func firstTwo(s []int) []int { return append(s[:2], -1) }`. Callers report their original slice gets a stray -1 in it. Explain the bug and fix it.",
      hints: [
        "s[:2] still points at the caller's backing array.",
        "Cap the capacity with a three-index slice, or copy first.",
      ],
    },
    {
      id: "go2sl-refactor-batch",
      type: "refactoring",
      prompt:
        "A batching function slices a shared buffer with `batch := buf[start:end]` and appends to it. Refactor so each batch is safe to append to without touching the shared buffer.",
      hints: [
        "Give each batch its own capacity limit with buf[start:end:end].",
        "Or copy the range into a fresh slice.",
      ],
    },
    {
      id: "go2sl-design-nil",
      type: "design",
      prompt:
        "Decide whether a search function with no matching books should return a nil slice or an empty non-nil slice, and state what evidence would change your choice.",
      hints: [
        "Both have length 0 and both range/append fine.",
        "Does the JSON encoder or a caller distinguish null from []?",
      ],
    },
    {
      id: "go2sl-advanced-grow",
      type: "advanced",
      prompt:
        "Write a short program that appends to a slice in a loop and prints len and cap each iteration. Explain the capacity pattern you observe and why append over-allocates instead of growing by one.",
      hints: [
        "Print len(s), cap(s) after each append.",
        "Amortized growth: doubling keeps total copying cost linear.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-header",
      kind: "explain",
      description:
        "Explain in plain words what a slice header holds and how it points at a backing array.",
      required: true,
    },
    {
      id: "predict-realloc",
      kind: "predict",
      description:
        "Correctly predict when append writes into shared memory versus reallocating a new backing array.",
      required: true,
    },
    {
      id: "implement-copy",
      kind: "implement",
      description:
        "Write code that hands out slice data without aliasing the original, using copy or a three-index slice.",
      required: true,
    },
    {
      id: "design-slice-api",
      kind: "design",
      description: "Defend a slice-returning API choice: copy vs share and nil vs empty.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Almost every Go program keeps lists of things: a list of transactions, of users, of log lines. Go's everyday tool for a list is the **slice** — a growable sequence you can append to. Slices feel simple and friendly, which is exactly why they cause some of the most surprising bugs beginners hit.\n\nThe surprise is this: two slices can secretly share the same underlying memory. Change one, and the other changes too — until, at some unpredictable moment, they silently stop sharing. If you don't understand what a slice really *is* underneath, this looks like magic or a compiler bug. It's neither. It's the direct, predictable result of one simple design.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A slice is like a bookmark and a page count clipped onto a shared book (the backing array). Two people can clip bookmarks onto the same book. If one of them writes in the margin, the other sees it — because it's the same book, not a photocopy.",
          },
        },
        {
          type: "points",
          items: [
            "A **slice** is Go's growable list — you `append` to it as it grows.",
            "Two slices can share the same underlying **backing array** (the actual stored data).",
            "Most slice bugs are just confusion about *when* two slices share memory and *when* they stop.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep this one picture and nearly everything about slices follows. A slice header is three fields: **ptr** (where the window starts), **len** (how many elements are in view), and **cap** (how many elements exist from ptr to the end of the backing array).\n\n`append` follows a single rule against these three fields: if `len < cap`, there's spare room, so it writes the new element into the backing array *in place* and returns a header with `len` one larger — still the same array, still shared. If `len == cap`, there's no room, so it allocates a **brand-new, bigger backing array**, copies everything over, and returns a header pointing at the new array — now *unshared*. Reallocation is the exact moment two slices stop sharing.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-sentence rule",
            text: "append writes into the shared backing array while there's spare capacity (len < cap); the instant capacity runs out (len == cap), it reallocates and the slices quietly go their separate ways.",
          },
        },
        {
          type: "example",
          example: {
            title: "len, cap, and the two outcomes of append",
            language: "go",
            code: "s := make([]int, 2, 3) // len 2, cap 3 → one spare slot\nfmt.Println(len(s), cap(s)) // 2 3\n\ns = append(s, 10) // len 2 < cap 3: writes in place, still same array\nfmt.Println(len(s), cap(s)) // 3 3\n\ns = append(s, 20) // len 3 == cap 3: REALLOCATES a bigger array\nfmt.Println(len(s), cap(s)) // 4 6 (new, larger backing array)",
            takeaway:
              "The first append reused memory; the second had no room and moved to a fresh, larger array. cap tells you which will happen.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules. The **length** is what `len(s)` returns and what you can index or range over. The **capacity**, `cap(s)`, is the number of elements from the slice's start to the end of its backing array. `make([]T, len, cap)` sets both; a literal like `[]int{1,2,3}` gives `len == cap == 3`.\n\nWhen you slice with `a[i:j]`, the result has length `j - i` and capacity `cap(a) - i` — it keeps everything from `i` to the end of the array, which is why a short sub-slice can still have large spare capacity reaching past its own length. The **three-index slice** `a[i:j:k]` lets you cap that: the result has length `j - i` and capacity `k - i`, so you can deliberately cut off the spare capacity you don't want to share.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How append decides: reuse or reallocate",
            kind: "flow",
            nodes: [
              { id: "app", label: "append(s, x)", detail: "add one element" },
              {
                id: "check",
                label: "len < cap?",
                detail: "is there spare capacity?",
                tone: "accent",
              },
              {
                id: "reuse",
                label: "reuse array",
                detail: "write in place, len+1 — still shared",
                tone: "success",
              },
              {
                id: "grow",
                label: "reallocate",
                detail: "new bigger array, copy, len+1 — now unshared",
                tone: "danger",
              },
            ],
            caption:
              "len < cap → reuse the shared backing array. len == cap → allocate a new one and stop sharing.",
          },
        },
        {
          type: "example",
          example: {
            title: "Capacity carries past the length; the third index caps it",
            language: "go",
            code: "a := []int{1, 2, 3, 4, 5}\n\nb := a[1:3]      // len 2, cap 4  (reaches to end of a)\nfmt.Println(len(b), cap(b)) // 2 4\n\nc := a[1:3:3]    // len 2, cap 2  (third index caps capacity)\nfmt.Println(len(c), cap(c)) // 2 2",
            takeaway:
              "b can append into a's memory (cap 4); c cannot (cap 2), so appending to c forces a reallocation instead of touching a.",
          },
        },
        {
          type: "points",
          items: [
            "`a[i:j]`: length `j-i`, capacity `cap(a)-i` — spare capacity reaches to the array's end.",
            "`a[i:j:k]`: length `j-i`, capacity `k-i` — the third index caps capacity to protect the parent.",
            "`len(s)` is what you can see; `cap(s)` is what append can fill before it must reallocate.",
          ],
        },
      ],
    },
    diagram: {
      body: "Let's picture the aliasing trap directly. Below is one backing array with two slices, `a` and `b`, laid on top of it. `b := a[0:2]` sees only the first two elements, but its capacity reaches across the whole array. Select a layer to see its pointer, length, and capacity — and watch how an append through `b` lands on memory that `a` still sees.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two slices, one backing array",
            kind: "stack",
            nodes: [
              {
                id: "arr",
                label: "backing array [1 2 3 4]",
                detail: "the real memory both slices point into",
              },
              { id: "a", label: "a — ptr=0, len=4, cap=4", detail: "sees all four elements" },
              {
                id: "b",
                label: "b = a[0:2] — ptr=0, len=2, cap=4",
                detail: "sees two, but capacity spans all four",
                tone: "accent",
              },
              {
                id: "app",
                label: "append(b, 99) writes index 2",
                detail: "index 2 is inside a's view → a sees 99",
                tone: "danger",
              },
            ],
            caption:
              "b's length is 2, but its capacity (4) reaches into a's data — so appending through b overwrites what a sees.",
          },
        },
      ],
    },
    implementation: {
      body: "In practice you defend against aliasing with two tools. Use **`copy`** when you want a genuinely independent slice: `copy(dst, src)` copies element-by-element into `dst`'s own memory, and paired with `make` it gives you a clean, unshared duplicate. Use the **three-index slice** `s[i:j:j]` when you want to hand out a window but forbid the receiver from appending into your memory — by capping capacity to the length, any append they do is forced to reallocate.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Two safe ways to hand out slice data",
            language: "go",
            code: 'package main\n\nimport "fmt"\n\nfunc clone(src []int) []int {\n    dst := make([]int, len(src)) // fresh backing array\n    copy(dst, src)               // element-by-element copy\n    return dst                   // shares nothing with src\n}\n\nfunc main() {\n    a := []int{1, 2, 3, 4}\n\n    safe := clone(a[0:2]) // independent copy\n    safe = append(safe, 99)\n    fmt.Println(a)        // [1 2 3 4]  <- untouched\n\n    capped := a[0:2:2]    // cap == len, so append must reallocate\n    capped = append(capped, 77)\n    fmt.Println(a)        // [1 2 3 4]  <- still untouched\n}',
            takeaway:
              "clone copies into new memory; a[0:2:2] caps capacity so any append reallocates instead of overwriting a. Both keep a safe.",
          },
        },
        {
          type: "points",
          items: [
            "`copy(dst, src)` copies min(len(dst), len(src)) elements into dst's own memory.",
            "`make([]T, n)` then `copy` = a fully independent duplicate.",
            "`clear(s)` resets every element to its zero value without changing the slice's length or capacity.",
            "`s[i:j:j]` caps capacity to the length, so the receiver's append can never touch your data.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before reading on, commit to a prediction — a corrected wrong guess sticks far better than a right answer you skimmed. Consider:\n\n`a := []int{1, 2, 3, 4}`\n`b := a[0:2]`\n`b = append(b, 100)`\n`b = append(b, 200)`\n\nAfter these two appends, what does `a` print? Decide now, then reveal.\n\nThe answer is **[1 2 100 200]**. Walk it through: `b` starts with len 2, cap 4. The first `append(b, 100)` has spare room (2 < 4), so it writes `100` into `a[2]` in place — `a` becomes `[1 2 100 4]`. The second `append(b, 200)` now has len 3, cap 4, still room, so it writes `200` into `a[3]` — `a` becomes `[1 2 100 200]`.\n\nThe lesson: because capacity was 4, *both* appends fit in the shared array, and both overwrote `a`. As long as capacity holds, every append keeps corrupting the parent — the danger doesn't stop after one write. Only when capacity is finally exceeded does `b` reallocate and leave `a` alone.",
    },
    "failure-cases": {
      body: "Nearly every slice bug at this level traces to one root: assuming slices are independent when they still share a backing array. Here are the ones you'll actually meet, and the signal each gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**append into a sub-slice** → the parent's elements change with no visible assignment. Cap capacity or copy.",
            "**Returning `s[i:j]` from a function** → the caller can append into your internal memory. Return a copy.",
            "**Keeping a small slice of a huge array** → the whole array stays in memory (can't be freed). Copy out the part you need.",
            "**Assuming `append` never moves** → after reallocation, an old alias no longer tracks the new data. Always reassign: `s = append(s, x)`.",
            "**Confusing nil and empty** → both have length 0, but `s == nil` is true only for the nil slice. Range and append treat them identically.",
          ],
        },
        {
          type: "example",
          example: {
            title: "A big array kept alive by a tiny slice",
            language: "go",
            code: "func firstByte(huge []byte) []byte {\n    return huge[0:1] // shares huge's backing array\n    // huge (maybe megabytes) cannot be garbage-collected\n    // while this 1-element slice is alive!\n}\n\n// Fix: copy the bytes you actually need out.\nfunc firstByteSafe(huge []byte) []byte {\n    out := make([]byte, 1)\n    copy(out, huge)\n    return out // huge is now free to be collected\n}",
            takeaway:
              "A slice keeps its entire backing array alive. Copy out small pieces so the large original can be freed.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Sharing versus copying is a genuine trade-off, and the right call depends on what you're protecting. The goal is a choice you can defend, plus the evidence that would change your mind.",
      blocks: [
        {
          type: "points",
          items: [
            "**Sharing (plain slicing)**: zero allocation, instant — but the receiver can mutate or corrupt your data via append.",
            "**Copying (`make` + `copy`)**: fully safe and independent — but costs an allocation and O(n) copy each time.",
            "**Capping with `s[i:j:j]`**: cheap safety against append (forces reallocation) — but doesn't stop the receiver from mutating existing elements in place.",
            "**nil vs empty slice**: nil signals 'no result' and encodes as JSON `null`; an empty slice encodes as `[]`. Pick based on what callers and encoders need.",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into durable habits. Treat any slice you hand out or receive as potentially shared unless you copied it. When you return internal data from a store or service, return a copy so callers can't reach back into your state. When you slice a range you'll append to, cap its capacity with the three-index form. And always write `s = append(s, x)` — reassigning the result — because append may have moved the data to a new array.",
      blocks: [
        {
          type: "points",
          items: [
            "Return copies of internal slices; never hand out a live view of your own state.",
            "Cap capacity with `s[i:j:j]` before giving a sub-slice to code that appends.",
            "Always reassign: `s = append(s, x)` — the backing array may have moved.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A store that can't be corrupted from outside",
            context:
              "A transaction store keeps its records in an internal slice. A handler asks for the list, then appends a temporary marker to what it received before rendering.",
            insight:
              "If the store returns its live slice, the handler's append can overwrite real records. Returning a copy makes the store immune to whatever callers do.",
          },
        },
      ],
    },
    mastery: {
      body: "You understand this lesson when you can explain what a slice header holds, predict when `append` will reuse an array, and return slice data without accidental sharing. Check a criterion only when you can demonstrate it without copying the lesson.",
    },
    summary: {
      body: "One picture carries this whole lesson: **a slice is a three-field header — pointer, length, capacity — describing a window onto a shared backing array.** Keep that in mind and the 'magic' disappears entirely.",
      blocks: [
        {
          type: "points",
          items: [
            "Slicing (`a[i:j]`) shares memory; it never copies.",
            "append reuses the backing array while `len < cap`, and reallocates (stops sharing) when `len == cap`.",
            "Cap capacity with `a[i:j:k]`, or use `make` + `copy`, to hand out data without aliasing.",
            "nil and empty slices both have length 0 and both append fine; only nil equals nil.",
            "Always write `s = append(s, x)` — the array may have moved.",
            "Next up: maps and how Go stores key-value data.",
          ],
        },
      ],
    },
  },
};
