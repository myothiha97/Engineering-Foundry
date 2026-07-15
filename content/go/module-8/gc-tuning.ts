import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 8 — how Go's garbage collector behaves and how to tune it. Same
 * beginner-friendly voice as earlier modules: plain language, one analogy per
 * hard idea, a concrete example before the abstract rule. Correct and careful
 * about GC being concurrent (not a big freeze), GOGC as a memory/CPU knob,
 * GOMEMLIMIT as a *soft* ceiling, the death-spiral trap, and the golden rule
 * that allocating less beats tuning the GC.
 */
export const goGcTuning: Lesson = {
  id: "go-gc-tuning",
  slug: "gc-tuning",
  title: "GC behavior & tuning",
  description:
    "Understand Go's concurrent mark-sweep garbage collector, use GOGC and GOMEMLIMIT to trade memory for CPU on purpose, and tune with evidence from gctrace rather than guesswork.",
  moduleId: "go-8",
  estimatedMinutes: 50,
  difficulty: "advanced",
  prerequisites: ["go-stack-heap-escape"],
  learningObjectives: [
    "Explain at a conceptual level how Go's concurrent tri-color mark-sweep collector reclaims heap memory while your program keeps running",
    "Describe GC pacing and how GOGC trades memory against CPU, and set GOMEMLIMIT as a soft ceiling that makes collection more aggressive near the limit",
    "Tune a service with evidence from GODEBUG=gctrace, MemStats, and benchmarks instead of copying settings, and recognize the GOMEMLIMIT death spiral",
  ],
  concepts: ["GOGC", "GOMEMLIMIT", "gc-pacing"],
  references: [
    {
      title: "A Guide to the Go GC",
      url: "https://go.dev/doc/gc-guide",
      teaches:
        "How the collector paces itself, what GOGC and GOMEMLIMIT actually control, and how to reason about the memory/CPU trade-off with real examples.",
      relevance:
        "The authoritative, beginner-readable explanation of everything this lesson teaches; the single best follow-up read.",
      required: false,
      section: "Understanding costs / GOGC / Memory limit",
    },
    {
      title: "runtime package — environment variables (GOGC, GOMEMLIMIT)",
      url: "https://pkg.go.dev/runtime",
      teaches:
        "The exact meaning and accepted values of the GOGC and GOMEMLIMIT environment variables the runtime reads at startup.",
      relevance:
        "The normative reference for the two env knobs you will set on the ledger container.",
      required: false,
      section: "Environment Variables",
    },
    {
      title: "runtime/debug — SetMemoryLimit",
      url: "https://pkg.go.dev/runtime/debug#SetMemoryLimit",
      teaches:
        "How to read and set the soft memory limit from code, including the units (bytes) and the -1 sentinel for 'leave unchanged'.",
      relevance:
        "Shows the programmatic equivalent of GOMEMLIMIT for when a config value must come from your own settings, not the environment.",
      required: false,
      section: "SetMemoryLimit",
    },
    {
      title: "Go 1.19 release notes — soft memory limit",
      url: "https://go.dev/doc/go1.19#runtime",
      teaches:
        "The introduction of GOMEMLIMIT, why it is a soft limit, and the guidance to combine it with GOGC.",
      relevance:
        "Explains when and why the modern OOM-avoidance knob arrived and how it is meant to be used alongside GOGC.",
      required: false,
      section: "Runtime",
    },
  ],
  exercises: [
    {
      id: "go8gc-predict-raise-gogc",
      type: "prediction",
      prompt:
        "A service runs with the default GOGC=100 and its GC is using noticeable CPU. You set GOGC=300 and redeploy. Predict what happens to (a) how often the GC runs, (b) CPU spent on GC, and (c) the service's peak memory use.",
      expectedAnswer:
        "GOGC=300 lets the heap grow to 4× the live set (300% headroom) before collecting, so (a) the GC runs less often, (b) CPU spent on GC goes down, and (c) peak memory goes up — you have traded memory for CPU. It only helps if that extra memory actually fits in the container.",
      hints: [
        "GOGC is the percentage of headroom over the live set before the next GC — 100 means grow to 2×, 300 means grow to 4×.",
        "Fewer collections means less GC CPU but a bigger heap between collections.",
      ],
    },
    {
      id: "go8gc-read-gctrace",
      type: "code-reading",
      prompt:
        "Interpret this line from GODEBUG=gctrace=1:\n\ngc 42 @3.210s 4%: 0.11+2.3+0.05 ms clock, 0.88+0.4/2.1/0+0.40 ms cpu, 52->54->27 MB, 55 MB goal, 8 P\n\nRoughly what is this telling you about the 42nd GC cycle?",
      expectedAnswer:
        "It is the 42nd GC, 3.21s into the run. The '4%' is the cumulative share of CPU spent on GC since startup — low, so GC is cheap here. '52->54->27 MB' means the heap was 52 MB when the GC started, 54 MB when it finished, and 27 MB of that survived (the live set); '55 MB goal' is the heap size the pacer was aiming to trigger at. The tiny ms-clock numbers (0.11+2.3+0.05) show very short pauses with concurrent marking in the middle. 8 P is GOMAXPROCS. Overall: healthy, low-overhead GC.",
      hints: [
        "The a->b->c MB triple is heap-at-start -> heap-at-end -> live-after; the last number is your live set.",
        "The leading percentage is cumulative GC CPU since the program started, not this cycle alone.",
      ],
    },
    {
      id: "go8gc-design-container",
      type: "design",
      prompt:
        "You are deploying the ledger service in a container with a 1 GiB (1024 MiB) memory limit. Its live set under normal posting load sits around 250 MB. Choose GOGC and GOMEMLIMIT, and justify both numbers.",
      expectedAnswer:
        "Set GOMEMLIMIT to about 90–95% of the container limit — roughly 920MiB (leave headroom for the Go runtime's own off-heap memory and non-Go allocations so the OS never OOM-kills you). Leave GOGC at its default 100 (or make it explicit) so steady-state pacing stays normal: at a 250 MB live set the heap would target ~500 MB, well under the limit, so GOMEMLIMIT rarely kicks in and mostly acts as a safety ceiling for load spikes. This is the belt-and-suspenders pattern: GOGC drives steady state, GOMEMLIMIT catches spikes before they OOM.",
      hints: [
        "GOMEMLIMIT should be a fraction of the cgroup limit, not the whole thing — the runtime and cgo/OS allocations live outside the Go heap accounting.",
        "If the default GOGC already keeps the heap comfortably below the limit, you do not need to change it; GOMEMLIMIT is the ceiling, GOGC is the everyday knob.",
      ],
    },
    {
      id: "go8gc-debug-oom",
      type: "debugging",
      prompt:
        "An engineer set GOGC=off to 'make it faster' on the ledger service in its 1 GiB container. It ran fine in a light staging test but is now OOM-killed within minutes under production load. Explain what happened and give the fix.",
      expectedAnswer:
        "GOGC=off disables the garbage collector entirely, so the heap only ever grows and is never reclaimed. Under real posting load allocations pile up until the container exceeds its 1 GiB cgroup limit and the kernel OOM-kills the process. Staging passed only because light load did not allocate enough to hit the ceiling before the test ended. Fix: turn the GC back on (unset GOGC or set a real value like 100), and set GOMEMLIMIT to ~920MiB as a soft ceiling so the collector runs harder as memory climbs and keeps the process alive.",
      hints: [
        "GOGC=off does not mean 'default' — it means the collector never runs.",
        "A never-collected heap plus a hard container limit has exactly one ending.",
      ],
    },
    {
      id: "go8gc-debug-death-spiral",
      type: "debugging",
      prompt:
        "A service has GOMEMLIMIT set to 512MiB. Its live set (memory that is genuinely still in use) has grown over time to about 500 MB. The service now spends most of its CPU in GC and barely serves requests, though it is not OOM-killed. Explain this 'death spiral'.",
      expectedAnswer:
        "GOMEMLIMIT is a *soft* limit: as the heap approaches it, the GC runs more and more aggressively to stay under it. When the live set alone (500 MB) is nearly the whole limit (512MiB), there is almost no room for new allocations before the next GC must fire, so the collector runs almost continuously — burning CPU on repeated collections that can barely reclaim anything, because the memory is actually live. The program isn't OOM-killed, but it thrashes. The fix is not more GC tuning: you must either reduce the live set (allocate/retain less, fix a leak) or raise the memory limit / give the container more RAM. GOMEMLIMIT cannot conjure memory that the program genuinely needs.",
      hints: [
        "Soft limit means the GC works harder to stay under it, not that it magically frees live memory.",
        "When live memory alone is near the limit, every collection reclaims almost nothing yet still costs CPU.",
      ],
    },
    {
      id: "go8gc-implement-setlimit",
      type: "implementation",
      prompt:
        "Your deployment passes the container's memory budget in a config value memBudgetBytes (an int64 number of bytes). In main, set the Go soft memory limit to 90% of it using runtime/debug, so the setting lives in code rather than an env var. Do not touch GOGC.",
      starterCode:
        'package main\n\nimport (\n  "runtime/debug"\n)\n\nfunc configureRuntime(memBudgetBytes int64) {\n  // TODO: set the soft memory limit to 90% of the budget\n}',
      expectedAnswer:
        'package main\n\nimport (\n  "runtime/debug"\n)\n\nfunc configureRuntime(memBudgetBytes int64) {\n  // 90% of the container budget leaves headroom for off-heap/runtime memory.\n  limit := memBudgetBytes / 100 * 90\n  debug.SetMemoryLimit(limit)\n}',
      hints: [
        "debug.SetMemoryLimit takes a number of bytes; passing -1 only reads the current value without changing it.",
        "Compute 90% carefully with integers (e.g. n/100*90) and leave GOGC alone so steady-state pacing is unchanged.",
      ],
    },
    {
      id: "go8gc-design-tune-cpu",
      type: "design",
      prompt:
        "A batch job is CPU-bound and gctrace shows it spending 30% of CPU in GC. It runs in a container with plenty of spare memory. Describe, step by step, how you would tune it — and what evidence would tell you to stop.",
      expectedAnswer:
        "First check whether it is allocating unnecessarily (the escape-analysis lesson: reuse buffers, avoid per-item allocations) — reducing allocation is the real fix and cuts GC work at the source. Only then reach for GOGC: since memory is plentiful, raise GOGC (say to 200, then 400) so the GC runs less often, and re-measure. Evidence to stop: gctrace shows the cumulative GC CPU percentage dropping to an acceptable level, throughput improves in a benchmark, and peak memory (from gctrace's heap numbers or MemStats) still fits comfortably under the container limit. Stop when either GC CPU is acceptable or memory headroom runs out — whichever comes first. Never pick a number without measuring before and after.",
      hints: [
        "The cheapest GC work is the allocation you never made — tie this back to escape analysis before touching any knob.",
        "Raise GOGC in steps and compare gctrace/benchmarks each time; the memory ceiling is what limits how far you can go.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-concurrent-gc",
      kind: "explain",
      description:
        "Explain, without notes, that Go's GC is a concurrent tri-color mark-sweep collector with short stop-the-world pauses, and why that means GC is not a big program-wide freeze.",
      required: true,
    },
    {
      id: "predict-gogc-change",
      kind: "predict",
      description:
        "Correctly predict the effect on GC frequency, GC CPU, and peak memory when GOGC is raised or lowered.",
      required: true,
    },
    {
      id: "debug-oom-spiral",
      kind: "debug",
      description:
        "Diagnose a container OOM (e.g. GOGC=off) and a GOMEMLIMIT death spiral, and explain why more GC tuning cannot fix a live set that exceeds the limit.",
      required: false,
    },
    {
      id: "design-container-limits",
      kind: "design",
      description:
        "Choose GOGC and GOMEMLIMIT for a container of given RAM and defend both numbers with the belt-and-suspenders reasoning.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Go manages memory for you: you allocate with `new`, `make`, or just by taking the address of a value, and you never call `free`. Something has to reclaim memory that's no longer reachable, and that something is the **garbage collector** (GC). Most of the time you never think about it — and that's the point.\n\nBut in a real backend under load, the GC stops being invisible. It costs CPU (finding and reclaiming garbage is work) and it interacts with memory limits (a container that runs out of memory gets killed). Two questions start to matter: is my service spending too much CPU collecting garbage, and is it going to run out of memory and get OOM-killed? Both are tunable — if you understand what the GC is doing and measure before you touch the knobs.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a busy kitchen. The GC is the person clearing dirty dishes while the cooks keep working. Clear too rarely and dishes pile up until there's no counter space left (out of memory). Clear constantly and you spend all your effort clearing instead of cooking (too much CPU). Tuning the GC is choosing how full the counters get before you clear them.",
          },
        },
        {
          type: "points",
          items: [
            "You never call `free` in Go — the **garbage collector** reclaims unreachable memory for you.",
            "Under load the GC costs **CPU** (doing the reclaiming) and interacts with **memory limits** (avoiding OOM).",
            "Both costs are tunable, but only if you understand and measure what the GC is doing.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Now the model that makes the knobs make sense. After each collection there's a **live set** — the memory that's genuinely still reachable and in use. Your program keeps allocating, so the heap grows above the live set. The GC's job is to run again *before* the heap grows too far. \"Too far\" is exactly what **GOGC** defines.\n\n**GOGC is a percentage of headroom. ** GOGC=100 (the default) means: let the heap grow to 100% *over* the live set — i.e. to 2× the live set — before triggering the next GC. If the live set is 250 MB, the GC aims to fire when the heap reaches ~500 MB. Raise GOGC and you allow more headroom (fewer, later collections → more memory, less CPU).\n\nLower it and you allow less (more, earlier collections → less memory, more CPU). GOGC=off removes the trigger entirely, so the heap only grows. This is the single knob for the memory-versus-CPU trade.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "GOGC: how much the heap grows over the live set before the next GC",
            kind: "compare",
            nodes: [
              {
                id: "low",
                label: "Low GOGC (e.g. 50)",
                detail:
                  "Heap triggers at 1.5× the live set. More frequent GCs → less peak memory, more CPU spent collecting.",
                tone: "accent",
              },
              {
                id: "high",
                label: "High GOGC (e.g. 300)",
                detail:
                  "Heap triggers at 4× the live set. Fewer GCs → more peak memory, less CPU spent collecting.",
                tone: "muted",
              },
            ],
            caption:
              "GOGC=100 (default) triggers at 2× the live set. It's a dial between memory and CPU — turning it one way costs the other.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Live set vs heap size",
            text: "The live set is what survives a collection (still reachable). The heap size is the live set plus everything you've allocated since the last GC. GOGC controls how big that gap is allowed to get before the GC runs again.",
          },
        },
      ],
    },
    mechanics: {
      body: "The mechanism that decides *when* to collect is called **pacing**. The runtime doesn't wait for the heap to hit the GOGC target and then panic — it estimates how fast you're allocating and starts the concurrent mark early enough that it *finishes* right around the target. That's why you rarely see the heap blow far past the goal: the pacer is steering toward it continuously.\n\n**GOMEMLIMIT** (added in Go 1.19) adds a second input to the pacer: a **soft** total-memory ceiling. As the heap climbs toward GOMEMLIMIT, the pacer runs the GC *more aggressively* — more often, earlier — to try to stay under the limit, even if GOGC's headroom hasn't been used up. It's the modern way to avoid OOM in a container.\n\nCrucially it's *soft*: the runtime works to stay under it but can briefly exceed it, and it cannot free memory that's genuinely live. You set both via environment variables (`GOGC`, `GOMEMLIMIT`) or from code (`debug.SetGCPercent`, `debug.SetMemoryLimit`).",
      blocks: [
        {
          type: "note",
          note: {
            tone: "info",
            title: "Two knobs, two jobs",
            text: "GOGC drives steady-state pacing (how much headroom over the live set). GOMEMLIMIT is a ceiling that makes the GC run harder as you approach it. Use them together: GOGC for the everyday trade-off, GOMEMLIMIT as the guardrail that keeps a container from OOMing.",
          },
        },
        {
          type: "example",
          example: {
            title: "Setting the knobs — env or code",
            language: "bash",
            code: '# Via environment (read at process startup):\nexport GOGC=100          # default headroom; often left implicit\nexport GOMEMLIMIT=920MiB  # soft ceiling for a ~1 GiB container\n\n# GOMEMLIMIT accepts units: B, KiB, MiB, GiB (powers of 1024).\n# GOGC accepts a number (percent) or the word "off".',
            takeaway:
              "The env vars are read once at startup. GOMEMLIMIT takes a size with binary units; GOGC takes a percentage or `off`.",
          },
        },
        {
          type: "example",
          example: {
            title: "The same settings from code (runtime/debug)",
            language: "go",
            code: 'import "runtime/debug"\n\nfunc main() {\n    debug.SetGCPercent(100)                 // same as GOGC=100\n    debug.SetMemoryLimit(920 * 1024 * 1024) // ~920 MiB soft limit, in bytes\n    // Passing -1 to either reads the current value without changing it.\n    // run the service...\n}',
            takeaway:
              "SetGCPercent and SetMemoryLimit are the programmatic equivalents. SetMemoryLimit takes bytes; use it when the budget comes from your own config instead of the environment.",
          },
        },
        {
          type: "points",
          items: [
            "**Pacing**: the runtime starts the concurrent GC early so it finishes near the target — it steers, not reacts.",
            "**GOMEMLIMIT** feeds a soft ceiling into the pacer; the GC runs harder as the heap nears it.",
            "Set both via env (`GOGC`, `GOMEMLIMIT`) or code (`debug.SetGCPercent`, `debug.SetMemoryLimit`); `-1` reads without changing.",
          ],
        },
      ],
    },
    diagram: {
      body: "Let's watch the heap over time and see where each knob acts. The sawtooth below is the classic shape: the heap climbs as you allocate, a GC runs and drops it back to the live set, then it climbs again. GOGC sets how high each tooth is allowed to climb (relative to the live set). GOMEMLIMIT sets a hard-looking ceiling that, as the teeth approach it, squeezes them shorter by triggering collections earlier.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Heap over time: what GOGC and GOMEMLIMIT each control",
            kind: "sequence",
            nodes: [
              {
                id: "grow",
                label: "Heap grows as you allocate",
                detail: "climbs above the live set between collections",
              },
              {
                id: "target",
                label: "Reaches the GOGC target",
                detail: "e.g. 2× the live set at GOGC=100",
                tone: "accent",
              },
              {
                id: "gc",
                label: "GC runs (mostly concurrent)",
                detail: "reclaims garbage; heap drops back toward the live set",
                tone: "success",
              },
              {
                id: "repeat",
                label: "Climb repeats — a sawtooth",
                detail: "tooth height is set by GOGC",
              },
              {
                id: "near",
                label: "Heap nears GOMEMLIMIT",
                detail: "pacer triggers GC earlier to stay under the ceiling",
                tone: "danger",
              },
              {
                id: "cap",
                label: "Teeth get shorter near the limit",
                detail: "more frequent collections cap peak memory",
              },
            ],
            caption:
              "GOGC sets how tall each sawtooth tooth is; GOMEMLIMIT is the ceiling that shortens the teeth as you approach it.",
          },
        },
      ],
    },
    implementation: {
      body: "You can't tune what you can't see, so the first real skill is *observing* the GC. The cheapest window is `GODEBUG=gctrace=1`, which prints one line per collection to stderr. You read it to answer two questions: how much CPU is GC costing, and how big is my live set. For programmatic checks there's `runtime.ReadMemStats`, and for deep dives there's `pprof`'s heap profile.\n\nThe workflow is always the same: measure first, change one knob, measure again, keep it only if the evidence says so. Never set GOGC or GOMEMLIMIT blindly.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Turn on the GC trace",
            language: "bash",
            code: "# Prints one line per GC cycle to stderr:\nGODEBUG=gctrace=1 ./ledger-service\n\n# Example line:\n# gc 42 @3.210s 4%: 0.11+2.3+0.05 ms clock, ... , 52->54->27 MB, 55 MB goal, 8 P\n#     ^cycle ^uptime ^cumulative GC CPU%      ^heap start->end->live  ^goal ^GOMAXPROCS",
            takeaway:
              "Read the `4%` (cumulative CPU spent on GC) and the `52->54->27 MB` triple (heap start → end → live set). Those two numbers drive almost every tuning decision.",
          },
        },
        {
          type: "example",
          example: {
            title: "Read the live set from code with MemStats",
            language: "go",
            code: 'import (\n    "fmt"\n    "runtime"\n)\n\nfunc logHeap() {\n    var m runtime.MemStats\n    runtime.ReadMemStats(&m)\n    // HeapAlloc: bytes of allocated, still-reachable heap objects.\n    // NumGC: how many GC cycles have run so far.\n    fmt.Printf("heap=%d MB, gc-cycles=%d\\n", m.HeapAlloc/1024/1024, m.NumGC)\n}',
            takeaway:
              "ReadMemStats gives the same information programmatically — useful for exposing heap size and GC counts as metrics on the running service.",
          },
        },
        {
          type: "points",
          items: [
            "`GODEBUG=gctrace=1` → one line per GC; read cumulative GC CPU% and the heap→live triple.",
            "`runtime.ReadMemStats` → the same numbers in code, for metrics and dashboards.",
            "Workflow: measure → change one knob → measure again → keep only if evidence supports it.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. A service has a steady live set of 200 MB and runs with the default GOGC=100 in a container with 4 GiB of memory. gctrace shows it spending 18% of CPU in GC, which is hurting throughput, and memory usage is nowhere near the limit.\n\nYou change GOGC from 100 to 400 and redeploy. Predict, before reading on: what happens to GC frequency, GC CPU%, and peak memory?\n\nHere's the trace. At GOGC=400 the heap is allowed to grow to 5× the live set (400% headroom over 200 MB ≈ 1 GB) before a collection, instead of 2× (~400 MB). So the GC runs far less often, and gctrace's cumulative CPU% drops sharply — maybe from 18% toward single digits. Peak memory rises to roughly 1 GB, but that's fine here because the container has 4 GiB to spare.\n\nThis is the *good* case for raising GOGC: you had spare memory and a GC-CPU problem, so you traded the memory you had for the CPU you needed — and you confirmed it with gctrace, not a hunch. Had memory been tight, the same change could have OOM-killed the service.",
    },
    "failure-cases": {
      body: "The failures here cluster around two misunderstandings: treating GOGC=off as harmless, and forgetting that GOMEMLIMIT is soft and can't free live memory. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**GOGC=off in a memory-limited container** → the heap never shrinks; it grows until the container OOM-kills the process. Only ever safe with a hard memory ceiling and a bounded workload.",
            "**GOMEMLIMIT death spiral** → live set ≈ the limit, so every GC reclaims almost nothing yet runs constantly; CPU pegged, throughput gone. Fix the live set or add memory, not the knobs.",
            "**GOMEMLIMIT set to 100% of the container** → the runtime's off-heap and non-Go allocations push total memory past the cgroup limit anyway. Set it to ~90–95%.",
            "**Tuning GOGC without measuring** → you trade a resource you may not have; the win in staging becomes an OOM in production. Always read gctrace before and after.",
            "**Tuning the GC before reducing allocations** → the cheapest collection is the garbage you never created; escape-analysis wins come first, knobs second.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The death spiral, concretely",
            language: "bash",
            code: "# GOMEMLIMIT=512MiB, but the live set has grown to ~500 MB.\n# gctrace shows collections firing back-to-back, reclaiming almost nothing:\n# gc 900 @61.1s 71%: ... 505->506->500 MB, 512 MB goal\n# gc 901 @61.2s 72%: ... 506->507->500 MB, 512 MB goal\n#                ^^^ cumulative GC CPU climbing fast; live set barely drops",
            takeaway:
              "When the live set (the last number in the triple) is nearly the goal, the GC thrashes: constant collections, ~500 MB always live, CPU% climbing. No knob fixes this — you must shrink the live set or raise the limit.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Every GC setting is a trade, and the whole skill is knowing which resource you're spending and whether you have it. None of these should scare you off — they mark where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**Raising GOGC**: less GC CPU and better throughput, paid for in higher peak memory — only a win if that memory exists.",
            "**Lowering GOGC**: smaller heap, useful when memory is the scarce resource, paid for in more GC CPU.",
            "**GOMEMLIMIT as a ceiling**: strong OOM protection, but push it too low relative to the live set and you invite the death spiral.",
            "**GOGC=off**: minimum GC CPU, but only sane for short-lived, bounded-memory jobs — never for a long-running service in a memory limit.",
            "**Tuning at all vs. allocating less**: knobs move the trade-off; reducing allocation removes the work entirely and should come first.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. First and loudest: **allocate less before you tune anything** — the best GC optimization is the garbage you never create, which is what the escape-analysis lesson was about; GC tuning is the *second* lever, not the first. Second: in a container, set GOMEMLIMIT to ~90–95% of the cgroup memory limit (not 100%), because the Go runtime and any non-Go allocations live outside the heap accounting.\n\nThird: use both knobs together — GOGC for steady-state pacing, GOMEMLIMIT as the ceiling. And always, always measure with gctrace or a benchmark before and after; never cargo-cult a number.",
      blocks: [
        {
          type: "points",
          items: [
            "Reduce allocations first (escape analysis); tune the GC second.",
            "In a container, GOMEMLIMIT ≈ 90–95% of the cgroup limit — leave headroom for off-heap/runtime memory.",
            "Use GOGC and GOMEMLIMIT together: GOGC for steady state, GOMEMLIMIT as the guardrail.",
            "Measure before and after every change (gctrace, benchmarks, MemStats); no blind knob-turning.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Setting limits for the ledger container",
            context:
              "The ledger service ships in a 1 GiB (1024 MiB) container. Its live set under normal posting load sits around 250 MB, with spikes at month-end close.",
            insight:
              "Set GOMEMLIMIT to ~920MiB (90% of 1024) so the runtime has headroom and never trips the cgroup OOM killer. Leave GOGC at the default 100: at a 250 MB live set the heap targets ~500 MB, comfortably under the limit in steady state, so GOMEMLIMIT stays a safety ceiling that only bites during spikes. Belt (GOGC) and suspenders (GOMEMLIMIT).",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this when you can explain that Go's GC is a concurrent tri-color mark-sweep collector with tiny pauses (not a big freeze), predict what raising or lowering GOGC does to GC frequency, CPU, and peak memory, diagnose both a container OOM and a GOMEMLIMIT death spiral and explain why more tuning can't fix a live set that exceeds the limit, and choose GOGC/GOMEMLIMIT for a container with the belt-and-suspenders reasoning. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Three ideas carry this lesson. **The GC is concurrent, not a freeze** — it's a tri-color mark-sweep collector that marks live memory alongside your running goroutines with only tiny stop-the-world pauses.\n\n**GOGC and GOMEMLIMIT are the knobs** — GOGC sets how far the heap grows over the live set before collecting (a memory-versus-CPU trade), and GOMEMLIMIT is a *soft* ceiling that makes the GC run harder as you approach it, the modern way to avoid OOM in a container; use them together.\n\n**Tune with evidence, and allocate less first** — read gctrace before and after, set GOMEMLIMIT to ~90–95% of the container limit, and remember that the cheapest collection is the garbage you never created.",
      blocks: [
        {
          type: "points",
          items: [
            "Go's GC is a concurrent tri-color mark-sweep collector with short (sub-ms) stop-the-world pauses.",
            "GOGC = headroom over the live set before the next GC (100 = 2×); higher trades memory for less CPU, lower the reverse; `off` disables it.",
            "GOMEMLIMIT is a *soft* memory ceiling that paces the GC harder near the limit — belt-and-suspenders with GOGC; can't free genuinely-live memory (death spiral).",
            "Measure with gctrace/MemStats before tuning, set GOMEMLIMIT to ~90–95% of the container limit, and reduce allocations before reaching for the knobs.",
          ],
        },
      ],
    },
  },
};
