import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 8 — unsafe & cgo, the two escape hatches out of Go's safety and
 * portability guarantees. Same beginner-friendly voice as earlier modules:
 * plain language, one analogy per hard idea, a concrete example before the
 * abstract rule. Deliberately framed around JUDGEMENT and trade-offs, not as a
 * how-to for reckless use. Careful about the uintptr-is-not-a-reference bug,
 * cgo's boundary cost, and static-vs-dynamic linking (CGO_ENABLED=0).
 */
export const goUnsafeCgo: Lesson = {
  id: "go-unsafe-cgo",
  slug: "unsafe-cgo",
  title: "unsafe & cgo",
  description:
    "Understand Go's two escape hatches — the `unsafe` package and `cgo` — well enough to know when they are justified, what safety and portability they cost you, and why `CGO_ENABLED=0` gives you a self-contained static binary.",
  moduleId: "go-8",
  estimatedMinutes: 50,
  difficulty: "advanced",
  prerequisites: ["go-stack-heap-escape"],
  learningObjectives: [
    "Explain what `unsafe.Pointer` lets you bypass, recite the valid conversion patterns, and describe the classic uintptr-is-not-a-reference bug",
    "Describe how cgo calls C from Go, the ownership rules for data crossing the boundary, and why each crossing is expensive",
    "Decide between a static (`CGO_ENABLED=0`) and a dynamically linked binary and justify the choice for a deployment target",
  ],
  concepts: ["unsafe.Pointer", "cgo", "static-vs-dynamic-linking"],
  ledgerFlowApplications: [
    "Build LedgerFlow with `CGO_ENABLED=0` so a single static binary drops into a scratch/distroless container with no libc",
    "Weigh whether a cgo dependency (e.g. a C SQLite driver) is worth losing that trivial deployment story",
    "Reject `unsafe` micro-optimizations in the money path unless a benchmark and a written justification demand them",
  ],
  references: [
    {
      title: "Package unsafe — Go standard library",
      url: "https://pkg.go.dev/unsafe",
      teaches:
        "The exact rules for `unsafe.Pointer`: the valid conversion patterns, the uintptr caveats, and Sizeof/Offsetof/Alignof.",
      relevance:
        "This is the normative source for every unsafe rule the lesson states, including why stored uintptr values are unsafe.",
      required: true,
      section: "Pointer",
    },
    {
      title: "cgo — Command Documentation",
      url: "https://pkg.go.dev/cmd/cgo",
      teaches:
        "How the `import \"C\"` pseudo-package and the magic comment work, and the pointer-passing rules across the Go/C boundary.",
      relevance:
        "Grounds the cgo section's ownership and pointer rules (C.CString/C.free, Go-pointers-to-C) in the official spec.",
      required: true,
      section: "Passing pointers",
    },
    {
      title: "C? Go? Cgo! — The Go Blog",
      url: "https://go.dev/blog/cgo",
      teaches: "A worked introduction to calling C from Go, converting strings, and freeing C memory.",
      relevance: "The canonical first read for cgo and the source of the C.CString/C.free idiom shown here.",
      required: false,
      section: "Strings and things",
    },
    {
      title: "Statically compiling Go programs — Martin Tournoij",
      url: "https://www.arp242.net/static-go.html",
      teaches: "Why cgo (and net/os user lookups) can make a Go binary dynamic, and how CGO_ENABLED=0 forces a static build.",
      relevance: "Directly supports the static-vs-dynamic section and the LedgerFlow scratch-container decision.",
      required: false,
      section: "CGO_ENABLED",
    },
  ],
  exercises: [
    {
      id: "go8uc-predict-sizeof",
      type: "prediction",
      prompt:
        "On a 64-bit machine, predict what `unsafe.Sizeof(struct{ a bool; b int64; c bool }{})` returns, and explain why it is not 10. Then say what reordering the fields to `int64, bool, bool` would give.",
      expectedAnswer:
        "It returns 24, not 10. Alignment padding: `b int64` must sit on an 8-byte boundary, so 7 bytes of padding follow `a bool`, and the struct is padded up to a multiple of 8, adding more after `c`. Reordering to `int64, bool, bool` packs the two bools together and gives 16.",
      hints: [
        "Sizeof includes alignment padding, not just the sum of field sizes.",
        "Fields are laid out in declaration order; putting the widest field first reduces padding.",
      ],
    },
    {
      id: "go8uc-read-conversion",
      type: "code-reading",
      prompt:
        "Two conversions. A: `p := unsafe.Pointer(&s); q := (*Header)(p)`. B: `addr := uintptr(unsafe.Pointer(&s)); q := (*Header)(unsafe.Pointer(addr + off))` where `addr` was stored in a variable on a previous line. Which one follows the documented valid patterns and which is a bug?",
      expectedAnswer:
        "A is valid: converting `*T1` to `unsafe.Pointer` to `*T2` is pattern (1) from the docs. B is a bug: the pointer→uintptr→arithmetic→back must happen in a single expression. Storing the address in `addr` and using it on a later line means the GC may move or free the object in between, so `addr` no longer refers to live memory. It must be written as `(*Header)(unsafe.Pointer(uintptr(unsafe.Pointer(&s)) + off))` in one expression.",
      hints: [
        "A uintptr is just an integer — it does not keep the object it points to alive.",
        "The docs require the pointer arithmetic to happen without a uintptr ever resting in a variable across statements.",
      ],
    },
    {
      id: "go8uc-debug-uintptr",
      type: "debugging",
      prompt:
        "This helper caches an address to reuse later. Under GC pressure it occasionally reads garbage or crashes. Explain the bug and fix it.",
      starterCode:
        'func fieldPtr(s *Sample) *int64 {\n    base := uintptr(unsafe.Pointer(s)) // store the address as an integer\n    // ... other work happens here; a GC may run ...\n    return (*int64)(unsafe.Pointer(base + unsafe.Offsetof(s.Total)))\n}',
      expectedAnswer:
        "`base` is a uintptr — a plain integer, not a reference — so it does not keep `*s` alive and is not updated if the GC moves the object. Between storing `base` and using it, `s` may be moved or collected, leaving `base` pointing at stale/garbage memory. Fix: never store the address as a uintptr across statements. Do the arithmetic in one expression while `s` is still a live pointer: `return (*int64)(unsafe.Pointer(uintptr(unsafe.Pointer(s)) + unsafe.Offsetof(s.Total)))`. Better still, avoid unsafe entirely and return `&s.Total`.",
      hints: [
        "Ask what keeps `*s` alive while `base` sits in a variable.",
        "The valid pattern is a single expression; or just use `&s.Total`.",
      ],
    },
    {
      id: "go8uc-implement-b2s",
      type: "implementation",
      prompt:
        "Implement a zero-copy `bytesToString(b []byte) string` using `unsafe.String` (Go 1.20+), and write the one-sentence comment that justifies the unsafe use and the caller contract.",
      starterCode:
        'package main\n\nimport "unsafe"\n\n// bytesToString returns a string that shares b\'s backing array (no copy).\nfunc bytesToString(b []byte) string {\n    // TODO: implement with unsafe.String\n}',
      expectedAnswer:
        'package main\n\nimport "unsafe"\n\n// bytesToString aliases b\'s backing array as a string with no allocation.\n// SAFETY: the caller must not mutate b for the lifetime of the returned\n// string, since strings are meant to be immutable. Justified by a benchmark\n// showing this is on a hot path where the []byte->string copy dominated.\nfunc bytesToString(b []byte) string {\n    if len(b) == 0 {\n        return ""\n    }\n    return unsafe.String(&b[0], len(b))\n}',
      hints: [
        "unsafe.String takes a *byte and a length; guard the empty slice so `&b[0]` is valid.",
        "The comment must state the invariant the caller must uphold (don't mutate b) and why unsafe is justified.",
      ],
    },
    {
      id: "go8uc-debug-cstring",
      type: "debugging",
      prompt:
        "This cgo helper passes a Go string to a C function. Under load the process's memory grows without bound. Find the leak and fix it.",
      starterCode:
        '// #include <stdlib.h>\n// #include "log.h"\nimport "C"\n\nfunc logLine(msg string) {\n    cmsg := C.CString(msg) // allocates C memory\n    C.write_log(cmsg)\n}',
      expectedAnswer:
        "`C.CString` allocates memory with C's `malloc` that Go's garbage collector does not manage; the caller owns it and must free it. This code never frees `cmsg`, so every call leaks. Fix: `defer C.free(unsafe.Pointer(cmsg))` immediately after the C.CString call (requires importing \"unsafe\" and `#include <stdlib.h>`).",
      hints: [
        "Whose allocator returned that pointer, and who is responsible for freeing it?",
        "Pair every C.CString with C.free(unsafe.Pointer(...)), ideally via defer.",
      ],
    },
    {
      id: "go8uc-design-container",
      type: "design",
      prompt:
        "You are packaging LedgerFlow for a scratch (empty) container image. A colleague wants to add a C-based SQLite driver via cgo for a small speed win. Argue whether to accept or reject it, in terms of static vs dynamic linking and CGO_ENABLED.",
      expectedAnswer:
        "Reject it unless the win is measured and significant. A pure-Go build with CGO_ENABLED=0 is statically linked: one self-contained binary with no libc, which drops straight into a scratch/distroless image and cross-compiles trivially. Adding a cgo SQLite driver forces cgo on, links against libc dynamically, and the binary now needs a base image that ships the right shared libraries — the scratch-container story is gone, cross-compilation gets painful, and builds need a C toolchain. That cost is rarely worth a small query speed-up; prefer a pure-Go driver. Only accept cgo if a benchmark shows a large, needed win and you accept the heavier deployment.",
      hints: [
        "What does CGO_ENABLED=0 buy you for a scratch/distroless image?",
        "Weigh a measured speed win against losing static linking, easy cross-compilation, and a C-free build.",
      ],
    },
    {
      id: "go8uc-refactor-remove-unsafe",
      type: "refactoring",
      prompt:
        "A struct-parsing routine uses `unsafe.Pointer` casts to overlay a []byte onto a struct for speed, but it has no benchmark and no justification comment. Describe how you would refactor it and what evidence would let you keep the unsafe version.",
      expectedAnswer:
        "First rewrite it in safe Go (e.g. encoding/binary to decode fields), which restores portability, GC safety, and the compatibility promise. Then benchmark both. Keep the unsafe overlay ONLY if the benchmark shows a large, relevant win on a real hot path, and only after adding: a SAFETY comment justifying it, tests, and a run under the race detector. Without that evidence, ship the safe version — unsafe here trades away guarantees for an unmeasured gain.",
      hints: [
        "Safe first, then measure — unsafe needs a benchmark AND a justification to earn its place.",
        "encoding/binary is the idiomatic safe alternative for decoding bytes into fields.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-unsafe-cost",
      kind: "explain",
      description:
        "Explain, without notes, what guarantees `unsafe` and `cgo` give up (memory/type safety, the compatibility promise, portability and build simplicity) and when that trade is justified.",
      required: true,
    },
    {
      id: "predict-uintptr",
      kind: "predict",
      description:
        "Given a snippet that stores a uintptr and reuses it after a possible GC, correctly predict that it is a bug and state why a uintptr does not keep memory alive.",
      required: true,
    },
    {
      id: "debug-boundary",
      kind: "debug",
      description:
        "Spot and fix a leaked C.CString (missing C.free) or an invalid multi-statement unsafe.Pointer/uintptr conversion.",
      required: true,
    },
    {
      id: "design-linking",
      kind: "design",
      description:
        "Decide static vs dynamic linking for a deployment target and defend it using CGO_ENABLED and the cost of a cgo dependency.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Almost everything you write in Go is safe by construction: the compiler stops you from reading past the end of a slice, treating an int as a pointer, or forgetting to free memory. That safety is the whole reason Go is pleasant for backends. But once in a while you hit a wall the safe language won't let you climb: you need to hand a pointer to a C library that already exists, or squeeze out an allocation on a proven-hot path by reinterpreting bytes without copying them.\n\nGo gives you two deliberate escape hatches for exactly these moments — the `unsafe` package and `cgo` (calling C code). They are powerful and occasionally necessary. They are also where Go stops protecting you: use them carelessly and you get memory corruption, crashes, leaks, and binaries that won't run where you expected. This lesson is about *judgement* — knowing when each is justified and what it costs — far more than about syntax.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of Go's safety like the guard rails and airbags in a car. `unsafe` and `cgo` are the button that switches them all off. There are real situations (a closed track, a stuck seatbelt) where you might want them off — but you never flip that switch casually, and never without a reason you could defend out loud.",
          },
        },
        {
          type: "points",
          items: [
            "**`unsafe`** lets you bypass Go's type and memory safety — reinterpret pointers, read struct layout, alias bytes as strings.",
            "**`cgo`** lets Go call C code, at the price of crossing a language boundary.",
            "Both are sometimes required for interop or performance, and both are always risky — the skill is deciding when.",
          ],
        },
      ],
    },
    naive: {
      body: "The naive instinct comes in two flavors. The first is fear: \"unsafe and cgo are advanced, so a real engineer reaches for them to look serious / go fast.\" The result is code that sacrifices Go's biggest advantages for a speed-up nobody measured.\n\nThe second is treating these hatches like ordinary tools. You assume an `unsafe.Pointer` cast is \"just a cast,\" or that calling a C function is \"just a function call,\" or that adding one cgo dependency is free. Each of those assumptions is wrong in a way that bites later — in a crash under load, a memory leak, or a deployment that suddenly needs a whole operating system's libraries to run.",
      blocks: [
        {
          type: "example",
          example: {
            title: "\"Just a faster cast\" — and now it can crash",
            language: "go",
            code:
              'type Header struct {\n    Magic  uint32\n    Length uint32\n}\n\n// Reinterpret the first 8 bytes of buf AS a Header, with no copy.\nfunc parse(buf []byte) *Header {\n    return (*Header)(unsafe.Pointer(&buf[0])) // no bounds check, no alignment check\n}\n// If buf is shorter than 8 bytes, or misaligned, this reads out of\n// bounds / into garbage. The compiler will not stop you.',
            takeaway:
              "This looks like a clever zero-copy trick, but you have turned off the bounds and alignment checks that normally protect you. It is fast and it is a loaded gun.",
          },
        },
        {
          type: "points",
          items: [
            "Reaching for `unsafe`/`cgo` to look advanced trades Go's real strengths for nothing.",
            "An `unsafe.Pointer` cast is not \"just a cast\" — it removes the checks that keep you alive.",
            "A cgo call is not an ordinary call, and a cgo dependency is not free.",
          ],
        },
      ],
    },
    failure: {
      body: "The failures are nasty precisely because they don't show up where you made the mistake. An `unsafe` bug can corrupt memory that a *completely different* part of the program later reads, so the crash lands far from the cause and only under the right timing or GC pressure. A missing `C.free` leaks a little memory on every call — invisible in a quick test, fatal in a service that runs for weeks. And a cgo dependency changes how your binary is *linked*, which you often discover only when it refuses to start in production.\n\nThe single most infamous `unsafe` bug is treating a `uintptr` (an integer holding an address) as if it were a durable reference. It is not. Go's garbage collector can move or free an object at any time; it updates real pointers when it does, but it has no idea your integer refers to that object. Store an address as a `uintptr` on one line and use it on the next, and you may be reading memory that has since moved or been reclaimed.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The uintptr that pointed at nothing",
            context:
              "A hot parser cached an object's address as a `uintptr` to do some pointer arithmetic \"once, up front,\" then used it a few statements later. It passed every test and ran fine for weeks — until a production node under memory pressure triggered more frequent GCs, and it began returning corrupted amounts and occasionally panicking.",
            insight:
              "Between caching the `uintptr` and using it, the garbage collector moved (or freed) the object. The `uintptr` is just a number — the GC didn't keep the object alive and didn't update the number. The address now pointed at unrelated memory. A `uintptr` is never a reference; the fix is to never let one rest in a variable across statements.",
          },
        },
      ],
    },
    intuition: {
      body: "Here is the mental image that keeps you safe. Picture Go's memory as a warehouse where the manager (the garbage collector) is constantly tidying up: throwing out boxes nobody is holding, and sometimes *sliding boxes to new shelves* to make room. A real Go pointer is like a leash tied to a box — the manager sees the leash, won't throw the box out, and re-ties the leash if the box moves. A `unsafe.Pointer` still counts as a leash. But a `uintptr` is just a photograph of where the box *was*: the manager ignores it, and the moment the box moves or is discarded, your photograph is worthless.\n\nSo the rule falls out naturally: pointer conversions are fine as long as a real leash (a pointer the GC understands) is always holding the box. The dangerous move is letting go of every leash and keeping only the photograph — which is exactly what storing a `uintptr` across statements does.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-expression rule",
            text: "When you must convert pointer→uintptr→do arithmetic→convert back to a pointer, do the *whole thing in one expression*. That way a real pointer is live the entire time and the address never sits in a variable while the GC could move it out from under you.",
          },
        },
        {
          type: "points",
          items: [
            "A real pointer (including `unsafe.Pointer`) keeps its object alive and is updated if the GC moves it.",
            "A `uintptr` is just an integer address — the GC ignores it and never updates it.",
            "Keep a real pointer live whenever an address is in play; never store a `uintptr` and reuse it later.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Now the precise picture of each hatch. **`unsafe.Pointer`** is a special pointer type with two powers ordinary pointers lack: you can convert *any* `*T1` to it and then to any `*T2` (reinterpreting the bytes), and you can convert it to and from `uintptr` (to do address arithmetic). Alongside it, `unsafe.Sizeof`, `unsafe.Offsetof`, and `unsafe.Alignof` report a type's memory layout, and the modern `unsafe.Slice` (Go 1.17+) and `unsafe.String` (Go 1.20+) build a slice or string header over existing memory without copying. The package docs list a small set of *valid conversion patterns*; anything outside them is undefined behavior.\n\n**`cgo`** works by treating C as a pseudo-package. You write C code (or `#include` a header) in a comment directly above `import \"C\"`, and then call C functions as `C.foo(...)`. The catch is that C and Go don't share a memory manager or a calling convention, so every call *crosses a boundary*: arguments are marshalled, the Go scheduler is told this thread is entering C, and ownership rules kick in. That boundary is the source of both cgo's power and all of its costs.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The unsafe layout and conversion tools",
            language: "go",
            code:
              'type T struct {\n    A bool  // offset 0\n    B int64 // offset 8 (7 bytes of padding after A for alignment)\n}\n\nunsafe.Sizeof(T{})       // 16 — includes alignment padding, not 9\nunsafe.Offsetof(T{}.B)   // 8  — byte offset of field B within T\nunsafe.Alignof(T{}.B)    // 8  — B must sit on an 8-byte boundary\n\n// Valid pattern (1): *T1 -> unsafe.Pointer -> *T2\nvar f float64 = 1.5\nbits := *(*uint64)(unsafe.Pointer(&f)) // read the raw bits of the float',
            takeaway:
              "Sizeof/Offsetof/Alignof describe the real in-memory layout (padding and all), and the `*T1 -> unsafe.Pointer -> *T2` conversion is the canonical valid reinterpret. A real pointer stays live throughout.",
          },
        },
        {
          type: "points",
          items: [
            "`unsafe.Pointer` converts between any pointer types and to/from `uintptr`; `Sizeof`/`Offsetof`/`Alignof` expose layout.",
            "`unsafe.Slice`/`unsafe.String` build a slice/string over existing memory with no copy.",
            "`cgo` exposes C as the pseudo-package `C`; every `C.foo()` call crosses a language boundary with its own rules.",
          ],
        },
      ],
    },
    mechanics: {
      body: "The precise cgo rules you must respect are about *ownership* and *pointers*. When you turn a Go string into a C string with `C.CString`, C's allocator (`malloc`) hands back memory that Go's garbage collector knows nothing about — so *you* own it and *you* must `C.free` it, or it leaks forever. Going the other way, `C.GoString` copies a C string into a Go-managed string.\n\nPassing pointers across the boundary has a hard rule from the cgo docs: **Go code may pass a Go pointer to C, but that Go memory must not itself contain any Go pointers.** The reason is that C can hold onto the pointer, and the Go GC — which may move Go memory — can't track pointers living inside C. Violate it and the checker often panics at runtime (`cgo argument has Go pointer to Go pointer`). And every crossing has a real cost: entering C means the runtime must hand off the current goroutine's thread so the scheduler isn't blocked, which is far heavier than a normal function call.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Crossing into C: allocate, use, and free",
            language: "go",
            code:
              '/*\n#include <stdlib.h>\n#include <string.h>\nsize_t c_len(const char* s) { return strlen(s); }\n*/\nimport "C"\nimport "unsafe"\n\nfunc cLen(s string) int {\n    cs := C.CString(s)                 // malloc\'d by C — Go\'s GC does NOT own it\n    defer C.free(unsafe.Pointer(cs))   // YOU must free it, or it leaks\n    return int(C.c_len(cs))            // this call crosses the Go<->C boundary\n}',
            takeaway:
              "C.CString allocates C memory you must free (defer C.free right after). The C.c_len call is a boundary crossing, not a cheap in-process call — don't put one in a tight inner loop without thinking.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Pointer-passing rule",
            text: "You may pass a Go pointer to C, but the pointed-to Go memory must not contain other Go pointers, and C must not keep the pointer past the call's return. The runtime's cgo checker will often panic if you break this. When in doubt, pass copies or C-allocated memory.",
          },
        },
        {
          type: "points",
          items: [
            "`C.CString` → you own the memory → pair it with `defer C.free(unsafe.Pointer(...))`.",
            "Passing a Go pointer to C is allowed only if that memory holds no Go pointers, and C keeps it only during the call.",
            "Each `C.foo()` crossing is expensive relative to a normal Go call — avoid them in hot inner loops.",
          ],
        },
      ],
    },
    diagram: {
      body: "The two costs worth picturing are the *boundary crossing* (why cgo calls aren't free) and the *shape of the resulting binary* (why cgo changes how you ship). First, the crossing: a plain Go call stays inside the Go runtime, but a cgo call has to leave it and come back.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A cgo call crosses a boundary",
            kind: "sequence",
            nodes: [
              { id: "go", label: "Go code calls C.foo(x)", detail: "arguments are marshalled for the C ABI" },
              { id: "handoff", label: "Runtime hands off the goroutine's thread", detail: "so the Go scheduler isn't blocked while in C", tone: "accent" },
              { id: "c", label: "C function runs", detail: "outside Go's safety and GC — its own rules apply", tone: "danger" },
              { id: "back", label: "Return crosses back into Go", detail: "results marshalled back; thread re-attached" },
              { id: "cost", label: "Net: far pricier than a Go call", detail: "fine occasionally, painful in a tight loop", tone: "muted" },
            ],
            caption: "A normal Go call never leaves the runtime; a cgo call leaves it and returns — that round trip is the cost.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Static vs dynamic binary",
            kind: "compare",
            nodes: [
              {
                id: "static",
                label: "Static (CGO_ENABLED=0)",
                detail: "Pure Go. Everything is baked into one file. Runs on an empty scratch/distroless image; cross-compiles trivially.",
                tone: "success",
              },
              {
                id: "dynamic",
                label: "Dynamic (cgo on)",
                detail: "Links against libc and other .so/.dylib files at runtime. Needs a base image that ships them; cross-compilation gets hard.",
                tone: "muted",
              },
            ],
            caption: "Turning cgo on typically turns a self-contained static binary into one that depends on the host's shared libraries.",
          },
        },
      ],
    },
    implementation: {
      body: "The disciplined way to *use* `unsafe` — on the rare occasion you should — is: prove the need with a benchmark first, keep a real pointer live throughout, and leave a comment that justifies it so the next reader knows it was a decision, not an accident. The modern helpers `unsafe.Slice` and `unsafe.String` make the two common zero-copy tricks readable.\n\nFor linking, the implementation is a build flag, not code. A pure-Go program builds static by default, and setting `CGO_ENABLED=0` guarantees it (and disables cgo, so a stray cgo dependency fails the build instead of silently making the binary dynamic).",
      blocks: [
        {
          type: "example",
          example: {
            title: "Zero-copy []byte -> string, justified and guarded",
            language: "go",
            code:
              '// bytesToString aliases b\'s backing array as a string with no allocation.\n// SAFETY: the caller must not mutate b while the returned string is in use\n// (strings must stay immutable). Justified by a benchmark: this is on the\n// request hot path where the []byte->string copy dominated the profile.\nfunc bytesToString(b []byte) string {\n    if len(b) == 0 {\n        return ""\n    }\n    return unsafe.String(&b[0], len(b)) // Go 1.20+; a real pointer stays live\n}',
            takeaway:
              "unsafe earns its place only with a benchmark and a SAFETY comment stating the invariant. Note the empty-slice guard so `&b[0]` is valid, and that a live pointer is passed (never a stored uintptr).",
          },
        },
        {
          type: "example",
          example: {
            title: "Forcing a static binary at build time",
            language: "bash",
            code:
              '# Pure-Go, statically linked, self-contained binary:\nCGO_ENABLED=0 go build -o ledgerflow ./cmd/server\n\n# Confirm it has no dynamic library dependencies:\nfile ledgerflow            # ".../statically linked"\nldd  ledgerflow            # "not a dynamic executable"\n\n# It now drops straight into an empty image:\n#   FROM scratch\n#   COPY ledgerflow /ledgerflow\n#   ENTRYPOINT ["/ledgerflow"]',
            takeaway:
              "CGO_ENABLED=0 gives you one file with no libc dependency — perfect for a scratch/distroless container. `ldd` reporting \"not a dynamic executable\" is the proof.",
          },
        },
        {
          type: "points",
          items: [
            "Benchmark first; add `unsafe` only for a measured, significant win, with a SAFETY comment.",
            "Prefer `unsafe.Slice`/`unsafe.String` and always keep a real pointer live (never a stored `uintptr`).",
            "`CGO_ENABLED=0 go build` forces a static, self-contained binary and makes accidental cgo fail loudly.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before reading on — a corrected wrong guess sticks better than a skimmed right one. You build the same small Go service two ways and check the binary each time:\n\n```\n# Build A\nCGO_ENABLED=0 go build -o svc-a .\nldd svc-a\n\n# Build B (a cgo-based database driver is imported)\nCGO_ENABLED=1 go build -o svc-b .\nldd svc-b\n```\n\nWhat does `ldd` report for each, and which binary can you copy into a `FROM scratch` image and run? Commit to an answer.\n\nHere's the outcome. `svc-a` is statically linked: `ldd` prints \"not a dynamic executable,\" and it runs in an empty scratch image because it needs nothing from the host. `svc-b`, once a cgo driver is in play, links against libc and shows a list of shared objects (`libc.so`, and friends); dropped into `scratch` it fails to start with a \"no such file or directory\"-style error — the loader can't find the shared libraries. The lesson: whether your binary is self-contained is decided by cgo, not by your Go code, and `CGO_ENABLED=0` is how you keep it self-contained.",
    },
    "failure-cases": {
      body: "The failures here split cleanly: `unsafe` mistakes corrupt memory, `cgo` mistakes leak or break the build/deploy. These are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**Stored `uintptr` reused later** → the GC moved/freed the object; you read garbage or crash. Do the arithmetic in one expression, or avoid unsafe.",
            "**Missing `C.free` after `C.CString`** → a steady memory leak invisible in short tests. `defer C.free(unsafe.Pointer(cs))`.",
            "**`unsafe.Pointer` cast without size/alignment checks** → out-of-bounds or misaligned reads. Validate length and alignment first.",
            "**Passing Go memory containing Go pointers to C** → the cgo checker panics at runtime. Pass copies or C-owned memory.",
            "**Accidental cgo dependency** → the binary quietly becomes dynamic and won't run in scratch. Build with `CGO_ENABLED=0` so it fails at build time instead.",
            "**`unsafe` with no benchmark and no comment** → a permanent safety liability for an unproven gain. Delete it or justify it.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Invalid vs valid pointer arithmetic",
            language: "go",
            code:
              '// WRONG: the address rests in a uintptr across statements.\naddr := uintptr(unsafe.Pointer(&s))   // GC may move/free s after this line\np := (*Field)(unsafe.Pointer(addr + unsafe.Offsetof(s.F)))\n\n// RIGHT: one expression; a real pointer is live the whole time.\np := (*Field)(unsafe.Pointer(\n    uintptr(unsafe.Pointer(&s)) + unsafe.Offsetof(s.F),\n))',
            takeaway:
              "The only difference is whether the uintptr ever lives in a variable. It must not: keep the conversion in a single expression so a real pointer pins the object throughout.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Each hatch buys something real and charges something real. None of this forbids their use — it marks what you're spending so you can decide honestly.",
      blocks: [
        {
          type: "points",
          items: [
            "**`unsafe`**: can remove copies/allocations on a hot path, but voids memory/type safety and Go's compatibility promise — a future Go release may break undefined uses.",
            "**`cgo`**: unlocks the enormous world of existing C libraries, but adds per-call overhead, needs a C toolchain, and complicates or breaks easy cross-compilation.",
            "**Dynamic linking (cgo on)**: can share system libraries, but ties the binary to a host that ships them — no more scratch containers.",
            "**Static linking (`CGO_ENABLED=0`)**: one portable, self-contained binary, but you give up cgo and must find pure-Go alternatives.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "cgo is not Go",
            text: "Rob Pike's proverb: \"cgo is not Go.\" Reaching into C costs you build simplicity, memory safety, fast builds, and easy cross-compilation all at once. It is sometimes the right call — but it is a real border crossing, not a convenience, and the default answer should be pure Go.",
          },
        },
      ],
    },
    design: {
      body: "A few durable rules. Reach for pure Go by default; treat `unsafe` and `cgo` as last resorts that must be *earned* by a measured need, not chosen for style or a hunch. If you do use `unsafe`, pin it down with a benchmark that proves the win, a SAFETY comment that states the invariant, tests, and ideally a run under the race detector (`go test -race`). If you use `cgo`, accept that you've traded away static linking and easy cross-compilation, and confine the C interaction to a small, well-tested package. And decide your linking strategy from the deployment target backwards: if you want a tiny scratch/distroless image, that decision *forbids* cgo, so choose your dependencies to keep `CGO_ENABLED=0` viable.",
      blocks: [
        {
          type: "points",
          items: [
            "Default to pure Go; `unsafe`/`cgo` must be justified by a measured need, never taste.",
            "`unsafe` only with a benchmark, a SAFETY comment, tests, and the race detector.",
            "Let the deployment target drive linking: want scratch/distroless? Then keep `CGO_ENABLED=0` and avoid cgo deps.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Choosing a database driver for a scratch deploy",
            context:
              "A team wants LedgerFlow in a scratch image and is picking a Postgres driver. One popular option is pure Go; another wraps the C `libpq` via cgo and claims marginally better throughput.",
            insight:
              "Pick the pure-Go driver. It keeps `CGO_ENABLED=0` viable, so the build stays a single static binary that drops into scratch and cross-compiles for free. The cgo driver's small throughput edge is not worth losing the deployment story, the C toolchain requirement, and cross-compilation — unless a real benchmark shows the throughput actually matters for this workload.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "LedgerFlow ships as a single statically linked binary built with `CGO_ENABLED=0`, dropped into a `FROM scratch` container. That is a deliberate deployment decision: the image contains nothing but the binary, so it is tiny, has almost no attack surface, and needs no libc or base OS. That whole story depends on staying pure Go — so LedgerFlow chooses pure-Go dependencies (a pure-Go Postgres driver, standard-library crypto) and would only accept a cgo dependency if a benchmark proved a large, necessary win and the team accepted a heavier base image. On the `unsafe` side, the money path never uses it: correctness and the compatibility promise matter far more than shaving an allocation off decimal handling. If a profile ever demanded it on a genuine hot path, it would arrive with a benchmark, a SAFETY comment, and race-detector tests — or not at all.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: the static-binary deployment decision",
            kind: "flow",
            nodes: [
              { id: "pure", label: "Pure-Go deps only", detail: "pure-Go Postgres driver, stdlib crypto — no cgo", tone: "accent" },
              { id: "build", label: "CGO_ENABLED=0 go build", detail: "forces a static, self-contained binary" },
              { id: "scratch", label: "COPY into FROM scratch", detail: "no libc, no base OS needed" },
              { id: "ship", label: "Tiny, portable image", detail: "small size, minimal attack surface, trivial cross-compile", tone: "success" },
            ],
            caption: "Choosing pure-Go dependencies is what keeps CGO_ENABLED=0 viable and the scratch deployment possible.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about unsafe and cgo\" into \"I know when to refuse them.\" Work across predicting struct size with padding, reading a valid vs invalid pointer conversion, debugging the stored-uintptr bug and a leaked C.CString, implementing a justified zero-copy conversion, deciding static vs dynamic linking for a container, and refactoring an unjustified unsafe optimization back to safe Go. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain what `unsafe` and `cgo` give up and when that trade is justified, correctly predict that a stored-and-reused `uintptr` is a bug and say why, spot and fix a leaked `C.CString` or an invalid multi-statement pointer conversion, and decide static vs dynamic linking for a deployment target using `CGO_ENABLED` and the cost of a cgo dependency. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two escape hatches, one attitude. **`unsafe`** turns off Go's type and memory safety — its `Pointer` type reinterprets memory and does address arithmetic, but a `uintptr` is only an integer that the GC ignores, so the classic bug is storing one and reusing it after the object has moved or been freed. **`cgo`** lets you call C, but every call crosses an expensive boundary, `C.CString` memory is yours to `C.free`, and pulling in cgo typically turns your self-contained static binary into a dynamically linked one. Both cost safety, build simplicity, or portability — Rob Pike's \"cgo is not Go\" — so the default is pure Go, and `CGO_ENABLED=0` is how you keep the tiny, portable, scratch-container binary that LedgerFlow ships.",
      blocks: [
        {
          type: "points",
          items: [
            "`unsafe` voids safety and the compatibility promise — use it only with a benchmark, a SAFETY comment, and race tests.",
            "A `uintptr` is not a reference; keep pointer conversions in a single expression so a real pointer stays live.",
            "`cgo` crosses an expensive boundary, requires you to free `C.CString`, and tends to make the binary dynamically linked.",
            "`CGO_ENABLED=0` forces a static, self-contained binary — the key to LedgerFlow's scratch/distroless deployment.",
          ],
        },
      ],
    },
  },
};
