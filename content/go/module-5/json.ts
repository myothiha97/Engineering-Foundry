import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 5, JSON encoding & decoding — turn Go structs into JSON bytes with
 * json.Marshal and read JSON bytes back into structs with json.Unmarshal.
 * Same beginner-friendly voice as Modules 0–4: plain language, one analogy per
 * hard idea, a concrete example before every rule. The recurring trap here is
 * that only exported (capitalized) fields cross the wire, and struct tags are
 * how you control the JSON key names and options.
 */
export const goJson: Lesson = {
  id: "go-json",
  slug: "json",
  title: "JSON encoding & decoding",
  description:
    "Convert between Go structs and JSON with json.Marshal and json.Unmarshal, control the wire format with struct tags, and avoid the exported-field trap that silently drops data.",
  moduleId: "go-5",
  estimatedMinutes: 55,
  difficulty: "intermediate",
  prerequisites: ["go-structs-pointers"],
  learningObjectives: [
    "Marshal a struct to JSON and unmarshal JSON into a struct through a pointer",
    "Use struct tags to rename keys and apply omitempty and the '-' skip option",
    "Explain why only exported fields are serialized and why interface{} numbers decode as float64",
  ],
  concepts: ["encoding/json", "struct-tags", "marshal", "unmarshal"],
  ledgerFlowApplications: [
    "Encode a LedgerFlow API response by marshaling an Account struct to JSON",
    "Decode an incoming deposit request by unmarshaling the HTTP body into a struct",
    "Use struct tags so the JSON keys are snake_case and empty optional fields are omitted",
  ],
  references: [
    {
      title: "JSON and Go",
      url: "https://go.dev/blog/json",
      teaches: "How Marshal and Unmarshal map Go values to and from JSON, including struct tags and generic decoding.",
      relevance: "The canonical narrative walkthrough of exactly the encode/decode material in this lesson.",
      required: true,
      section: "Encoding; Decoding; Generic JSON with interface{}",
    },
    {
      title: "package encoding/json",
      url: "https://pkg.go.dev/encoding/json",
      teaches: "The exact behavior of Marshal, Unmarshal, struct tag options, and the streaming Encoder/Decoder types.",
      relevance: "The authoritative reference for tag syntax (omitempty, '-') and the exported-field rule.",
      required: true,
      section: "func Marshal; func Unmarshal; type Encoder; type Decoder",
    },
    {
      title: "Effective Go",
      url: "https://go.dev/doc/effective_go",
      teaches: "Idiomatic conventions for naming, exported identifiers, and struct design that JSON tagging builds on.",
      relevance: "Grounds why capitalization controls export, the rule that decides what JSON sees.",
      required: false,
      section: "Names; Exported identifiers",
    },
  ],
  exercises: [
    {
      id: "go5js-predict-unexported",
      type: "prediction",
      prompt:
        "A struct has fields `Amount int64` and `note string` (lowercase). You marshal a value of it to JSON. Predict which keys appear in the output and why.",
      expectedAnswer:
        "Only \"Amount\" appears. `note` is unexported (lowercase), so encoding/json cannot see it and silently omits it. Rename it `Note` (and optionally tag it) to include it.",
      hints: ["Which fields can a package outside your own actually read?", "Capitalization is what makes a field exported."],
    },
    {
      id: "go5js-read-tags",
      type: "code-reading",
      prompt:
        "Read the tags `json:\"amount_cents\"`, `json:\"note,omitempty\"`, and `json:\"-\"`. Say exactly what each does to the marshaled output.",
      hints: [
        "The first word in the tag is the JSON key name; options follow after commas.",
        "`omitempty` drops the key when the value is the zero value; `-` drops it always.",
      ],
    },
    {
      id: "go5js-implement-decode",
      type: "implementation",
      prompt:
        "Implement decodeAccount so it fills the Account from the JSON bytes. Remember Unmarshal needs a pointer to write into.",
      starterCode:
        'package main\n\nimport (\n  "encoding/json"\n  "fmt"\n)\n\ntype Account struct {\n  ID       string `json:"id"`\n  BalanceC int64  `json:"balance_cents"`\n}\n\nfunc decodeAccount(data []byte) (Account, error) {\n  var a Account\n  // fill a from data\n  return a, nil\n}\n\nfunc main() {\n  a, err := decodeAccount([]byte(`{"id":"a1","balance_cents":1500}`))\n  fmt.Println(a, err) // want: {a1 1500} <nil>\n}',
      expectedAnswer:
        'func decodeAccount(data []byte) (Account, error) {\n  var a Account\n  err := json.Unmarshal(data, &a)\n  return a, err\n}',
      hints: [
        "Unmarshal's signature is `Unmarshal(data []byte, v any) error` — v must be a pointer.",
        "Pass `&a`, not `a`, so Unmarshal has somewhere to write.",
      ],
    },
    {
      id: "go5js-debug-value-target",
      type: "debugging",
      prompt:
        "Someone calls `json.Unmarshal(data, a)` (passing the value, not `&a`) and the struct comes back empty with no error visible in their quick test. Explain what went wrong and fix it.",
      hints: [
        "Unmarshal returns an error when the target isn't a pointer — is the error being checked?",
        "Passing `a` gives Unmarshal a copy it cannot write back into. Pass `&a`.",
      ],
    },
    {
      id: "go5js-refactor-omitempty",
      type: "refactoring",
      prompt:
        "An API response struct emits `\"note\":\"\"` and `\"closed_at\":null` for every account even when those fields are unset. Refactor the tags so empty optional fields disappear from the JSON.",
      hints: [
        "Add `,omitempty` to optional fields so the zero value is dropped.",
        "For a field that must distinguish 'absent' from 'zero', consider a pointer type like `*time.Time`.",
      ],
    },
    {
      id: "go5js-design-request",
      type: "design",
      prompt:
        "Design the request struct LedgerFlow decodes for a deposit endpoint. Decide the tags, which fields are required, and how you tell 'field omitted' apart from 'field sent as 0'. State what evidence would change your choice.",
      hints: [
        "A non-pointer int64 can't distinguish missing from 0; a `*int64` can (nil means absent).",
        "Think about what the handler must reject versus accept.",
      ],
    },
    {
      id: "go5js-advanced-float64",
      type: "advanced",
      prompt:
        "Unmarshal `{\"amount\": 1500}` into an `interface{}` and then try to use the amount as an `int`. Explain why a direct `v.(int)` type assertion panics, and show the idiomatic fix.",
      hints: [
        "JSON has one number type; decoding into interface{} always yields float64.",
        "Assert to float64 first (`v.(float64)`), then convert to int — or decode into a typed struct instead.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-exported",
      kind: "explain",
      description: "Explain why only exported fields are marshaled and what struct tags control on the wire.",
      required: true,
    },
    {
      id: "predict-tags",
      kind: "predict",
      description: "Correctly predict the JSON output of a struct given its fields and tags (including omitempty and '-').",
      required: true,
    },
    {
      id: "implement-roundtrip",
      kind: "implement",
      description: "Marshal a struct and unmarshal the result back through a pointer so it round-trips cleanly.",
      required: true,
    },
    {
      id: "design-request",
      kind: "design",
      description: "Defend a LedgerFlow request/response struct design, including missing-vs-zero handling.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "The moment your Go program talks to anything else — a browser, a mobile app, another service — it has to agree on a shared format for the data. That shared format is almost always **JSON** (JavaScript Object Notation): plain text like `{\"id\":\"a1\",\"balance_cents\":1500}` that any language can read and write.\n\nBut inside your program the data isn't text — it's an `Account` struct with typed fields. So you need a translator in both directions: struct → JSON text to send a response, and JSON text → struct to read a request. Go's `encoding/json` package is that translator. The two functions are `json.Marshal` (Go value → JSON bytes) and `json.Unmarshal` (JSON bytes → Go value). Getting them right is what lets your service exchange data safely.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of JSON as a shipping crate and your struct as the assembled furniture. Marshal packs the furniture into a flat crate anyone can ship; Unmarshal unpacks a crate back into furniture. The label on each crate compartment is the JSON key — and, as we'll see, you decide those labels with struct tags.",
          },
        },
        {
          type: "points",
          items: [
            "**JSON** is the text format services use to exchange data.",
            "`json.Marshal` turns a Go value into JSON bytes (`[]byte`).",
            "`json.Unmarshal` reads JSON bytes back into a Go value.",
          ],
        },
      ],
    },
    naive: {
      body: "The first instinct is that Marshal simply mirrors your struct: every field goes out, keyed by its Go name. That's *close* but wrong in two ways that bite beginners immediately.\n\nFirst, Marshal can only see **exported** fields — the ones that start with a capital letter. A lowercase field is package-private, invisible to `encoding/json`, and it silently vanishes from the output with no error. Second, the JSON keys default to the exact Go field names (`BalanceC`), which is rarely the `snake_case` your API contract promised. Both problems are fixed by the same tool, but you have to know they exist.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The unexported field that disappears",
            language: "go",
            code:
              'type Account struct {\n    ID       string\n    balanceC int64 // lowercase = unexported\n}\n\nfunc main() {\n    b, _ := json.Marshal(Account{ID: "a1", balanceC: 1500})\n    fmt.Println(string(b)) // {"ID":"a1"} — balanceC is gone!\n}',
            takeaway: "`balanceC` is lowercase, so encoding/json can't see it and drops it with no error. Only exported fields cross the wire.",
          },
        },
        {
          type: "points",
          items: [
            "Only **exported** (capitalized) fields are marshaled — lowercase fields silently vanish.",
            "Default JSON keys are the Go field names, not the snake_case your API likely wants.",
          ],
        },
      ],
    },
    failure: {
      body: "What makes the exported-field rule dangerous is that it fails *quietly*. There's no compile error and no runtime panic — Marshal happily returns valid JSON that's simply missing your data. Your tests pass if they only check the fields that survived, and the bug ships.\n\nThe symptom shows up downstream: the client receives `{\"ID\":\"a1\"}`, the balance is missing, and everyone assumes the sender is broken. The real cause is one lowercase letter in a struct field far away. Naming — the same capitalization rule that controls exports everywhere in Go — is quietly deciding what your API emits.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The balance that never arrives",
            context:
              "An API returns account data. A developer names a field `amount` (lowercase) because it 'looked cleaner'. Marshal returns 200 OK with valid JSON, but the amount key is absent. The frontend shows a blank balance; the backend logs look perfectly healthy.",
            insight: "Valid JSON is not complete JSON. The unexported field was invisible to the encoder from the start — the fix is a capital letter, not a bigger investigation.",
          },
        },
        {
          type: "points",
          items: [
            "A dropped unexported field produces valid-but-incomplete JSON and no error.",
            "The cause is capitalization, not the network or the client.",
          ],
        },
      ],
    },
    intuition: {
      body: "Replace the wrong model with a clear one. Picture Marshal walking your struct field by field and asking two questions of each: *can I see this field?* (is it exported / capitalized) and *what should I call it?* (its struct tag, or the field name if there's no tag). Only fields that pass the first question appear at all; the second question sets their JSON key.\n\nUnmarshal runs the same walk in reverse: it reads each JSON key, finds the matching exported field by tag or name (case-insensitively), and writes the value in. Anything in the JSON with no matching field is simply ignored.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How Marshal decides what to emit",
            kind: "flow",
            nodes: [
              { id: "field", label: "struct field", detail: "e.g. BalanceC int64" },
              { id: "exported", label: "exported?", detail: "capitalized → visible", tone: "accent" },
              { id: "tag", label: "read json tag", detail: "key name + options" },
              { id: "emit", label: "emit key:value", detail: "into JSON", tone: "success" },
            ],
            caption: "An unexported field never reaches the 'read tag' step — it's dropped at the visibility check.",
          },
        },
        {
          type: "points",
          items: [
            "Marshal only emits fields that are exported (capitalized).",
            "The struct tag (or field name) supplies each field's JSON key.",
            "Unmarshal matches JSON keys back to fields and ignores unknown keys.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold two ideas and most JSON work becomes routine. **First: capitalization is the gate.** Exported fields cross the boundary; unexported fields don't. This is the same rule that governs what other packages can access — JSON just obeys it too. **Second: the struct tag is the contract.** The backtick tag `json:\"...\"` on a field is where you declare the exact key name and options the wire format should use, decoupling your Go names from your API's names.\n\nA struct tag is a short string attached to a field, written in backticks right after the type. For JSON it reads `json:\"name,option\"`: the first part is the key, and comma-separated options tweak behavior.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-line test",
            text: "If a field must appear in JSON, capitalize it. If its JSON key differs from its Go name, tag it. Those two checks catch the majority of encoding/json surprises.",
          },
        },
        {
          type: "example",
          example: {
            title: "A tagged struct reads like an API contract",
            language: "go",
            code:
              'type Account struct {\n    ID       string `json:"id"`\n    BalanceC int64  `json:"balance_cents"`\n    Note     string `json:"note,omitempty"` // dropped when empty\n    secret   string // unexported: never marshaled\n}',
            takeaway: "The tags declare the wire format; Go field names stay idiomatic. `secret` won't appear regardless.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise pieces. `json.Marshal(v any) ([]byte, error)` returns JSON bytes; you usually convert them with `string(b)` to read them. `json.Unmarshal(data []byte, v any) error` writes into whatever `v` points at — and `v` **must be a pointer**, so you pass `&account`, not `account`. Unmarshal needs an address to write into, exactly like a pointer receiver needs the caller's box.\n\nStruct tags control the key and behavior. `json:\"amount_cents\"` renames the key. `json:\"note,omitempty\"` omits the key entirely when the field holds its zero value (empty string, 0, nil, empty slice/map). `json:\"-\"` means never marshal this field. Two more facts round it out: Unmarshal **ignores unknown JSON keys** by default (extra fields don't error), and when you decode a number into an `interface{}` you get a **float64**, never an int — JSON has only one number type.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Marshal and Unmarshal, both directions",
            language: "go",
            code:
              'type Account struct {\n    ID       string `json:"id"`\n    BalanceC int64  `json:"balance_cents"`\n}\n\n// struct → JSON\nacct := Account{ID: "a1", BalanceC: 1500}\nb, _ := json.Marshal(acct)\nfmt.Println(string(b)) // {"id":"a1","balance_cents":1500}\n\n// JSON → struct (note the &)\nvar got Account\n_ = json.Unmarshal(b, &got) // must pass a pointer\nfmt.Println(got.BalanceC)   // 1500',
            takeaway: "Marshal returns bytes; Unmarshal writes through a pointer. Forgetting the `&` is the most common mistake.",
          },
        },
        {
          type: "example",
          example: {
            title: "The three tag options you'll actually use",
            language: "go",
            code:
              'type Account struct {\n    ID       string `json:"id"`\n    Note     string `json:"note,omitempty"` // omit when ""\n    Internal string `json:"-"`               // never emitted\n}\n\nb, _ := json.Marshal(Account{ID: "a1", Internal: "audit"})\nfmt.Println(string(b)) // {"id":"a1"} — Note omitted (empty), Internal skipped',
            takeaway: "`omitempty` drops zero-valued keys; `-` drops the field always. Both keep responses lean and safe.",
          },
        },
        {
          type: "points",
          items: [
            "Unmarshal's target must be a pointer (`&v`) — it has nowhere to write otherwise.",
            "Unknown JSON keys are ignored by default; missing keys leave the Go field at its zero value.",
            "Decoding a JSON number into `interface{}` yields `float64`, not `int`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Study the full round-trip as one picture. A struct is marshaled into JSON bytes, sent over the wire, and unmarshaled back into a struct on the other side. Trace each hop and ask: which fields survive the trip, and where could a lowercase field or a wrong tag silently drop data?",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The JSON round-trip",
            kind: "sequence",
            nodes: [
              { id: "struct", label: "Account struct", detail: "typed fields in memory" },
              { id: "marshal", label: "json.Marshal", detail: "exported fields → JSON bytes", tone: "accent" },
              { id: "wire", label: "JSON on the wire", detail: '{"id":"a1","balance_cents":1500}' },
              { id: "unmarshal", label: "json.Unmarshal(&v)", detail: "keys matched back to fields" },
              { id: "back", label: "Account struct", detail: "reconstructed value", tone: "success" },
            ],
            caption: "Only exported fields enter the JSON at Marshal; only matching keys leave it at Unmarshal. Everything else is dropped.",
          },
        },
      ],
    },
    implementation: {
      body: "Put it together as a small API-style round-trip. Tag every field with its wire name, marshal a value to send it, and unmarshal an incoming body through a pointer to read it. Notice `omitempty` on the optional note so an empty note doesn't clutter the response, and that unmarshaling ignores the extra `\"ignored\"` key the client sent.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A tagged struct that round-trips cleanly",
            language: "go",
            code:
              'type Account struct {\n    ID       string `json:"id"`\n    BalanceC int64  `json:"balance_cents"`\n    Note     string `json:"note,omitempty"`\n}\n\nfunc main() {\n    // Encode a response.\n    out, _ := json.Marshal(Account{ID: "a1", BalanceC: 1500})\n    fmt.Println(string(out)) // {"id":"a1","balance_cents":1500}\n\n    // Decode a request (extra keys are ignored).\n    body := []byte(`{"id":"a2","balance_cents":800,"ignored":true}`)\n    var in Account\n    if err := json.Unmarshal(body, &in); err != nil {\n        log.Fatal(err)\n    }\n    fmt.Println(in.ID, in.BalanceC) // a2 800\n}',
            takeaway: "Tags set the wire names, omitempty trims empties, and Unmarshal through `&in` fills the struct while ignoring unknown keys.",
          },
        },
        {
          type: "points",
          items: [
            "Tag each field with its snake_case wire name up front.",
            "Marshal returns bytes to send; Unmarshal fills a struct through a pointer.",
            "Always check the error Unmarshal returns — malformed JSON is a real case.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected wrong guess sticks better than a right answer you skim. You have this struct and code:\n\n`type T struct { Amount int64 \\`json:\"amount\"\\`; note string }`\n\nYou run `b, _ := json.Marshal(T{Amount: 1500, note: \"tip\"})` and print `string(b)`.\n\nWhat prints — `{\"amount\":1500,\"note\":\"tip\"}`, `{\"amount\":1500}`, or an error? Commit to an answer.\n\nIt prints **`{\"amount\":1500}`**. The `note` field is lowercase, so it's unexported and `encoding/json` never sees it — it's dropped silently, with no error. `Amount` is exported and its tag renames the key to `amount`, so it appears. The lesson in one line: capitalization decides *whether* a field is in the JSON, and the tag decides *what it's called*. If you wanted the note included, you'd write `Note string \\`json:\"note\"\\`` — a capital letter first, then a tag.",
    },
    "failure-cases": {
      body: "Most encoding/json bugs at this level come from a short list of recurring mistakes. Here are the ones you'll actually meet, and the signal each gives you.",
      blocks: [
        {
          type: "points",
          items: [
            "**Unexported field** → silently missing from the JSON, no error. Capitalize it.",
            "**Unmarshal into a value, not a pointer** → returns an `json: Unmarshal(non-pointer ...)` error and writes nothing. Pass `&v`.",
            "**Ignoring Unmarshal's error** → malformed JSON leaves your struct half-filled and you never notice. Always check `err`.",
            "**Asserting `interface{}` number as int** → panic; it's a float64. Assert `v.(float64)` then convert, or decode into a typed struct.",
            "**Expecting missing keys to error** → they don't; the field just stays at its zero value. Use a pointer field to detect absence.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The float64 surprise",
            language: "go",
            code:
              'var v interface{}\njson.Unmarshal([]byte(`{"amount":1500}`), &v)\n\nm := v.(map[string]interface{})\nn := m["amount"].(int) // PANIC: interface conversion: float64, not int\n\n// Fix: JSON numbers decode as float64.\nn2 := int(m["amount"].(float64)) // 1500, correct',
            takeaway: "JSON has one number type, so generic decoding always gives float64. Assert float64 first, or decode into a typed struct to skip the problem.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "How you decode is a real trade-off, not a rule with one right answer. Each choice buys something and costs something; pick the one you can defend for the data at hand.",
      blocks: [
        {
          type: "points",
          items: [
            "**Typed struct vs `map[string]interface{}`**: a struct gives you real types, field checking, and no float64 surprise, but you must know the shape ahead of time. A generic map handles unknown shapes at the cost of manual type assertions.",
            "**Non-pointer field vs pointer field**: a plain `int64` is simpler but can't tell 'absent' from '0'; a `*int64` distinguishes them (nil = absent) at the cost of nil checks.",
            "**`omitempty` vs always emit**: omitempty keeps responses lean but hides the difference between 'empty' and 'not applicable'; always emitting is verbose but explicit.",
            "**Marshal/Unmarshal on bytes vs Encoder/Decoder on streams**: the byte functions are simplest for small payloads; the streaming Encoder/Decoder avoids buffering whole HTTP bodies in memory.",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into durable habits. Tag every serialized field with its explicit wire name so the API contract lives in the struct, not in your memory. Capitalize anything that must appear in JSON, and use `json:\"-\"` for internal fields that must never leak. Reach for `omitempty` on genuinely optional fields, and use a pointer type when you must tell 'field omitted' apart from 'field sent as zero'. For HTTP handlers, prefer `json.NewDecoder(r.Body)` to decode requests and `json.NewEncoder(w)` to write responses — they stream straight to and from the `io.Reader`/`io.Writer` instead of buffering.",
      blocks: [
        {
          type: "points",
          items: [
            "Tag every serialized field; capitalize what must ship; `json:\"-\"` for secrets.",
            "Use a pointer field when 'missing' must differ from 'zero'.",
            "Decode HTTP bodies with `json.NewDecoder(r.Body)`, encode with `json.NewEncoder(w)`.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing a deposit request",
            context: "A deposit endpoint must reject a request that omits the amount, but accept an explicit amount of 0 for a placeholder hold.",
            insight: "A plain `int64` can't tell those apart — both read as 0. Modeling the field as `*int64` lets nil mean 'omitted' and `*amount == 0` mean 'explicitly zero', so the handler can reject one and accept the other.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow's HTTP layer speaks to the outside world. When a client asks for an account, the handler marshals an `Account` struct into a JSON response; when a client posts a deposit, the handler unmarshals the request body into a typed struct through a pointer before touching the ledger. Struct tags give every field its `snake_case` wire name, `omitempty` trims optional fields like an empty note, and `json:\"-\"` keeps internal bookkeeping off the wire.\n\nThe balance stays in exact integer cents (`BalanceC int64`) on both sides, so JSON never turns money into a float. And because a decoded request can legitimately omit fields, LedgerFlow uses pointer fields where 'missing' must be told apart from zero — the difference between 'no amount sent' and 'a deliberate zero'.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Encoding a response and decoding a request",
            language: "go",
            code:
              'type Account struct {\n    ID       string `json:"id"`\n    BalanceC int64  `json:"balance_cents"` // exact cents, never a float\n    Note     string `json:"note,omitempty"`\n}\n\ntype DepositRequest struct {\n    AmountC *int64 `json:"amount_cents"` // pointer: nil means "not sent"\n}\n\nfunc handleGet(w http.ResponseWriter, a Account) {\n    json.NewEncoder(w).Encode(a) // stream the response\n}\n\nfunc handleDeposit(w http.ResponseWriter, r *http.Request) {\n    var req DepositRequest\n    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AmountC == nil {\n        http.Error(w, "amount_cents required", http.StatusBadRequest)\n        return\n    }\n    // ... apply *req.AmountC to the account\n}',
            takeaway: "Tags set the wire names, the streaming Encoder/Decoder work straight off the HTTP body, and a `*int64` lets the handler reject a missing amount.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Request in, response out",
            kind: "compare",
            nodes: [
              { id: "in", label: "Decode request", detail: "NewDecoder(r.Body).Decode(&req) → typed struct, reject if invalid", tone: "accent" },
              { id: "out", label: "Encode response", detail: "NewEncoder(w).Encode(account) → JSON with tagged snake_case keys", tone: "success" },
            ],
            caption: "The struct tags are the API contract; the pointer field on the request is how LedgerFlow tells 'missing' from 'zero'.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I recognize this' into 'I can predict and build it'. Work across prediction, code-reading, implementation, debugging, refactoring, design, and one advanced generic-decoding puzzle. Each produces a different kind of evidence, so finishing one doesn't cover the others.",
    },
    mastery: {
      body: "You've mastered this lesson when four signals hold without notes: you can explain why only exported fields are marshaled and what struct tags control; correctly predict a struct's JSON output given its fields and tags (including omitempty and '-'); marshal a value and unmarshal it back through a pointer so it round-trips cleanly; and defend a request/response struct design including missing-vs-zero handling. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this whole lesson: **capitalization decides whether a field is in the JSON, and the struct tag decides what it's called.** Marshal packs exported fields into bytes; Unmarshal fills a struct through a pointer and ignores what it doesn't recognize. Keep those in mind and the silent 'my field disappeared' bug stops being a mystery.",
      blocks: [
        {
          type: "points",
          items: [
            "Only exported (capitalized) fields are marshaled; unexported ones silently vanish.",
            "Tags set the key and options: `json:\"name\"`, `,omitempty` (drop zero values), `-` (never emit).",
            "Unmarshal needs a pointer (`&v`); unknown keys are ignored, missing keys leave the zero value.",
            "Numbers decoded into `interface{}` are float64; use a typed struct to avoid it.",
            "Next up: errors — modeling and handling failure the Go way.",
          ],
        },
      ],
    },
  },
};
