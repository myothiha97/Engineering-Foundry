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
    'Learn why a Go string is an immutable slice of bytes (not characters), why len("héllo") is 6, and how to iterate text safely by rune instead of corrupting it byte by byte.',
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
  references: [
    {
      title: "Strings, bytes, runes and characters in Go — The Go Blog",
      url: "https://go.dev/blog/strings",
      teaches:
        "What a string really holds, why source is UTF-8, and how range decodes runes while indexing returns bytes.",
      relevance: "The authoritative walkthrough of exactly the material in this lesson.",
      required: false,
      section: "What is a string?; Code points, characters, and runes; Range loops",
    },
    {
      title: "Text normalization in Go — The Go Blog",
      url: "https://go.dev/blog/normalization",
      teaches:
        "Why the same visible text can be encoded multiple ways and how to normalize it before comparing.",
      relevance:
        "Explains why two user-entered names can look identical but contain different bytes.",
      required: false,
      section: "Why normalize?; Normal forms",
    },
    {
      title: "The Go Programming Language Specification: String types",
      url: "https://go.dev/ref/spec#String_types",
      teaches:
        "The normative rules that strings are immutable byte sequences and that len returns the byte count.",
      relevance:
        "Confirms the byte-slice and immutability behavior is a language guarantee, not an implementation detail.",
      required: false,
      section: "String types",
    },
  ],
  exercises: [
    {
      id: "go2sr-predict-len",
      type: "prediction",
      prompt:
        'Predict what these print: `fmt.Println(len("hello"))`, `fmt.Println(len("héllo"))`, and `fmt.Println(utf8.RuneCountInString("héllo"))`. Decide before running.',
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
        'Read `s := "héllo"` then `fmt.Printf("%c\\n", s[1])`. Explain what actually prints and why it is not the letter é.',
      hints: [
        "s[1] is a single byte (a uint8), not a character.",
        "é occupies bytes at index 1 and 2, so s[1] is only the first half of it.",
      ],
    },
    {
      id: "go2sr-implement-runecount",
      type: "implementation",
      prompt:
        "Implement runeCount so it returns the number of Unicode code points (runes) in a string, not the number of bytes.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc runeCount(s string) int {\n\t// return the number of Unicode code points, not bytes\n\treturn 0\n}\n\nfunc main() { fmt.Println(runeCount("héllo")) } // want: 5',
      expectedAnswer:
        "func runeCount(s string) int {\n\tn := 0\n\tfor range s {\n\t\tn++\n\t}\n\treturn n\n}\n// or: return utf8.RuneCountInString(s)",
      hints: [
        "A range loop decodes the string one Unicode code point (rune) at a time.",
        "The standard library also has utf8.RuneCountInString.",
      ],
    },
    {
      id: "go2sr-debug-slice",
      type: "debugging",
      prompt:
        'This is meant to grab the first rune of `s := "étage"` but produces invalid UTF-8: `first := s[:1]`. Explain the bug and fix it so first holds the whole first rune.',
      hints: [
        "s[:1] slices one byte, but é is two bytes — you cut it in half.",
        "Convert to `[]rune`, or use `utf8.DecodeRuneInString`, to get one complete rune.",
      ],
    },
    {
      id: "go2sr-refactor-loop",
      type: "refactoring",
      prompt:
        "A loop uses `for i := 0; i < len(s); i++ { process(s[i]) }` and misbehaves on non-ASCII text. Refactor it to process whole runes, and explain what the index means in each version.",
      hints: [
        "The C-style loop walks bytes; `for i, r := range s` walks runes.",
        "With range, i is the starting byte offset of each rune, so it jumps by the rune's width.",
      ],
    },
    {
      id: "go2sr-design-validate",
      type: "design",
      prompt:
        "Design a rule for validating a display name's length. Decide whether to limit by bytes, Unicode code points, or user-perceived characters, and state what evidence would make you change your mind.",
      hints: [
        "A user thinks in visible characters, but a database column may be sized in bytes.",
        "What happens to a 60-character limit if every character is a 4-byte emoji?",
      ],
    },
    {
      id: "go2sr-advanced-normalize",
      type: "advanced",
      prompt:
        'Show, with a short program, two strings that look identical on screen ("café" with a precomposed é versus an e plus a combining accent) but are not equal with ==. Then make them compare equal using golang.org/x/text/unicode/norm.',
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
      description:
        "Explain in plain words that a string is an immutable slice of bytes and that Go source is UTF-8.",
      required: true,
    },
    {
      id: "predict-len-index",
      kind: "predict",
      description:
        "Correctly predict len(s) and s[i] for a string containing non-ASCII characters.",
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
      description: "Defend how you count length when validating user-entered text.",
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
            "UTF-8 uses one to four bytes for each Unicode code point.",
            "A **rune** is one Unicode code point; one visible symbol can contain more than one rune.",
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
            takeaway:
              "You never edit a string in place. You construct a new one and rebind the variable.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules. `len(s)` returns the number of bytes. Indexing `s[i]` returns the `i`-th **byte** as a `byte` (an alias for `uint8`) — never a rune. Converting `[]byte(s)` gives you the raw bytes, and `[]rune(s)` decodes the whole string into Unicode code points, where each element is one rune (`int32`).\n\nThe key tool is the **range loop**. Writing `for i, r := range s` decodes one rune at a time: `r` is the code point, and `i` is the **byte offset** where it starts. Because UTF-8 encodings have different widths, `i` may jump by more than one. `utf8.RuneCountInString(s)` counts runes without building a slice. A rune is not always one user-perceived character: combining marks and emoji sequences can use several runes.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: '"héllo" — bytes vs runes',
            kind: "flow",
            nodes: [
              { id: "b0", label: "byte 0: h", detail: "rune 'h' starts here" },
              { id: "b12", label: "bytes 1–2: é", detail: "one rune, two bytes", tone: "accent" },
              { id: "b3", label: "byte 3: l" },
              { id: "b4", label: "byte 4: l" },
              { id: "b5", label: "byte 5: o", detail: "len = 6 bytes, 5 runes", tone: "success" },
            ],
            caption:
              "range yields byte offsets 0, 1, 3, 4, 5 — it skips index 2 because é already consumed it.",
          },
        },
        {
          type: "example",
          example: {
            title: "range decodes runes; indexing returns bytes",
            language: "go",
            code: 's := "héllo"\n\nfor i, r := range s {\n\tfmt.Printf("%d:%c ", i, r) // 0:h 1:é 3:l 4:l 5:o\n}\nfmt.Println()\n\nfmt.Println(len(s))                    // 6  (bytes)\nfmt.Println(utf8.RuneCountInString(s)) // 5  (runes)\nfmt.Printf("%T\\n", s[0])               // uint8 — a byte',
            takeaway:
              "The byte offset i jumps from 1 to 3 because é occupied two bytes. len and RuneCountInString disagree by exactly that extra byte.",
          },
        },
        {
          type: "points",
          items: [
            "`len(s)` = byte count; `s[i]` = one `byte` (uint8).",
            "`for i, r := range s`: `r` is a rune, `i` is the rune's starting **byte** offset.",
            "`[]rune(s)` decodes to code points; `utf8.RuneCountInString(s)` counts runes without allocating a slice.",
          ],
        },
      ],
    },
    diagram: {
      body: "Below, `héllo` is laid out as six bytes with five runes decoded above them. Most runes use one byte here, while `é` uses two. Select a cell to see its byte position and rune.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "One string, two ways to count",
            kind: "compare",
            nodes: [
              {
                id: "asbytes",
                label: "As bytes (len = 6)",
                detail: "s[0]=h, s[1]+s[2]=é, s[3]=l, s[4]=l, s[5]=o",
              },
              {
                id: "asrunes",
                label: "As runes (count = 5)",
                detail: "'h', 'é', 'l', 'l', 'o'",
                tone: "accent",
              },
            ],
            caption:
              "Same text. Indexing sees 6 bytes; ranging sees 5 runes. The gap is the extra byte é needs.",
          },
        },
      ],
    },
    implementation: {
      body: "In practice you will iterate text by rune, count runes, and take UTF-8-safe prefixes. Reach for `range` when you need Unicode code points, and use `s[i]` only when you genuinely want raw bytes, such as checking an ASCII comma. If a product limit is defined by what a user sees as one character, rune counting alone may not be enough.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Iterate, count, and take a prefix safely",
            language: "go",
            code: 'package main\n\nimport (\n\t"fmt"\n\t"unicode/utf8"\n)\n\nfunc main() {\n\ts := "héllo"\n\n\t// 1. iterate by character\n\tfor _, r := range s {\n\t\tfmt.Printf("%c", r) // héllo\n\t}\n\tfmt.Println()\n\n\t// 2. count characters, not bytes\n\tfmt.Println(utf8.RuneCountInString(s)) // 5\n\n\t// 3. take the first 2 characters safely\n\trunes := []rune(s)\n\tfmt.Println(string(runes[:2])) // hé\n}',
            takeaway:
              "Convert to []rune when you need to index or slice by character; range when you just need to walk the text.",
          },
        },
        {
          type: "points",
          items: [
            "Walk UTF-8 text with `for _, r := range s` — `r` is one Unicode code point.",
            "Count runes with `utf8.RuneCountInString(s)`; count bytes with `len(s)`.",
            "Slice by rune via `[]rune(s)`, then convert back with `string(...)`; never cut through a UTF-8 encoding.",
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
            "**Using `len(s)` as a rune count** → wrong for non-ASCII UTF-8 text; use `utf8.RuneCountInString`.",
            "**Indexing `s[i]` expecting a rune** → you get one byte; a multi-byte encoding gives you only a fragment.",
            "**Slicing `s[:n]` by an arbitrary byte position** → can cut through a UTF-8 encoding and create invalid text.",
            "**Assuming one rune equals one visible symbol** → fails for combining marks and many emoji sequences.",
            "**Comparing user text with `==` without normalizing** → visually identical strings can differ byte-for-byte and compare unequal.",
          ],
        },
        {
          type: "example",
          example: {
            title: "A byte fragment, not a rune",
            language: "go",
            code: 's := "café"\nb := s[3]                 // a single byte, part of é\nfmt.Printf("%d %c\\n", b, b) // a number and a broken glyph, not \'é\'\n\nfmt.Println(string(s[3:])) // � — the tail byte of é alone is invalid',
            takeaway:
              "A byte from the middle of a multi-byte UTF-8 encoding is not a complete rune.",
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
      body: "Decide whether code cares about **bytes**, **Unicode code points**, or **user-perceived characters**. Use bytes for storage and protocols, `range` for code points, and a Unicode grapheme-aware library when the product truly counts visible characters. Normalize text only when your comparison rules require canonical equivalence. Strings are immutable, so edits create a new string.",
      blocks: [
        {
          type: "points",
          items: [
            "Ask whether the requirement means bytes, code points, or visible characters.",
            "Iterate code points with `range`; convert to `[]rune` only when you need rune indexing.",
            "Normalize user text before comparing or length-checking it.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A length limit users can trust",
            context:
              "A profile field says 'up to 100 characters'. Before coding, the team must decide whether that means storage bytes, Unicode code points, or what a user sees as one symbol.",
            insight:
              "Matching the count to what the user sees removes a whole class of confusing 'too long' rejections.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain that a string is an immutable slice of UTF-8 bytes, predict what `len(s)` and `s[i]` return for text with accents or emoji, write code that iterates or counts text by rune, and defend a byte-vs-rune choice for validating user input. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: 'One picture carries this lesson: a string is a box of **bytes**, while a **rune** is one Unicode code point decoded from UTF-8. A visible character may contain several runes. Keep those layers separate and `len("héllo") == 6` becomes predictable.',
      blocks: [
        {
          type: "points",
          items: [
            "A string is an **immutable slice of bytes**; Go source is UTF-8.",
            "`len(s)` counts bytes; `s[i]` is one byte — not a character.",
            "`for i, r := range s` decodes runes; `i` is the rune's starting byte offset.",
            "Count runes with `utf8.RuneCountInString`; use a grapheme-aware library for user-visible character counts.",
            "Next: use functions, loops, structs, and slices together in your first Go tests.",
          ],
        },
      ],
    },
  },
};
