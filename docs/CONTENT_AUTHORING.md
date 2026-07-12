# Content authoring

## Required lesson contract

Create lessons under `content/<course>/<module>/index.ts`. Metadata, exercises, references, mastery criteria, and all 16 stage keys are mandatory. `pnpm content:validate` fails on malformed data, unknown prerequisites, or module lesson IDs.

Every concept must move through problem → intuition → mental model → mechanics → implementation → experiment → failure → trade-off → decision → LedgerFlow application → mastery verification. Avoid syntax tours and generic summaries.

## Exercise evidence

- Prediction: commit before reveal.
- Code reading: explain behavior without editing.
- Implementation: pass public and later hidden tests.
- Debugging: identify root cause and evidence, not only a patch.
- Refactoring: preserve behavior while improving boundaries.
- Design: state constraints, choice, cost, and reversal evidence.

Mastery criteria should require multiple evidence kinds. Reading is never sufficient.

## References

Prefer specifications and official documentation. Every reference records what it teaches, why it matters here, required/optional status, and the exact section to study. Do not add context-free resource lists.

## Review checklist

1. Can the learner state the problem and reusable mental model?
2. Are compile-time, runtime, memory/OS/network/database mechanics separated accurately?
3. Is there a realistic failure with causal propagation?
4. Are trade-offs conditional rather than universal?
5. Does the LedgerFlow use justify the concept?
6. Can mastery be demonstrated without recalling terminology?
