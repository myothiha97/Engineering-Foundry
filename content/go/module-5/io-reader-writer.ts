import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 5, io.Reader & io.Writer — the two one-method interfaces that unify ALL
 * I/O in Go. A Reader can Read(p []byte) (n int, err error); a Writer can
 * Write(p []byte) (n int, err error). Because files, network connections,
 * bytes.Buffer, strings.Reader, and HTTP bodies all satisfy them, code that
 * takes an io.Reader works with ANY source — a dependency on behavior, not on a
 * concrete type. Same beginner-friendly voice as Modules 0–4: plain language,
 * one analogy per hard idea, a concrete example before the abstract rule, io.EOF
 * explained as a normal signal (not a failure), and composition (io.Copy,
 * bufio.NewReader, io.MultiWriter, io.TeeReader) shown as the real payoff.
 */
export const goIoReaderWriter: Lesson = {
  id: "go-io-reader-writer",
  slug: "io-reader-writer",
  title: "io.Reader & io.Writer",
  description:
    "Learn the two tiny interfaces that unify every kind of I/O in Go, so you can stream data between any source and any destination without caring what they concretely are.",
  moduleId: "go-5",
  estimatedMinutes: 55,
  difficulty: "intermediate",
  prerequisites: ["go-interfaces"],
  learningObjectives: [
    "Explain the Read and Write method signatures and why files, buffers, strings, and network connections all satisfy them",
    "Read a stream to its end correctly, treating io.EOF as a normal end-of-stream signal rather than an error",
    "Compose readers and writers (io.Copy, bufio, io.MultiWriter, io.TeeReader) to stream data instead of loading it all into memory",
  ],
  concepts: ["io.Reader", "io.Writer", "streaming", "composition"],
  references: [
    {
      title: "package io",
      url: "https://pkg.go.dev/io",
      teaches:
        "The Reader and Writer interfaces, the io.EOF sentinel, and helpers like io.Copy, io.MultiWriter, and io.TeeReader.",
      relevance:
        "The authoritative definition of the two interfaces and the composition helpers this lesson is built on.",
      required: false,
      section: "type Reader; type Writer; Copy; EOF; MultiWriter; TeeReader",
    },
    {
      title: "Effective Go — Interfaces",
      url: "https://go.dev/doc/effective_go#interfaces",
      teaches:
        "Why Go favors small interfaces and satisfies them implicitly, using io.Writer as the canonical example.",
      relevance:
        "Explains why one-method interfaces like Reader and Writer are so widely reusable across the standard library.",
      required: false,
      section: "Interfaces and methods",
    },
    {
      title: "package bufio",
      url: "https://pkg.go.dev/bufio",
      teaches:
        "How bufio.NewReader and bufio.NewWriter wrap another Reader/Writer to add buffering and line-oriented reads.",
      relevance:
        "Backs the composition section, where wrapping a Reader with a Reader is the everyday move.",
      required: false,
      section: "NewReader; NewWriter; Scanner",
    },
  ],
  exercises: [
    {
      id: "go5io-predict-eof",
      type: "prediction",
      prompt:
        'A loop calls `r.Read(buf)` repeatedly on a strings.Reader holding "hi". Predict the (n, err) pairs it returns across the calls until the stream ends, and say which return value tells you to stop.',
      expectedAnswer:
        "First call returns n=2 (the two bytes 'h' and 'i') with err=nil; the next call returns n=0 with err=io.EOF. The err value io.EOF signals the end of the stream, so you stop when err == io.EOF. (A Read may also return data and io.EOF together, so process n bytes before checking the error.)",
      hints: [
        "io.EOF is a normal end-of-stream signal, not a failure.",
        "Always use the returned n bytes before you inspect err.",
      ],
    },
    {
      id: "go5io-read-copy",
      type: "code-reading",
      prompt:
        "Read `io.Copy(dst, src)` being called with `dst` an *os.File and `src` an http.Response Body. Explain why the same one line would also work if src were a strings.Reader or a bytes.Buffer.",
      hints: [
        "io.Copy takes an io.Writer and an io.Reader, not concrete types.",
        "Every one of those types has a Read or Write method with the right signature.",
      ],
    },
    {
      id: "go5io-implement-copy",
      type: "implementation",
      prompt:
        "Implement streamCopy(dst io.Writer, src io.Reader) that copies all bytes from src to dst using a fixed 32-byte buffer, without loading the whole stream into memory. Return the total number of bytes copied and any real error (io.EOF is not an error to report).",
      starterCode:
        'package main\n\nimport (\n  "io"\n)\n\nfunc streamCopy(dst io.Writer, src io.Reader) (int64, error) {\n  buf := make([]byte, 32)\n  var total int64\n  // TODO: read from src into buf and write what you read to dst,\n  // looping until src is exhausted. Treat io.EOF as a clean stop.\n  return total, nil\n}',
      expectedAnswer:
        "func streamCopy(dst io.Writer, src io.Reader) (int64, error) {\n  buf := make([]byte, 32)\n  var total int64\n  for {\n    n, err := src.Read(buf)\n    if n > 0 {\n      w, werr := dst.Write(buf[:n])\n      total += int64(w)\n      if werr != nil {\n        return total, werr\n      }\n    }\n    if err == io.EOF {\n      return total, nil\n    }\n    if err != nil {\n      return total, err\n    }\n  }\n}",
      hints: [
        "Process the n returned bytes (write buf[:n]) before checking err — data and io.EOF can arrive together.",
        "Return nil on io.EOF; return any other error as-is. This is essentially what io.Copy does for you.",
      ],
    },
    {
      id: "go5io-debug-shortread",
      type: "debugging",
      prompt:
        "A reader loop writes `buf` (the whole 512-byte buffer) to the destination on every iteration instead of `buf[:n]`. On the final read n is 10 but 512 bytes get written, corrupting the output with 502 stale bytes. Explain the bug and fix it.",
      hints: [
        "Read fills only the first n bytes of the buffer; the rest is leftover from the previous read.",
        "Always slice the buffer to the count Read actually returned: dst.Write(buf[:n]).",
      ],
    },
    {
      id: "go5io-refactor-tomemory",
      type: "refactoring",
      prompt:
        "A function reads an entire uploaded file into a []byte with io.ReadAll, then writes the whole slice to the response — using memory proportional to the file size. Refactor it to stream with io.Copy and explain what the memory use becomes.",
      hints: [
        "io.Copy moves bytes through a small fixed buffer, so peak memory is the buffer size, not the file size.",
        "You rarely need the whole payload in memory at once to move it from source to destination.",
      ],
    },
    {
      id: "go5io-design-export",
      type: "design",
      prompt:
        "Design a log export that must stream to the HTTP client without buffering the whole file and simultaneously write a copy to an audit sink. Say which `io` helper joins the two destinations and why the writer parameter should be an interface.",
      hints: [
        "io.MultiWriter(a, b) returns a Writer that fans every write out to both a and b.",
        "Accepting io.Writer lets the same code target an HTTP response in production and a bytes.Buffer in tests.",
      ],
    },
    {
      id: "go5io-advanced-teeread",
      type: "advanced",
      prompt:
        "You must compute the SHA-256 checksum of an upload while streaming it to disk, in a single pass, without reading the data twice. Design a pipeline using io.TeeReader (and note where a bufio wrapper would help) and explain the order in which bytes flow through it.",
      hints: [
        "io.TeeReader(src, w) returns a Reader that also writes everything it reads into w — so hand the hasher as w.",
        "Read from the TeeReader while copying to the file: each byte reaches the file and the hasher exactly once, in the same pass.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-two-interfaces",
      kind: "explain",
      description:
        "Explain the Read and Write signatures and why unrelated types (file, bytes.Buffer, strings.Reader, network conn, HTTP body) all satisfy them and become interchangeable.",
      required: true,
    },
    {
      id: "predict-eof",
      kind: "predict",
      description:
        "Predict the (n, err) sequence of a Read loop and correctly treat io.EOF as the end-of-stream signal, processing n bytes before checking the error.",
      required: true,
    },
    {
      id: "implement-copy",
      kind: "implement",
      description:
        "Implement a streaming copy from an io.Reader to an io.Writer with a fixed buffer, handling short reads and io.EOF correctly.",
      required: true,
    },
    {
      id: "design-composition",
      kind: "design",
      description:
        "Design a composed pipeline (e.g. io.MultiWriter or io.TeeReader) that streams to two destinations or transforms data in one pass, and justify the interface-typed parameters.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Your program constantly needs to move bytes from one place to another: read an uploaded file, copy a network response to disk, write a report to the terminal, feed a test some canned input. The sources and destinations are wildly different things — a file on disk, a socket, a chunk of memory, a string literal. If every one needed its own copy function, you'd write the same loop a dozen times with a dozen different types.\n\nGo refuses to do that. It defines two astonishingly small interfaces — `io.Reader` and `io.Writer` — that describe *reading bytes* and *writing bytes* as pure behavior. Every byte source in the standard library satisfies `Reader`; every byte destination satisfies `Writer`. So a function that takes an `io.Reader` works with all of them at once, and you write the moving-bytes logic exactly once.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a universal water pipe fitting. A pump, a rain barrel, and a garden tap are very different things, but if they all expose the same threaded connector, one hose connects to any of them. `io.Reader` and `io.Writer` are that standard connector for bytes — the hose (your code) doesn't care what's on either end, only that it fits.",
          },
        },
        {
          type: "points",
          items: [
            "Moving bytes is everywhere: files, sockets, memory buffers, strings, HTTP bodies.",
            "`io.Reader` is 'something you can read bytes from'; `io.Writer` is 'something you can write bytes to'.",
            "Write the transfer logic once against the interface, and it works with every source and destination.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep three ideas and the whole package clicks. **One:** the two interfaces really are this small — `Reader` has exactly one method, `Read`, and `Writer` has exactly one, `Write`. Small interfaces are easy to satisfy, so *everything* satisfies them.\n\n**Two:** a byte stream is not a value you hold; it's a faucet you pull from until it runs dry, and `io.EOF` is the sound of the faucet running dry — a normal signal, not a leak. **Three:** because both ends are interfaces, readers and writers **compose** — you can wrap a Reader in another Reader to add a feature, the way you'd screw an adapter onto that universal pipe fitting.\n\nThat third idea is the real superpower. `io.Copy` glues any Reader to any Writer; `bufio.NewReader` wraps a Reader to add buffering; `io.MultiWriter` bundles several Writers into one; `io.TeeReader` wraps a Reader so reading also writes a copy elsewhere. Each is just a Reader or Writer that holds another Reader or Writer.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The entire contract — two one-method interfaces",
            language: "go",
            code: "type Reader interface {\n    // Read fills p with up to len(p) bytes, returning the count n\n    // and an error. At end of stream it returns io.EOF.\n    Read(p []byte) (n int, err error)\n}\n\ntype Writer interface {\n    // Write writes len(p) bytes from p, returning how many it wrote\n    // and an error if it wrote fewer than len(p).\n    Write(p []byte) (n int, err error)\n}",
            takeaway:
              "One method each. Anything implementing Read is a Reader; anything implementing Write is a Writer — no registration, no keyword.",
          },
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Three-part model",
            text: "Small interfaces → everything satisfies them. A stream is a faucet → io.EOF means 'dry', not 'broken'. Readers/writers compose → wrap one in another to add features.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules of the `Read` contract, because this is where beginners slip. A call `n, err := r.Read(p)` reads *up to* `len(p)` bytes into the slice `p`. It returns `n`, the number of bytes actually placed at the front of `p` (often fewer than you asked for — that's a normal 'short read', not an error), and `err`.\n\nYou must **always process the first `n` bytes** (`p[:n]`) before you look at `err`, because a `Read` is allowed to return data *and* a non-nil error — including `io.EOF` — in the same call.\n\n`io.EOF` is a **sentinel error**: a specific, predeclared error value in the `io` package that means 'the stream has no more bytes'. Reaching the end of input is expected, not a failure, so the idiom is to compare against it explicitly (`if err == io.EOF`) and treat it as a clean stop, letting any *other* error propagate as a real problem. The `Write` side is simpler: `Write(p)` tries to write all of `p`, and if it returns `n < len(p)` it must return a non-nil error explaining the short write.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The correct read loop",
            language: "go",
            code: "buf := make([]byte, 4096)\nfor {\n    n, err := r.Read(buf)\n    if n > 0 {\n        process(buf[:n]) // use the n bytes BEFORE checking err\n    }\n    if err == io.EOF {\n        break // normal end of stream — done, not failed\n    }\n    if err != nil {\n        return err // a real error\n    }\n}",
            takeaway:
              "Process buf[:n] first, then check err. io.EOF ends the loop cleanly; any other error is a genuine failure.",
          },
        },
        {
          type: "points",
          items: [
            "`Read(p)` fills up to `len(p)` bytes and returns how many (`n`) — a short read is normal.",
            "Use `p[:n]` before inspecting `err`; data and `io.EOF` can arrive together.",
            "`io.EOF` is a sentinel meaning end-of-stream — compare with `==` and treat it as a clean stop.",
            "`Write(p)` writes all of `p` or returns a non-nil error with `n < len(p)`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Trace one `Read` loop as a picture, because the timing of the `(n, err)` pairs is exactly what trips people up. Follow a source holding 5 bytes being drained through a 4-byte buffer, and watch when data and `io.EOF` appear. Select a step to see what each return value means.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Reading a 5-byte stream through a 4-byte buffer",
            kind: "sequence",
            nodes: [
              {
                id: "r1",
                label: "Read(buf) → n=4, err=nil",
                detail: "buffer filled with the first 4 bytes; more remain",
              },
              {
                id: "r2",
                label: "Read(buf) → n=1, err=nil",
                detail: "a short read: only 1 byte left fit; still not the end",
                tone: "accent",
              },
              {
                id: "r3",
                label: "Read(buf) → n=0, err=io.EOF",
                detail: "no bytes left; io.EOF signals the stream is drained",
                tone: "danger",
              },
              {
                id: "stop",
                label: "loop stops on io.EOF",
                detail: "clean end — all 5 bytes were processed, nothing failed",
                tone: "success",
              },
            ],
            caption:
              "Short reads (n < len(buf)) are normal. io.EOF is the signal to stop, not a sign something broke.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "The classic mistake",
            text: "Writing `buf` instead of `buf[:n]` sends the whole buffer every time, including stale bytes from the previous read on the final short read. Always slice to n.",
          },
        },
      ],
    },
    implementation: {
      body: "You rarely write the raw loop yourself — `io.Copy(dst, src)` is the canonical glue that does exactly it: read from `src`, write to `dst`, chunk by chunk through an internal buffer, stopping cleanly at `io.EOF` and returning the byte count. It's one line, and because its parameters are `io.Writer` and `io.Reader`, the *same* line copies a file to disk, an HTTP body to a file, or a string into a buffer.\n\nThe example below shows both the hand-written loop (so you know what `io.Copy` is doing) and the one-liner you'll actually use, plus a Writer target that could be a file, a response, or a test buffer without changing a character.",
      blocks: [
        {
          type: "example",
          example: {
            title: "io.Copy is the streaming loop, packaged",
            language: "go",
            code: 'import (\n    "io"\n    "os"\n    "strings"\n)\n\n// The canonical one-liner: stream any Reader into any Writer.\nfunc save(dst io.Writer, src io.Reader) (int64, error) {\n    return io.Copy(dst, src) // reads src, writes dst, chunk by chunk, until io.EOF\n}\n\nfunc main() {\n    src := strings.NewReader("stream me, byte by byte")\n    f, _ := os.Create("out.txt")\n    defer f.Close()\n\n    // strings.Reader → *os.File, and it would work just as well with an\n    // http.Response Body or a bytes.Buffer on either end.\n    _, _ = save(f, src)\n}',
            takeaway:
              "io.Copy(dst, src) is the streaming copy you'd otherwise write by hand — and it works for any Reader/Writer pair.",
          },
        },
        {
          type: "points",
          items: [
            "Prefer `io.Copy(dst, src)` over a manual loop; it handles buffering and io.EOF for you.",
            "Type parameters as `io.Reader` / `io.Writer`, not concrete types, so any source or sink fits.",
            "For line- or token-oriented input, wrap the Reader in `bufio.NewReader` or `bufio.Scanner`.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected wrong guess sticks far better than a right answer you skim. Here is the setup:\n\n`src := strings.NewReader(\"abc\")` (a 3-byte stream), and a 2-byte buffer `buf := make([]byte, 2)`. You call `src.Read(buf)` three times in a row. What `(n, err)` does each call return?\n\nCommit to three answers, then read on.\n\nCall 1 returns `n=2, err=nil` — the buffer holds 'a','b'. Call 2 returns `n=1, err=nil` — only 'c' was left, a **short read**, but the stream isn't marked done yet. Call 3 returns `n=0, err=io.EOF` — nothing left, so `io.EOF` announces the end.\n\n(Some readers economize and return the last byte *with* io.EOF in a single call — `n=1, err=io.EOF` — which is exactly why you must process the `n` bytes *before* checking the error.) The lesson: never assume `Read` fills the whole buffer, and never treat `io.EOF` as a crash. A short read is normal, and `io.EOF` is just the faucet running dry.",
    },
    "failure-cases": {
      body: "The bugs in this area are a short, recognizable list. Learn the signal each one gives and they stop being mysteries.",
      blocks: [
        {
          type: "points",
          items: [
            "**Writing `buf` instead of `buf[:n]`** → trailing garbage from the previous read leaks into the output. Slice to n.",
            "**Treating `io.EOF` as an error** → normal reads look like failures and legitimate data at end-of-stream gets dropped. Compare with `== io.EOF` and stop cleanly.",
            "**Checking `err` before using `n`** → you discard the final chunk when data and io.EOF arrive together. Process `buf[:n]` first.",
            "**Assuming `Read` fills the whole buffer** → off-by-many bugs on short reads. Read returns *up to* len(p) bytes.",
            "**`io.ReadAll` on an untrusted or huge stream** → unbounded memory, a potential OOM or DoS. Stream, or cap the size with io.LimitReader.",
            "**Ignoring `Write`'s returned error / short count** → silent data loss when the destination can't take everything.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The short-read corruption bug",
            language: "go",
            code: "buf := make([]byte, 512)\nfor {\n    n, err := src.Read(buf)\n    dst.Write(buf)      // BUG: writes all 512 bytes every time\n    // dst.Write(buf[:n]) // FIX: write only the n bytes just read\n    if err == io.EOF {\n        break\n    }\n}",
            takeaway:
              "On the final read n might be 10, but Write(buf) still emits 512 bytes — 502 of them stale. Always Write(buf[:n]).",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Streaming and buffering are genuine trade-offs, not a free win. Pick the one you can defend for the data in front of you, and know the evidence that would flip the choice.",
      blocks: [
        {
          type: "points",
          items: [
            "**Stream with io.Copy**: flat memory regardless of size, but you process bytes as they arrive and can't easily seek backward.",
            "**Read all into memory (io.ReadAll)**: simplest when you need the whole payload at once (e.g. parse a small JSON), but memory scales with input — dangerous for large or untrusted streams.",
            "**Add a bufio wrapper**: far fewer syscalls and convenient line reads, but one more layer and you must Flush a bufio.Writer or lose buffered bytes.",
            "**Small buffer vs large buffer**: a bigger buffer means fewer read/write calls but more memory per stream; the default io.Copy buffer (32 KB) is a sane middle ground.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Rule of thumb",
            text: "Stream by default. Only read the whole thing into memory when the payload is small and bounded, or when a parser genuinely needs the complete input at once.",
          },
        },
      ],
    },
    design: {
      body: "Turn the rules into habits. Accept `io.Reader` for input and `io.Writer` for output at your function boundaries — never a concrete `*os.File` — so the same code serves production sources and test fakes. Reach for `io.Copy` instead of hand-rolling loops. Compose behavior by wrapping: `bufio.NewReader` for buffering, `io.MultiWriter` to fan a stream out to several destinations, `io.TeeReader` to observe a stream as it flows. And cap untrusted input with `io.LimitReader` so a hostile upload can't exhaust memory.",
      blocks: [
        {
          type: "points",
          items: [
            "Take `io.Reader`/`io.Writer` at boundaries; let callers supply files, buffers, sockets, or fakes.",
            "Use `io.Copy` for the transfer; wrap with `bufio` when you need buffering or lines.",
            "Fan out with `io.MultiWriter`; observe in-flight with `io.TeeReader`.",
            "Bound untrusted streams with `io.LimitReader` to stay memory-safe.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing a download-and-verify pipeline",
            context:
              "You must save an upload to disk and compute its checksum, and you'd rather not read the bytes twice.",
            insight:
              "Wrap the source in io.TeeReader(src, hasher), then io.Copy(file, tee). Each byte flows to the file and the hasher in one pass — composition instead of a second read.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this lesson when four signals hold without notes: you can explain the Read and Write signatures and why unrelated types all satisfy them and become interchangeable; predict the (n, err) sequence of a read loop and treat io.EOF as a clean end-of-stream; implement a streaming copy that handles short reads and io.EOF correctly; and design a composed pipeline (io.MultiWriter or io.TeeReader) with interface-typed parameters. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two one-method interfaces carry all of Go's I/O: an **io.Reader** is anything you can `Read` bytes from, an **io.Writer** is anything you can `Write` bytes to. Because files, buffers, strings, sockets, and HTTP bodies all satisfy them, code written against the interfaces works with every source and sink. Stream through a small buffer instead of loading everything into memory, treat **io.EOF** as a normal end-of-stream signal, and compose readers and writers to do more with less.",
      blocks: [
        {
          type: "points",
          items: [
            "`Read(p) (n, err)` and `Write(p) (n, err)` are the whole contract — depend on the method, not the concrete type.",
            "Process `buf[:n]` before checking err; io.EOF means the stream is drained, not that something failed.",
            "`io.Copy(dst, src)` is the canonical streaming glue; memory stays flat regardless of stream size.",
            "Compose to add features: bufio for buffering, io.MultiWriter to fan out, io.TeeReader to observe in-flight.",
            "Next: use the same Reader and Writer behavior with real files.",
          ],
        },
      ],
    },
  },
};
