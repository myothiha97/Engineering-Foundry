import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 2, lesson 1 — strings, bytes, and runes. Written in the same
 * beginner-friendly voice as Module 0/1: plain language, one analogy per hard
 * idea, a concrete example before every abstract rule. Reformats go.dev
 * material on strings, UTF-8, and normalization into learner-facing prose.
 */
export const goStringsRunes: Lesson = {
  id: "go-strings-runes",
  slug: "strings-runes",
  title: "Strings, bytes & runes",
  description:
    "Learn why a Go string is an immutable slice of bytes (not characters), why len(\"héllo\") is 6, and how to iterate text safely by rune instead of corrupting it byte by byte.",
  moduleId: "go-2",
  estimatedMinutes: 55,
  difficulty: "beginner",
  prerequisites: ["go-basic-types"],
  learningObjectives: [
    "Explain that a string is an immutable, read-only slice of bytes and that Go source is UTF-8",
    "Predict what s[i] and len(s) return for text containing non-ASCII characters",
    "Iterate text safely by rune with range, and convert between []byte and []rune deliberately",
  ],
  concepts: ["strings", "bytes", "runes", "unicode", "utf-8"],
  ledgerFlowApplications: [
    "Count and validate the length of a user-entered transaction description by characters, not bytes",
    "Reject descriptions that contain control characters without splitting a multi-byte letter in half",
    "Normalize accented text so \"café\" typed two different ways compares as equal",
  ],
  references: [
    {
      title: "Strings, bytes, runes and characters in Go — The Go Blog",
      url: "https://go.dev/blog/strings",
      teaches:
        "What a string really holds, why source is UTF-8, and how range decodes runes while indexing returns bytes.",
      relevance: "The authoritative walkthrough of exactly the material in this lesson.",
      required: true,
      section: "What is a string?; Code points, characters, and runes; Range loops",
    },
    {
      title: "Text normalization in Go — The Go Blog",
      url: "https://go.dev/blog/normalization",
      teaches: "Why the same visible text can be encoded multiple ways and how to normalize it before comparing.",
      relevance: "Explains the LedgerFlow problem of comparing user-entered descriptions that look identical.",
      required: false,
      section: "Why normalize?; Normal forms",
    },
    {
      title: "The Go Programming Language Specification: String types",
      url: "https://go.dev/ref/spec#String_types",
      teaches: "The normative rules that strings are immutable byte sequences and that len returns the byte count.",
      relevance: "Confirms the byte-slice and immutability behavior is a language guarantee, not an implementation detail.",
      required: true,
      section: "String types",
    },
  ],
  exercises: [
    {
      id: "go2sr-predict-len",
      type: "prediction",
      prompt:
        "Predict what these print: `fmt.Println(len(\"hello\"))`, `fmt.Println(len(\"héllo\"))`, and `fmt.Println(utf8.RuneCountInString(\"héllo\"))`. Decide before running.",
      expectedAnswer: "5, then 6 (é is 2 bytes in UTF-8), then 5 (rune count)",
      hints: [
        "len counts bytes, not letters.",
        "The accented é needs two bytes in UTF-8, so it adds one extra to the byte count.",
      ],
    },
    {
      id: "go2sr-read-index",
      type: "code-reading",
      prompt:
        "Read `s := \"héllo\"` then `fmt.Printf(\"%c\\n\", s[1])`. Explain what actually prints and why it is not the letter é.",
      hints: [
        "s[1] is a single byte (a uint8), not a character.",
        "é occupies bytes at index 1 and 2, so s[1] is only the first half of it.",
      ],
    },
    {
      id: "go2sr-implement-runecount",
      type: "implementation",
      prompt:
        "Implement charCount so it returns the number of Unicode characters (runes) in a string, not the number of bytes.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc charCount(s string) int {\n\t// return the number of characters (runes), not bytes\n\treturn 0\n}\n\nfunc main() { fmt.Println(charCount("héllo")) } // want: 5',
      expectedAnswer:
        'func charCount(s string) int {\n\tn := 0\n\tfor range s {\n\t\tn++\n\t}\n\treturn n\n}\n// or: return utf8.RuneCountInString(s)',
      hints: [
        "A range loop over a string steps one rune at a time, decoding multi-byte characters for you.",
        "The standard library also has utf8.RuneCountInString.",
      ],
    },
    {
      id: "go2sr-debug-slice",
      type: "debugging",
      prompt:
        "This is meant to grab the first character of `s := \"étage\"` but prints a broken symbol: `first := s[:1]`. Explain the bug and fix it so first holds the whole first character.",
      hints: [
        "s[:1] slices one byte, but é is two bytes — you cut it in half.",
        "Convert to []rune, or use utf8.DecodeRuneInString, to get a whole character.",
      ],
    },
    {
      id: "go2sr-refactor-loop",
      type: "refactoring",
      prompt:
        "A loop uses `for i := 0; i < len(s); i++ { process(s[i]) }` and misbehaves on accented text. Refactor it to process whole characters, and explain what the index i means in each version.",
      hints: [
        "The C-style loop walks bytes; `for i, r := range s` walks runes.",
        "With range, i is the starting byte offset of each rune, so it jumps by the rune's width.",
      ],
    },
    {
      id: "go2sr-design-validate",
      type: "design",
      prompt:
        "Design a rule for validating a LedgerFlow transaction description's length. Decide whether to limit by bytes or runes, and state what evidence would make you change your mind.",
      hints: [
        "A user thinks in visible characters, but a database column may be sized in bytes.",
        "What happens to a 60-character limit if every character is a 4-byte emoji?",
      ],
    },
    {
      id: "go2sr-advanced-normalize",
      type: "advanced",
      prompt:
        "Show, with a short program, two strings that look identical on screen (\"café\" with a precomposed é versus an e plus a combining accent) but are not equal with ==. Then make them compare equal using golang.org/x/text/unicode/norm.",
      hints: [
        "One form is a single code point U+00E9; the other is 'e' followed by U+0301.",
        "norm.NFC.String normalizes both to the same byte sequence before you compare.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-string-bytes",
      kind: "explain",
      description: "Explain in plain words that a string is an immutable slice of bytes and that Go source is UTF-8.",
      required: true,
    },
    {
      id: "predict-len-index",
      kind: "predict",
      description: "Correctly predict len(s) and s[i] for a string containing non-ASCII characters.",
      required: true,
    },
    {
      id: "implement-rune-iteration",
      kind: "implement",
      description: "Write code that iterates or counts text by rune and compiles cleanly.",
      required: true,
    },
    {
      id: "design-text-validation",
      kind: "design",
      description: "Defend a byte-vs-rune choice for validating user-entered text in LedgerFlow.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Text feels like the simplest kind of data — it's just letters, right? So a beginner reasonably assumes a string is a list of characters, that `len(s)` counts those characters, and that `s[0]` hands back the first one. For plain English that assumption even seems to hold.\n\nThen someone types a name with an accent, an emoji, or a Greek letter, and the assumption quietly breaks. A length check reports the wrong number. Grabbing the 'first character' returns a broken symbol. Nothing crashes — the text just comes out subtly corrupted. This lesson replaces the 'string is characters' guess with the model Go actually uses, so text handling stops being a source of silent bugs.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a string as a strip of film, and characters as the scenes on it. Most scenes take one frame, but some take two, three, or four. If you count frames you don't get the number of scenes, and if you cut at an arbitrary frame you can slice a scene in half. Go stores the frames (bytes); the scenes (characters) are decoded from them.",
          },
        },
        {
          type: "points",
          items: [
            "A **string** is a sequence of **bytes** (raw 8-bit numbers), not a sequence of characters.",
            "A **character** may take more than one byte, so byte count and character count differ.",
            "Most text bugs at this level come from treating bytes as if they were characters.",
          ],
        },
      ],
    },
    naive: {
      body: "Here's the model most newcomers bring: a string is an array of characters, `len(s)` is how many characters there are, and `s[i]` is the character at position `i`. In many languages that's close enough to true.\n\nIn Go it's wrong in a specific, important way. `len(s)` returns the number of **bytes**, and `s[i]` returns a single **byte** (a `uint8`), not a character. As long as your text is plain ASCII — English letters, digits, basic punctuation — every character happens to be exactly one byte, so the wrong model gives right answers. That's exactly why the bug hides until the first accented letter shows up.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The model works... until it doesn't",
            language: "go",
            code: 'fmt.Println(len("hello")) // 5  — looks like character count\nfmt.Println(len("héllo")) // 6  — surprise: one extra\n\ns := "héllo"\nfmt.Printf("%c\\n", s[1]) // not \'é\' — a broken half-character',
            takeaway: "For ASCII, byte count equals character count by coincidence. Add é and the coincidence disappears.",
          },
        },
        {
          type: "points",
          items: [
            "`len(s)` is the **byte** count, not the character count.",
            "`s[i]` is a single **byte** (uint8), not a character.",
            "The bug is invisible for ASCII and appears the moment text has a non-ASCII character.",
          ],
        },
      ],
    },
    failure: {
      body: "The most memorable version of this mistake is a length check. Imagine you limit a description to a number of characters, and you write `if len(s) > limit`. A user types a sentence with a few accented letters or an emoji, stays well under your intended character limit, and gets rejected — because those characters cost extra bytes.\n\nThe uglier failure is slicing. To grab a 'preview' you write `s[:1]` expecting the first character. If that character is multi-byte, you've kept only its first byte — an incomplete fragment that renders as a replacement symbol (�). No error is raised; the text is simply broken, and it ships.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Slicing mid-character corrupts text",
            language: "go",
            code: 's := "étage"       // "é" is 2 bytes\nfirst := s[:1]      // keeps only the first byte of é\nfmt.Println(first)  // prints � — a broken half-character, not "é"',
            takeaway: "Byte-index slicing can cut a character in half. The result is valid bytes but invalid text.",
          },
        },
        {
          type: "scenario",
          scenario: {
            title: "The description that's 'too long' but isn't",
            context:
              "A form limits a note to 20 characters and checks len(s) <= 20. A user writes a 15-letter phrase with three accented letters. Each accent adds a byte, len reports 21, and a perfectly valid note is rejected.",
            insight: "The check counted bytes while the user counted characters. Only a rune-based count matches what the user sees.",
          },
        },
      ],
    },
    intuition: {
      body: "Let's build the right picture. There are three layers, and keeping them distinct dissolves the confusion.\n\nAt the bottom are **bytes** — the raw numbers Go actually stores. On top of that is an **encoding**, UTF-8, which is the rule for how characters are spelled out in bytes: an English letter is one byte, but an accented letter, a Greek letter, or an emoji is spelled with two, three, or four bytes. At the top is the **character** you see, which Go calls a **rune**. A string stores bytes; a rune is one whole character decoded from them.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Three layers of text",
            kind: "stack",
            nodes: [
              { id: "rune", label: "Runes (characters)", detail: "what you see: 'h', 'é', '世', '😀'", tone: "accent" },
              { id: "utf8", label: "UTF-8 encoding", detail: "the rule mapping each character to 1–4 bytes" },
              { id: "bytes", label: "Bytes", detail: "the raw numbers Go actually stores" },
            ],
            caption: "A string lives in the bottom layer. Runes are decoded up from bytes using the UTF-8 rule.",
          },
        },
        {
          type: "points",
          items: [
            "**Byte**: a raw 8-bit number; a string is a slice of these.",
            "**UTF-8**: the encoding that spells each character out in 1 to 4 bytes.",
            "**Rune**: one whole Unicode character; in Go it's an `int32` code-point value.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold two facts and the rest follows.\n\nFirst, **a string is an immutable, read-only slice of bytes.** Immutable means once created you cannot change a byte inside it — `s[0] = 'H'` does not compile. To 'edit' a string you build a new one. Second, **Go source files are UTF-8**, so a string literal like `\"héllo\"` is stored as whatever bytes UTF-8 uses to spell those characters — six bytes here, because é takes two. Everything surprising about `len` and indexing is just these two facts playing out.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-sentence rule",
            text: "A string is an unchangeable box of bytes written in UTF-8; indexing gives you a byte, ranging gives you a rune.",
          },
        },
        {
          type: "example",
          example: {
            title: "Strings are immutable",
            language: "go",
            code: 's := "hello"\n// s[0] = \'H\' // does NOT compile: cannot assign to s[0]\n\ns = "H" + s[1:] // build a new string instead\nfmt.Println(s)  // Hello',
            takeaway: "You never edit a string in place. You construct a new one and rebind the variable.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules. `len(s)` returns the number of bytes. Indexing `s[i]` returns the `i`-th **byte** as a `byte` (an alias for `uint8`) — never a character. Converting `[]byte(s)` gives you the raw bytes to work with, and `[]rune(s)` decodes the whole string into a slice of characters, where each element is one rune (`int32`).\n\nThe key tool is the **range loop**. Writing `for i, r := range s` decodes the string one rune at a time: `r` is the whole character, and `i` is the **byte offset** where that character starts. Because characters have different widths, `i` doesn't advance by one each step — it jumps by the width of the rune just read. The `unicode/utf8` package exposes helpers like `utf8.RuneCountInString(s)`, which counts characters without building a slice.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "\"héllo\" — bytes vs runes",
            kind: "flow",
            nodes: [
              { id: "b0", label: "byte 0: h", detail: "rune 'h' starts here" },
              { id: "b12", label: "bytes 1–2: é", detail: "one rune, two bytes", tone: "accent" },
              { id: "b3", label: "byte 3: l" },
              { id: "b4", label: "byte 4: l" },
              { id: "b5", label: "byte 5: o", detail: "len = 6 bytes, 5 runes", tone: "success" },
            ],
            caption: "range yields byte offsets 0, 1, 3, 4, 5 — it skips index 2 because é already consumed it.",
          },
        },
        {
          type: "example",
          example: {
            title: "range decodes runes; indexing returns bytes",
            language: "go",
            code: 's := "héllo"\n\nfor i, r := range s {\n\tfmt.Printf("%d:%c ", i, r) // 0:h 1:é 3:l 4:l 5:o\n}\nfmt.Println()\n\nfmt.Println(len(s))                    // 6  (bytes)\nfmt.Println(utf8.RuneCountInString(s)) // 5  (runes)\nfmt.Printf("%T\\n", s[0])               // uint8 — a byte',
            takeaway: "The byte offset i jumps from 1 to 3 because é occupied two bytes. len and RuneCountInString disagree by exactly that extra byte.",
          },
        },
        {
          type: "points",
          items: [
            "`len(s)` = byte count; `s[i]` = one `byte` (uint8).",
            "`for i, r := range s`: `r` is a rune, `i` is the rune's starting **byte** offset.",
            "`[]rune(s)` decodes to characters; `utf8.RuneCountInString(s)` counts them without allocating a slice.",
          ],
        },
      ],
    },
    diagram: {
      body: "Let's make the byte-versus-rune split visual. Below is the string \"héllo\" laid out as its six bytes, with the runes decoded above them. Notice that most runes sit over a single byte, but é straddles two. Select a cell to see whether it's a byte or a whole character, and which index reaches it.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "One string, two ways to count",
            kind: "compare",
            nodes: [
              { id: "asbytes", label: "As bytes (len = 6)", detail: "s[0]=h, s[1]+s[2]=é, s[3]=l, s[4]=l, s[5]=o" },
              { id: "asrunes", label: "As runes (count = 5)", detail: "'h', 'é', 'l', 'l', 'o'", tone: "accent" },
            ],
            caption: "Same text. Indexing sees 6 bytes; ranging sees 5 runes. The gap is the extra byte é needs.",
          },
        },
      ],
    },
    implementation: {
      body: "In practice you'll make three moves constantly: iterate text by rune, count characters correctly, and safely take a prefix. The rule is simple — reach for `range` or `[]rune` whenever you care about characters, and only index with `s[i]` when you genuinely want raw bytes (for example, checking for a specific ASCII byte like a comma).",
      blocks: [
        {
          type: "example",
          example: {
            title: "Iterate, count, and take a prefix safely",
            language: "go",
            code: 'package main\n\nimport (\n\t"fmt"\n\t"unicode/utf8"\n)\n\nfunc main() {\n\ts := "héllo"\n\n\t// 1. iterate by character\n\tfor _, r := range s {\n\t\tfmt.Printf("%c", r) // héllo\n\t}\n\tfmt.Println()\n\n\t// 2. count characters, not bytes\n\tfmt.Println(utf8.RuneCountInString(s)) // 5\n\n\t// 3. take the first 2 characters safely\n\trunes := []rune(s)\n\tfmt.Println(string(runes[:2])) // hé\n}',
            takeaway: "Convert to []rune when you need to index or slice by character; range when you just need to walk the text.",
          },
        },
        {
          type: "points",
          items: [
            "Walk text with `for _, r := range s` — `r` is a whole character.",
            "Count with `utf8.RuneCountInString(s)`, not `len(s)`.",
            "Slice by character via `[]rune(s)`, then `string(...)` back — never slice the raw bytes mid-character.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before reading on, commit to a prediction — a corrected wrong guess sticks far better than a right answer you skimmed. Consider this loop:\n\n`s := \"go世界\"` (that's the two ASCII letters g, o, then two Chinese characters, each 3 bytes in UTF-8), then `for i, r := range s { fmt.Println(i, string(r)) }`.\n\nWhat byte offsets will `i` take? Write your guess, then reveal.\n\nThe offsets are **0, 1, 2, 5**. `g` starts at 0 and `o` at 1 (one byte each). The first Chinese character starts at 2 and occupies bytes 2, 3, 4 — so the next character can't start until byte 5. `i` isn't a character counter; it's a running byte position, and it jumps by exactly the width of the rune just decoded. If you instead wrote a C-style `for i := 0; i < len(s); i++` loop, you'd visit all six byte positions and split each Chinese character into three meaningless pieces.",
    },
    "failure-cases": {
      body: "Nearly every text bug at this level comes from confusing bytes with characters. Here are the ones you'll actually meet, and the signal each gives you.",
      blocks: [
        {
          type: "points",
          items: [
            "**Using `len(s)` as a character count** → wrong length for any non-ASCII text; use `utf8.RuneCountInString`.",
            "**Indexing `s[i]` expecting a character** → you get a raw byte (uint8); a multi-byte character gives you a fragment.",
            "**Slicing `s[:n]` by byte** → can cut a character in half, producing the replacement symbol �.",
            "**C-style `for i < len(s)` over text** → iterates bytes, mangling multi-byte characters; use `range`.",
            "**Comparing user text with `==` without normalizing** → visually identical strings can differ byte-for-byte and compare unequal.",
          ],
        },
        {
          type: "example",
          example: {
            title: "A fragment, not a character",
            language: "go",
            code: 's := "café"\nb := s[3]                 // a single byte, part of é\nfmt.Printf("%d %c\\n", b, b) // a number and a broken glyph, not \'é\'\n\nfmt.Println(string(s[3:])) // � — the tail byte of é alone is invalid',
            takeaway: "Any single byte from a multi-byte character is meaningless on its own. Decode to a rune to get a real character.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Choosing how to handle text has real costs, and the right call depends on what you're doing. The goal is a choice you can defend, plus the evidence that would change it.",
      blocks: [
        {
          type: "points",
          items: [
            "**Index bytes vs range runes**: byte indexing is fast and fine for pure ASCII checks (is this a comma?); ranging is correct for any real text but decodes as it goes.",
            "**`[]rune(s)` conversion**: gives you random access by character, but allocates a new slice and copies — avoid it in a tight loop where `range` would do.",
            "**Count bytes vs count runes**: bytes match storage size (database columns, buffers); runes match what a human sees. Pick the one your requirement is actually about.",
            "**Normalize before comparing**: makes look-alike text compare equal, but costs a pass over the string and a dependency on `golang.org/x/text`.",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into habits. Decide up front whether a piece of code cares about **bytes** (storage, protocols, ASCII markers) or **characters** (anything a user reads or counts), and use the matching tool. Prefer `range` for iteration and `[]rune` only when you truly need character-indexed access. When you validate or compare user-entered text, normalize it first so equal-looking input is treated as equal. And remember strings are immutable: build new ones rather than trying to edit in place.",
      blocks: [
        {
          type: "points",
          items: [
            "Ask 'bytes or characters?' before touching a string, and pick the matching tool.",
            "Iterate with `range`; convert to `[]rune` only when you need character indexing.",
            "Normalize user text before comparing or length-checking it.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A length limit users can trust",
            context:
              "A note field should allow 'up to 100 characters'. The team switches the check from len(s) to utf8.RuneCountInString(s), so an emoji or an accented letter counts as one, exactly as the user perceives it.",
            insight: "Matching the count to what the user sees removes a whole class of confusing 'too long' rejections.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "Here's the whole lesson applied to the project you'll build. LedgerFlow lets people type a free-text description on each transaction, and users type in every language — accents, Chinese characters, emoji. So its validation counts **runes**, not bytes, when enforcing a length limit, and it rejects control characters by inspecting whole runes rather than raw bytes. Before storing or comparing a description, it **normalizes** the text (NFC), so \"café\" typed as a single é and \"café\" typed as e-plus-accent are treated as the same string instead of two different ones.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Validating a description by characters",
            language: "go",
            code: 'import "unicode/utf8"\n\nconst maxChars = 100\n\nfunc validDescription(s string) bool {\n\tif utf8.RuneCountInString(s) > maxChars {\n\t\treturn false // count characters, not bytes\n\t}\n\tfor _, r := range s { // whole runes, never half a character\n\t\tif r == \'\\n\' || r == \'\\r\' {\n\t\t\treturn false // no line breaks in a one-line note\n\t\t}\n\t}\n\treturn true\n}',
            takeaway: "Counting and scanning by rune makes the limit match what the user sees and keeps multi-byte characters intact.",
          },
        },
        {
          type: "points",
          items: [
            "Length limits count **runes**, so the rule matches what the user typed.",
            "Character checks range over **runes**, never raw bytes.",
            "Descriptions are **normalized** before comparison so look-alike text is equal.",
          ],
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I recognize this' into 'I can predict and build this'. Work across prediction, code-reading, implementation, debugging, refactoring, and design — each produces a different kind of evidence, so finishing one doesn't cover the rest.",
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain that a string is an immutable slice of UTF-8 bytes, predict what `len(s)` and `s[i]` return for text with accents or emoji, write code that iterates or counts text by rune, and defend a byte-vs-rune choice for validating user input. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "One picture carries this whole lesson: a string is a box of **bytes** written in UTF-8, and a **rune** is a whole character decoded from those bytes. Keep those apart and `len(\"héllo\") == 6` stops being a trap and starts being obvious.",
      blocks: [
        {
          type: "points",
          items: [
            "A string is an **immutable slice of bytes**; Go source is UTF-8.",
            "`len(s)` counts bytes; `s[i]` is one byte — not a character.",
            "`for i, r := range s` decodes runes; `i` is the rune's starting byte offset.",
            "Count characters with `utf8.RuneCountInString`; slice by character via `[]rune(s)`.",
            "Next up: slices and how they share backing arrays.",
          ],
        },
      ],
    },
  },
};
