import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 8 — advanced modules, versioning and release. The deep follow-up to
 * the toolchain-and-modules lesson: it recaps go.mod/go.sum/go get only briefly,
 * then goes carefully into semantic versioning, Semantic Import Versioning
 * (the /vN path rule), the checksum database, replace/exclude/retract, vendoring,
 * and Minimal Version Selection. Same beginner-friendly voice as the rest of the
 * course: plain language, one analogy per hard idea, a concrete example before the
 * abstract rule. As the FINAL lesson its summary gestures at the whole journey.
 */
export const goModulesAdvanced: Lesson = {
  id: "go-modules-advanced",
  slug: "modules-advanced",
  title: "Modules, versioning & release",
  description:
    "Version a Go module with semantic versioning, respect Semantic Import Versioning for v2+, understand how go.sum and Minimal Version Selection make builds reproducible, and cut a clean, immutable release with tags and retract.",
  moduleId: "go-8",
  estimatedMinutes: 50,
  difficulty: "advanced",
  prerequisites: ["go-toolchain-modules"],
  learningObjectives: [
    "Choose the correct semantic version bump (patch, minor, major) for a change and explain what each bump promises callers",
    "Apply Semantic Import Versioning — put `/v2`, `/v3` in the module path for breaking releases — and explain why the import compatibility rule requires it",
    "Explain how go.sum plus the checksum database and Minimal Version Selection give reproducible, deterministic builds",
    "Use replace, vendoring and retract correctly, and cut an immutable tagged release without ever deleting a published tag",
  ],
  concepts: ["semver", "replace", "vendoring", "retract"],
  ledgerFlowApplications: [
    "Cut a reproducible, versioned LedgerFlow release by tagging a commit and verifying it builds from a clean checkout",
    "Use a replace directive during local multi-module development, then remove it before publishing so downstream builds are not broken",
    "Vendor dependencies into the repository when LedgerFlow needs a hermetic, offline-reproducible build in CI",
  ],
  references: [
    {
      title: "Go Modules Reference",
      url: "https://go.dev/ref/mod",
      teaches:
        "The normative rules for go.mod directives (require, replace, exclude, retract), semantic import versioning, go.sum, the module proxy and Minimal Version Selection.",
      relevance:
        "The authoritative source for every mechanism in this lesson; settles edge cases the prose only summarises.",
      required: true,
      section: "Versions & MVS",
    },
    {
      title: "Module version numbering",
      url: "https://go.dev/doc/modules/version-numbers",
      teaches:
        "How major/minor/patch map to Go modules, the meaning of each bump, pre-release and pseudo-versions, and the +incompatible marker.",
      relevance:
        "Grounds the semver section in the official rules for choosing and reading version numbers.",
      required: true,
      section: "Semantic versioning",
    },
    {
      title: "Publishing a module",
      url: "https://go.dev/doc/modules/publishing",
      teaches:
        "How to tag and publish a release so `go get` and the proxy can find it, including the /vN path requirement for v2+.",
      relevance:
        "Directly supports the release workflow this lesson ends on — tagging, publishing, and versioned import paths.",
      required: true,
      section: "Releasing",
    },
    {
      title: "Managing dependencies",
      url: "https://go.dev/doc/modules/managing-dependencies",
      teaches:
        "Day-to-day dependency commands: go get, go mod tidy, go mod why, go list -m all, and when to use replace or vendoring.",
      relevance:
        "Backs the tooling and workflow parts of the lesson with the commands you run in practice.",
      required: false,
      section: "Dependencies",
    },
  ],
  exercises: [
    {
      id: "go8mv-predict-bump",
      type: "prediction",
      prompt:
        "You maintain a library at v1.4.2. You add a new exported function `ParseAmount` without changing anything that already existed. What version should the next release be, and why?",
      expectedAnswer:
        "v1.5.0 — a minor bump. Adding a new, backward-compatible export is a minor change: existing callers keep compiling and behaving the same, so MINOR increases and PATCH resets to 0. It is not a patch (that is for bug fixes only) and not a major bump (nothing broke).",
      hints: [
        "Patch = bug fixes only; minor = backward-compatible additions; major = breaking changes.",
        "Does existing code still compile and behave the same after your change?",
      ],
    },
    {
      id: "go8mv-read-gomod",
      type: "code-reading",
      prompt:
        "Read this go.mod excerpt and explain, line by line, what the replace and retract directives do and when each takes effect:\n\nmodule github.com/acme/ledger\n\ngo 1.22\n\nrequire github.com/acme/money v1.3.0\n\nreplace github.com/acme/money => ../money\n\nretract v1.2.0 // panics on zero amounts",
      expectedAnswer:
        "The require line says this module needs github.com/acme/money at v1.3.0. The replace line redirects every use of github.com/acme/money to the local directory ../money instead of the downloaded v1.3.0 — useful for local multi-module development, but it only affects THIS module's own builds and is ignored when the module is used as a dependency. The retract line is published by the money module's own maintainer (it appears in money's go.mod, not a consumer's): it declares that v1.2.0 should not be selected — the version still exists on the proxy but `go get` will avoid it and warn anyone who has it pinned.",
      hints: [
        "replace only affects the main module being built; it is ignored in a module you depend on.",
        "retract is authored in the retracting module's own go.mod and marks a bad release without deleting it.",
      ],
    },
    {
      id: "go8mv-predict-mvs",
      type: "prediction",
      prompt:
        "Your module requires library C v1.2.0 directly. You add a new dependency B, whose go.mod requires C v1.4.0. No other module mentions C. Under Minimal Version Selection, which version of C does the build use, and does adding B upgrade anything else?",
      expectedAnswer:
        "The build uses C v1.4.0 — MVS picks the highest version among the MINIMUM versions each module requires, and here the requirements are v1.2.0 and v1.4.0, so v1.4.0 wins because it satisfies both. Adding B cannot silently upgrade any other dependency: MVS only raises a version when some go.mod explicitly requires the higher one, so unrelated dependencies stay exactly where they were.",
      hints: [
        "MVS selects the maximum of the minimum required versions, not the latest available.",
        "A dependency's version only rises if some module's go.mod requires a higher minimum.",
      ],
    },
    {
      id: "go8mv-debug-v2path",
      type: "debugging",
      prompt:
        "A team released a breaking v2.0.0 of github.com/acme/money by tagging v2.0.0, but they left the first line of go.mod as `module github.com/acme/money`. Downstream users run `go get github.com/acme/money@v2.0.0` and it fails to resolve the new API. Explain the bug and the fix.",
      expectedAnswer:
        "This is the classic v2-without-/v2 mistake. Semantic Import Versioning requires that for v2 and above the module path itself change to end in `/v2` — the go.mod first line must be `module github.com/acme/money/v2` and consumers must import `github.com/acme/money/v2/...`. Because the path was left unchanged, the module system treats the v2.0.0 tag as invalid for a v0/v1 path (or only reachable via the +incompatible fallback), and the new import path callers expect does not exist. The fix: set the module path to `github.com/acme/money/v2`, update the package's own internal imports to the /v2 path, commit, and re-tag v2.0.0 on that commit.",
      hints: [
        "The import compatibility rule: the same import path must stay backward compatible, so a breaking version needs a NEW path.",
        "For v2+, the module path in go.mod must end in /vN and importers must use that path.",
      ],
    },
    {
      id: "go8mv-debug-badtag",
      type: "debugging",
      prompt:
        "You published v1.5.0 an hour ago and discover it corrupts data. A teammate says \"just delete the v1.5.0 tag and re-push a fixed one under the same name.\" Explain why that is the wrong move and what to do instead.",
      expectedAnswer:
        "Deleting and re-pushing a tag breaks immutability. The module proxy (proxy.golang.org) and the checksum database have already cached v1.5.0 with a specific content hash; a different commit under the same tag now mismatches that hash, so anyone who fetched the original gets checksum-mismatch errors and the ecosystem sees two different v1.5.0s. The correct move is: never reuse a version number. Publish a fixed release with a NEW, higher version (v1.5.1), and add a `retract v1.5.0` directive to the module's go.mod so tooling steers users away from the bad release while it still exists for anyone who already depends on it.",
      hints: [
        "Published versions are immutable — the proxy and sum database have already recorded a hash for that tag.",
        "Pull back a bad release with retract plus a new fixed version, never by deleting the tag.",
      ],
    },
    {
      id: "go8mv-design-v2",
      type: "design",
      prompt:
        "You maintain github.com/acme/money at v1.9.0. You need to change the signature of the public `Add` function (breaking), but you have existing v1 users you cannot break. Plan the v1 → v2 release: what changes in the module path, imports, tags, and how both versions coexist.",
      expectedAnswer:
        "Because the change is breaking, it must be a MAJOR bump to v2, and Semantic Import Versioning means v2 lives at a new import path. Plan: (1) Set the module path in go.mod to `github.com/acme/money/v2`. (2) Update all of the module's own internal imports to the /v2 path. (3) Optionally keep the v2 code on a `v2` branch or a `v2/` subdirectory so v1 can still receive patches. (4) Commit and tag `v2.0.0`. Now v1 (path `github.com/acme/money`) and v2 (path `github.com/acme/money/v2`) are DIFFERENT import paths, so both can be present in the same build graph and v1 users are untouched. They migrate deliberately by changing their import path and calling the new Add. Optionally keep releasing v1.x patches from the v1 line.",
      hints: [
        "Breaking change ⇒ major bump ⇒ new /vN import path so old and new coexist.",
        "The two major versions are literally different import paths and can appear in the same build.",
      ],
    },
    {
      id: "go8mv-refactor-replace",
      type: "refactoring",
      prompt:
        "A library's published go.mod contains `replace github.com/acme/money => ../money`, left over from local development. Explain why this is a problem for downstream consumers and refactor the release process so it does not ship.",
      expectedAnswer:
        "A replace directive in a LIBRARY's published go.mod is ignored by consumers (replace only applies to the main module being built), but the path ../money does not exist on the consumer's machine and it signals a broken release; worse, it means the library was never actually tested against the real published dependency. Refactor: use replace only locally while developing, and before tagging a release run `go mod tidy` and remove the replace so require points at a real published version; verify the module builds from a clean checkout with the real dependency; then tag. Local multi-module workflows can instead use a go.work file, which is never published, so the module's own go.mod stays clean.",
      hints: [
        "replace in a dependency's go.mod is ignored downstream — but it means you never built against the real version.",
        "Use replace (or better, a go.work file) only locally; strip replace and run go mod tidy before tagging.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-siv",
      kind: "explain",
      description:
        "Explain, without notes, why Go requires v2+ modules to change their import path (the import compatibility rule) and how that lets incompatible major versions coexist in one build.",
      required: true,
    },
    {
      id: "predict-mvs",
      kind: "predict",
      description:
        "Given a set of module requirements, correctly predict which version Minimal Version Selection chooses and why adding a dependency does not silently upgrade unrelated ones.",
      required: true,
    },
    {
      id: "implement-release",
      kind: "implement",
      description:
        "Cut a clean release: choose the correct semver bump, tag it, and verify it builds reproducibly from a clean checkout without a replace directive.",
      required: true,
    },
    {
      id: "debug-badtag",
      kind: "debug",
      description:
        "Diagnose a broken release (a deleted/re-pushed tag or a v2 without a /v2 path) and prescribe the correct fix — retract plus a new version, or the versioned import path.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You already know how to *use* modules: `go.mod` lists what your code needs, `go.sum` records exact checksums, and `go get` downloads dependencies. That is enough to build a program. But the moment you *ship* something other people depend on — a library, or a service that others build against — a new set of questions appears. If I change my code, how do users know whether it's safe to upgrade? What number do I give this release? If I need to make a breaking change, how do I do it without breaking everyone at once? And how does anyone rebuild the exact same thing I built, months later?\n\nThis is the discipline of versioning and release. Go answers it with a small, opinionated set of rules — semantic versioning, versioned import paths, a checksum database, and a deliberately boring dependency-selection algorithm — that together make builds reproducible and upgrades predictable. Getting these rules right is what separates a library people trust from one that breaks their build.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A version number is a promise printed on the box. Patch says \"same product, fixed a defect.\" Minor says \"same product, now with extra features you can ignore.\" Major says \"this is a different product — read the label before you swap it in.\" Everything in this lesson is about keeping those promises honest so callers can trust the number without reading your code.",
          },
        },
        {
          type: "points",
          items: [
            "Using modules is about *your* build; releasing modules is about *everyone else's* build.",
            "A version number is a contract with callers about what changed and whether it's safe to upgrade.",
            "Go's rules make releases reproducible (same inputs ⇒ same build) and upgrades predictable.",
          ],
        },
      ],
    },
    naive: {
      body: "The natural first instinct, coming from other ecosystems, is to treat version numbers as marketing: bump whatever feels right, publish, and if something goes wrong just delete the tag and push a corrected one. And when you need a breaking change, the instinct is simply to increment to v2.0.0 and tag it — done.\n\nBoth instincts quietly violate Go's rules. Version numbers here are a strict contract, not a mood; a published version is *immutable* and cannot be quietly replaced; and a v2 that keeps the same import path is not a valid v2 at all. These aren't style preferences — break them and downstream builds fail with checksum errors or unresolved imports.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The tempting-but-wrong \"fix a bad release\" move",
            language: "bash",
            code:
              "# Published v1.5.0, found a bug an hour later. The WRONG fix:\ngit tag -d v1.5.0            # delete the tag locally\ngit push origin :v1.5.0      # delete it on the remote\ngit tag v1.5.0 <fixed-commit># reuse the SAME number for different code\ngit push origin v1.5.0\n# Downstream users who already fetched v1.5.0 now get:\n#   verifying module: checksum mismatch\n#     downloaded: h1:AAAA...\n#     go.sum:     h1:BBBB...",
            takeaway:
              "Reusing a version number for different content breaks immutability. The proxy and checksum database already recorded the old hash — the new content no longer matches it.",
          },
        },
        {
          type: "points",
          items: [
            "Version numbers are a contract, not a vibe — the bump must match what actually changed.",
            "A published version is immutable; you cannot re-point a tag at different code.",
            "\"Just bump to v2.0.0\" without changing the import path is not a valid v2 (you'll see why soon).",
          ],
        },
      ],
    },
    failure: {
      body: "The failure is delayed and lands on other people. Your own machine is fine — you built from a tag, it worked, you moved on. The pain appears downstream: a user who pinned your bad tag gets a checksum mismatch and their CI goes red; a user who tries your \"v2\" finds the new API doesn't exist at the path they imported; a user who upgraded one dependency discovers, to their confusion, that a totally unrelated dependency also moved.\n\nThe root cause of most of these is a single rule you must internalise: **the same import path must stay backward compatible forever.** Everything else — why v2 needs a new path, why you never delete a tag, why builds are reproducible — falls out of protecting that promise.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The v2 that nobody can import",
            context:
              "A team ships a breaking redesign of github.com/acme/money. They tag it v2.0.0 but leave `module github.com/acme/money` unchanged in go.mod. Their own tests pass. Downstream users run `go get github.com/acme/money@v2.0.0`, and either it silently resolves to the old v1 API or fails with the new symbols missing. Nobody can actually use the new version.",
            insight:
              "The import path never changed, so from the module system's point of view v2.0.0 is not a legitimate new major version of that path — it can only appear via the `+incompatible` fallback and can't carry a clean new API. A real v2 must live at `github.com/acme/money/v2`. The path IS the version boundary.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image that ties it all together. Think of an import path as a street address. Everyone who imports `github.com/acme/money` is mailing letters to that address, and they expect the building there to keep working the way it always has. Patch and minor releases are *renovations inside the building* — the address is unchanged and your mail still arrives; you might get new rooms (minor) or a fixed leaky pipe (patch), but nothing you relied on is gone.\n\nA breaking change is a *different building*. You cannot renovate the old one into something incompatible while people are still mailing letters to it — you'd lose their mail. So Go makes you build at a new address: `github.com/acme/money/v2`. Old users keep writing to the v1 address; new users write to the v2 address; both buildings can stand at the same time. That's the whole idea behind Semantic Import Versioning — the version lives *in the address* so incompatible versions never collide.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one rule everything rests on",
            text: "The import compatibility rule: \"If an old package and a new package have the same import path, the new package must be backward compatible with the old one.\" Backward-compatible changes keep the path. Breaking changes must change the path. That single rule explains semver's major bump, the /vN requirement, and why deleting a tag is forbidden.",
          },
        },
        {
          type: "points",
          items: [
            "An import path is an address callers rely on staying compatible.",
            "Patch/minor = renovations at the same address; callers are unaffected.",
            "Major/breaking = a new address (/v2, /v3) so old and new coexist without colliding.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Now attach numbers to the buildings. A Go module version is `vMAJOR.MINOR.PATCH`, e.g. `v1.4.2`. Each position is a specific promise:\n\n- **PATCH** (v1.4.2 → v1.4.3): bug fixes only. No new features, no changed behavior that callers can observe. Always safe to take.\n- **MINOR** (v1.4.2 → v1.5.0): backward-compatible *additions* — new functions, new types, new optional behavior. Existing code still compiles and behaves the same. Safe to take. PATCH resets to 0.\n- **MAJOR** (v1.4.2 → v2.0.0): a *breaking* change — something callers relied on was removed or changed. NOT automatically safe; the caller must read the changelog and migrate. MINOR and PATCH reset to 0, and (in Go) the import path gains `/v2`.\n\nThe key mental shift from some other ecosystems: in Go the major version is part of the module's *identity*, not just a label. `v0.x.y` is the exception — it means \"unstable, anything can change,\" so a v0 minor bump is allowed to break you.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Which number do I bump?",
            kind: "flow",
            nodes: [
              { id: "change", label: "I made a change", detail: "what kind is it?" },
              { id: "break", label: "Breaks callers?", detail: "removed/changed existing API", tone: "danger" },
              { id: "major", label: "MAJOR bump", detail: "v1.x.y → v2.0.0, and path gains /v2", tone: "danger" },
              { id: "add", label: "Adds new API?", detail: "backward-compatible additions", tone: "accent" },
              { id: "minor", label: "MINOR bump", detail: "v1.4.2 → v1.5.0, PATCH resets to 0", tone: "accent" },
              { id: "fix", label: "Just a bug fix", detail: "no API change, same behavior contract", tone: "success" },
              { id: "patch", label: "PATCH bump", detail: "v1.4.2 → v1.4.3", tone: "success" },
            ],
            caption: "Breaking ⇒ major (+ new /vN path). Additive ⇒ minor. Fix-only ⇒ patch. Decide by what callers experience, not by how much code you touched.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "v0 is special",
            text: "v0.x.y means \"no stability promises yet.\" While you're at v0, a minor bump (v0.3.0 → v0.4.0) is allowed to break callers — that's the escape hatch for pre-1.0 development. The compatibility promises only bind once you tag v1.0.0.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise mechanisms. **Semantic Import Versioning (SIV)** is the rule you met as an analogy, made concrete: for v2 and above, the module path itself must end in `/vN`. The go.mod first line becomes `module github.com/acme/money/v2`, and importers write `import \"github.com/acme/money/v2\"`. v0 and v1 share the bare path (no suffix). Because `.../money` and `.../money/v2` are *different strings*, the toolchain treats them as different packages that can both appear in one build.\n\n**go.sum and the checksum database** make releases tamper-evident. `go.sum` records a cryptographic hash of every dependency's content. On download, Go also consults the public checksum database (`sum.golang.org`) and refuses to proceed if a module's content doesn't match what the database first recorded. That's what makes a build reproducible and a deleted-and-re-pushed tag fatal — the hash is pinned forever. For private code you don't want sent to the public database, set `GOPRIVATE` (the convenient default for the finer-grained `GONOPROXY` and `GONOSUMDB` variables) so those module paths skip the proxy and the sum database.\n\n**Minimal Version Selection (MVS)** decides which version of each dependency the build uses. Contrary to \"grab the latest,\" Go collects the *minimum* version every module in the graph requires and picks the *highest of those minimums*. Nothing upgrades unless some go.mod explicitly asks for a higher minimum — so adding one dependency can never silently drag others forward.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A v2 module: the path carries the version",
            language: "go-mod",
            code:
              "// go.mod for the v2 release\nmodule github.com/acme/money/v2\n\ngo 1.22\n\nrequire github.com/shopspring/decimal v1.4.0\n\n// Consumers import it at the versioned path:\n//   import \"github.com/acme/money/v2\"\n// v1 users keep importing:\n//   import \"github.com/acme/money\"\n// Both can appear in the SAME build — different paths, no collision.",
            takeaway:
              "For v2+, the /vN suffix is part of the module path and the import path. That is what lets v1 and v2 coexist instead of clobbering each other.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "MVS: highest of the minimums, not the latest",
            kind: "compare",
            nodes: [
              {
                id: "mvs",
                label: "Go — Minimal Version Selection",
                detail: "Your go.mod wants C v1.2.0; dep B wants C v1.4.0. Available: up to v1.9.0. Go picks v1.4.0 — the highest MINIMUM required. Nothing else moves.",
                tone: "success",
              },
              {
                id: "npm",
                label: "npm-style — latest compatible",
                detail: "Tends to resolve to the newest version allowed by ranges (e.g. ^1.2.0 might float to v1.9.0), so the same manifest can build differently over time.",
                tone: "muted",
              },
            ],
            caption: "MVS makes builds deterministic: the selected version only changes when some go.mod explicitly changes a required minimum.",
          },
        },
        {
          type: "points",
          items: [
            "SIV: v2+ modules put `/vN` in both the module path and every import of them.",
            "go.sum + sum.golang.org pin content hashes, so builds are reproducible and tampering is detected.",
            "MVS picks the highest of the minimum required versions — never the latest — so adds don't cause surprise upgrades.",
            "GOPRIVATE tells Go which module paths to keep off the public proxy and checksum database.",
          ],
        },
      ],
    },
    diagram: {
      body: "Let's trace a real dependency-selection graph, because MVS is the piece most likely to surprise you. Your module (the *main* module) directly requires two libraries, and each of those pulls in a shared library C at some minimum. Follow the steps to see how Go arrives at a single version of C — and confirm that nothing floats to the newest release just because it exists.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Resolving a shared dependency with MVS",
            kind: "sequence",
            nodes: [
              { id: "main", label: "main module requires A and B", detail: "your app's go.mod" },
              { id: "a", label: "A's go.mod requires C v1.2.0", detail: "A's declared minimum for C" },
              { id: "b", label: "B's go.mod requires C v1.4.0", detail: "B's declared minimum for C", tone: "accent" },
              { id: "collect", label: "Go collects all minimums for C", detail: "{ v1.2.0, v1.4.0 }" },
              { id: "pick", label: "Pick the highest minimum", detail: "v1.4.0 wins — satisfies both A and B", tone: "success" },
              { id: "ignore", label: "v1.9.0 exists but is NOT chosen", detail: "no go.mod requires it, so MVS leaves it alone", tone: "muted" },
            ],
            caption: "The build uses C v1.4.0. To move to v1.9.0 you must explicitly `go get C@v1.9.0`, which records the new minimum in your go.mod.",
          },
        },
      ],
    },
    implementation: {
      body: "The end-to-end release workflow is short and mechanical. First decide the bump (patch/minor/major) from what callers experience. Run `go mod tidy` so go.mod and go.sum are exact and there is no stray `replace`. Verify it builds and tests pass from a clean state. Then create an annotated git tag with the version and push it — the tag *is* the release; the proxy discovers it. For v2+, the module path must already be `/vN` before you tag.\n\nFor an *untagged* commit (someone `go get`s a specific commit), Go synthesises a **pseudo-version** like `v0.0.0-20240115120000-abcdef123456` — a timestamp plus commit hash that sorts correctly and is still checksum-pinned. And when a pre-modules v2+ module has no `/vN` path but a valid v2 tag, Go tolerates it with the `+incompatible` marker (e.g. `v2.0.0+incompatible`) — a legacy fallback you should design new modules to avoid.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Cutting a tagged release",
            language: "bash",
            code:
              "# 1. Decide the bump from what changed (say, added a function → minor).\n# 2. Make go.mod/go.sum exact and drop any local replace.\ngo mod tidy\n\n# 3. Verify from a clean state.\ngo build ./... && go test ./...\n\n# 4. Tag and push — the tag is the release.\ngit tag v1.5.0\ngit push origin v1.5.0\n\n# 5. Confirm the proxy/tooling can resolve it.\ngo list -m github.com/acme/money@v1.5.0\n\n# Installing a specific version of a tool:\ngo install github.com/acme/tool@v1.5.0",
            takeaway:
              "Tidy, verify from clean, tag, push. There is no separate \"publish\" step — pushing the semver tag is the release, and the module proxy picks it up on first request.",
          },
        },
        {
          type: "points",
          items: [
            "The git tag is the release; `go get module@v1.5.0` resolves it via the proxy.",
            "Pseudo-versions (`v0.0.0-<timestamp>-<commit>`) let you depend on an untagged commit, still checksum-pinned.",
            "`+incompatible` is a legacy fallback for v2+ modules without a /vN path — avoid it in new modules.",
            "`go install pkg@version` builds and installs a tool at an exact version, independent of your project.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Your module's go.mod directly requires `github.com/acme/util v1.1.0`. You run `go get github.com/acme/widget@v1.0.0`, and it happens that widget's go.mod requires `github.com/acme/util v1.3.0`. There is also a `util v1.6.0` available on the proxy that nobody requires.\n\nQuestion: after `go get widget`, which version of `util` does your build use, and what does your go.mod now say about util? Commit to an answer.\n\nHere's the trace. MVS collects the minimum versions of util that appear anywhere in the graph: your v1.1.0 and widget's v1.3.0. It selects the *highest* of those, **v1.3.0** — because that is the lowest version that satisfies everyone. It does NOT jump to v1.6.0, because no go.mod requires v1.6.0. Go then records the selected requirement, so your go.mod's util line is bumped to `v1.3.0` (an *indirect* upgrade forced by widget's needs). The lesson: adding widget upgraded util only as far as widget actually required, and not one release further — deterministic, minimal, no surprises.",
    },
    "failure-cases": {
      body: "The failures here cluster around three misunderstandings: treating version numbers as cosmetic, forgetting that published versions are immutable, and shipping local development shortcuts. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**v2+ without a /vN path** → the new major version can't be imported cleanly; it only shows up as `+incompatible` or resolves to old code. Put `/v2` in the module path and imports.",
            "**Deleting/re-pushing a tag** → checksum mismatches for everyone who fetched it, because the proxy and sum database pinned the old hash. Never reuse a version; publish a new one.",
            "**`replace` in a published library's go.mod** → ignored downstream, and it means you never built against the real dependency. Use replace (or a go.work file) only locally and strip it before tagging.",
            "**Wrong bump** → a breaking change shipped as a minor silently breaks callers who took the \"safe\" upgrade. Bump by what callers experience.",
            "**Expecting `go get` to grab the latest of everything** → MVS picks minimums; unrequired newer versions are left alone. Upgrade deliberately with `go get pkg@latest`.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Pulling back a bad release the right way",
            language: "go-mod",
            code:
              "// In the module's OWN go.mod, after shipping a broken v1.5.0:\nmodule github.com/acme/money\n\ngo 1.22\n\n// v1.5.0 corrupts data; v1.5.1 fixes it. Steer users away from 1.5.0\n// without deleting it (it still exists for anyone already pinned to it).\nretract v1.5.0 // data corruption on negative amounts; use v1.5.1+\n\n// You can also retract a range, e.g. an accidental early tag:\n// retract [v1.4.0, v1.4.3] // published from the wrong branch",
            takeaway:
              "retract is published in the retracting module's own go.mod. It marks bad versions so `go get` avoids them and warns pinned users — immutability preserved, no tag ever deleted.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "These tools each buy something at a cost. None should scare you off — they mark where to think about whether the mechanism earns its keep.",
      blocks: [
        {
          type: "points",
          items: [
            "**Cutting a major version (/vN)**: lets you make a clean break, but doubles maintenance while both lines live and forces every caller to migrate paths. Reserve it for genuinely breaking changes.",
            "**replace**: unblocks local multi-module work and forks, but must never ship in a published library — a `go.work` file is usually the cleaner local option.",
            "**vendoring**: gives hermetic, offline, no-proxy builds (great for locked-down CI), but bloats the repo and you must keep `vendor/` in sync with `go mod tidy`.",
            "**retract**: pulls back a bad release without breaking immutability, but only helps users who update — those pinned to the bad version must act on the warning themselves.",
            "**MVS determinism**: rock-solid reproducibility, but you get security/bugfix upgrades only when you explicitly ask (`go get -u`), never automatically.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules for shipping modules. Choose the version bump by what *callers* experience, never by how much code you changed. Treat every published version as immutable — pull back mistakes with `retract` and a new release, never by deleting a tag. Keep development conveniences (replace directives) out of published go.mod files. And reserve major-version bumps for real breaks, because every /vN split is maintenance you carry for as long as both lines live.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Two rules you must never break",
            text: "1) Never delete or re-point a published tag — the proxy and checksum database have pinned its hash, so reuse causes checksum-mismatch failures across the ecosystem; use retract instead. 2) Never leave a replace directive in a library's published go.mod — it's ignored downstream and means you never built against the real dependency; use it (or a go.work file) only locally.",
          },
        },
        {
          type: "scenario",
          scenario: {
            title: "Vendoring for a hermetic CI build",
            context:
              "A team's CI must build with no network access and prove the exact same bytes every time, even if the module proxy is unreachable. Downloading dependencies at build time is not acceptable.",
            insight:
              "Run `go mod vendor` to copy every dependency's source into a `vendor/` directory committed to the repo, and build with `-mod=vendor` (the default when `vendor/` is present). The build is now hermetic and offline. The cost: a larger repo and remembering to re-run `go mod vendor` after any dependency change so `vendor/` stays consistent with go.mod.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow ships. When it's time to release, the team decides the bump from what changed — a bug fix is a patch, a new endpoint is a minor, a breaking change to the public money API would force a v2 at a new `/v2` import path. They run `go mod tidy`, make sure no `replace` directive from local development is still in go.mod, verify the build and tests pass from a clean checkout, then tag the commit (`git tag v1.2.0`) and push it — that tag is the reproducible release, pinned by go.sum so it rebuilds byte-for-byte later. During day-to-day work, when LedgerFlow's service and its internal `money` package are being changed together, a `replace github.com/acme/money => ../money` (or a go.work file) lets them iterate locally — but it is removed before any release. And for the locked-down CI environment that must build offline, they `go mod vendor` so the whole dependency set lives in the repo and the build never touches the network.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: cutting a reproducible release",
            kind: "sequence",
            nodes: [
              { id: "decide", label: "Decide the bump", detail: "patch / minor / major from caller impact" },
              { id: "tidy", label: "go mod tidy, drop local replace", detail: "go.mod/go.sum exact, no dev shortcuts", tone: "accent" },
              { id: "verify", label: "Build & test from clean checkout", detail: "reproducibility check" },
              { id: "tag", label: "git tag v1.2.0 && push", detail: "the tag is the release; go.sum pins it", tone: "success" },
              { id: "confirm", label: "go list -m module@v1.2.0", detail: "confirm the proxy resolves it" },
            ],
            caption: "Semver decides the number, tidy makes it exact, a clean-checkout build proves it's reproducible, the tag ships it immutably.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about versioning\" into \"I know exactly which number to bump and how to ship it.\" Work across predicting the right semver bump, reading a go.mod with replace and retract, predicting what MVS selects, debugging a v2-without-/v2 failure and a bad-tag situation, and designing a v1 → v2 breaking release. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain why v2+ needs a new import path and how that lets major versions coexist, predict which version MVS selects from a set of requirements and why adds don't silently upgrade unrelated deps, cut a clean release by choosing the right bump and verifying it builds reproducibly from a clean checkout, and diagnose a broken release — a deleted tag or a v2 without /v2 — and prescribe the correct fix. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Three ideas carry this lesson. **Version numbers are promises** — patch fixes, minor adds, major breaks — and in Go the major version is part of a module's identity, so v2+ must change the import path to `/vN` (Semantic Import Versioning) because the same path must stay backward compatible forever. **Builds are reproducible and deterministic** — go.sum plus the checksum database pin every dependency's content, and Minimal Version Selection picks the highest of the required minimums, never the latest, so nothing upgrades behind your back. **Releases are immutable** — you cut one by tagging a commit, you never delete a published tag, and you pull back a bad release with `retract` and a new version; `replace` and vendoring are local/CI tools, not things you ship in a library.\n\nAnd with that, the Go journey closes a full loop: from your first `package main` and a printed line, through types, memory, interfaces, errors, the standard library, and concurrency, to shipping a versioned module the rest of the world can depend on. You started by running code; you're finishing by releasing it responsibly.",
      blocks: [
        {
          type: "points",
          items: [
            "Semver: patch = fixes, minor = compatible additions, major = breaking; bump by what callers experience.",
            "SIV: v2+ modules put `/vN` in the module path and imports so incompatible majors coexist.",
            "go.sum + sum.golang.org + MVS (highest of minimums) give reproducible, deterministic builds.",
            "Published versions are immutable: never delete a tag — use retract; never ship replace in a library.",
          ],
        },
      ],
    },
  },
};
