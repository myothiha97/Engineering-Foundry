import type { CurriculumModule, Lesson } from "../../../packages/content-schema/src/index";

export const backendModule0: CurriculumModule = {
  id: "backend-0",
  courseId: "backend",
  title: "From Process to Network Service",
  order: 0,
  description:
    "Turn a local process into a bounded, observable service that owns ports, signals, and shutdown.",
  lessonIds: ["backend-process-to-service"],
  projectId: "ledgerflow-stage-1",
};

export const backendProcessToService: Lesson = {
  id: "backend-process-to-service",
  slug: "process-to-service",
  title: "A process that can serve—and stop safely",
  description:
    "Trace resources from process startup through socket acceptance and graceful termination.",
  moduleId: "backend-0",
  estimatedMinutes: 80,
  difficulty: "beginner",
  prerequisites: [],
  learningObjectives: [
    "Explain process, socket, port, and connection boundaries",
    "Design graceful shutdown with bounded draining",
    "Diagnose bind and signal failures",
  ],
  concepts: [
    "process",
    "memory",
    "files",
    "environment",
    "signals",
    "ports",
    "sockets",
    "client-server",
    "graceful-shutdown",
  ],
  ledgerFlowApplications: [
    "Run LedgerFlow Stage 1 as a single Go service",
    "Protect in-flight writes during deployment",
    "Expose startup, readiness, and shutdown state",
  ],
  references: [
    {
      title: "Go net/http Server",
      url: "https://pkg.go.dev/net/http#Server",
      teaches: "HTTP server lifecycle, timeouts, and Shutdown behavior.",
      relevance: "The concrete server primitive used by LedgerFlow.",
      required: true,
      section: "Server and Shutdown",
    },
    {
      title: "signal(7)",
      url: "https://man7.org/linux/man-pages/man7/signal.7.html",
      teaches: "Linux signal semantics and dispositions.",
      relevance: "Explains what deployment systems actually send the process.",
      required: true,
      section: "Signal dispositions; signal mask and pending signals",
    },
    {
      title: "The Twelve-Factor App",
      url: "https://12factor.net/config",
      teaches: "Environment-based deploy configuration.",
      relevance:
        "Useful baseline, with explicit caveats for secret management and typed validation.",
      required: false,
      section: "Config",
    },
  ],
  exercises: [
    {
      id: "be0-predict-bind",
      type: "prediction",
      prompt:
        "Predict what the second process sees when both bind the same address without port sharing.",
      expectedAnswer: "bind fails with address already in use",
      hints: [],
    },
    {
      id: "be0-read-lifecycle",
      type: "code-reading",
      prompt:
        "Find the path where ListenAndServe returning ErrServerClosed is incorrectly logged as an outage.",
      hints: [],
    },
    {
      id: "be0-implement-shutdown",
      type: "implementation",
      prompt: "Add SIGTERM handling, readiness withdrawal, and a 10-second drain deadline.",
      hints: ["Stop new work before waiting for old work."],
    },
    {
      id: "be0-debug",
      type: "debugging",
      prompt:
        "A container takes 30 seconds to stop and is killed mid-write. Identify the missing lifecycle boundary.",
      hints: [],
    },
    {
      id: "be0-refactor",
      type: "refactoring",
      prompt: "Move environment parsing from request handlers into typed startup configuration.",
      hints: [],
    },
    {
      id: "be0-design",
      type: "design",
      prompt:
        "Choose shutdown deadlines for LedgerFlow and justify them from request and platform timeouts.",
      hints: [],
    },
    {
      id: "be0-advanced",
      type: "advanced",
      prompt:
        "Model zero-downtime replacement when old and new instances overlap behind a load balancer.",
      hints: [],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-resource",
      kind: "explain",
      description: "Explain the ownership chain process → file descriptor → socket → connection.",
      required: true,
    },
    {
      id: "predict-failure",
      kind: "predict",
      description: "Predict bind, accept, and signal outcomes in four scenarios.",
      required: true,
    },
    {
      id: "implement-drain",
      kind: "implement",
      description: "Implement and test bounded graceful shutdown.",
      required: true,
    },
    {
      id: "design-stage1",
      kind: "design",
      description: "Defend the LedgerFlow Stage 1 lifecycle.",
      required: true,
    },
  ],
  sections: {
    problem:
      "A function can calculate a balance, but a backend must remain available to other machines, own finite OS resources, reject invalid work, and stop without corrupting accepted work.",
    naive:
      "Start an infinite loop, listen on a port, and let the process disappear when deployment replaces it. This works in a demo because no request overlaps shutdown and no dependency is slow.",
    failure:
      "SIGTERM arrives during a transaction. Readiness remains true, the load balancer sends more requests, and the platform eventually sends SIGKILL. One accepted write has an unknown outcome and the retry can duplicate it.",
    intuition:
      "A service is a process plus a lifecycle contract. Startup acquires resources; readiness promises useful work; serving accepts bounded work; draining withdraws the promise and completes what was accepted; termination releases resources.",
    "mental-model":
      "Treat every service as a state machine: starting → ready → draining → stopped. Signals request transitions; they do not magically make application work safe.",
    mechanics:
      "The OS gives a process virtual memory and a table of file descriptors. A listening socket is one descriptor bound to a local address and port. Accepted connections are new descriptors. Environment variables arrive as process data. SIGTERM is delivered asynchronously; the program must coordinate it with normal control flow. Closing the listener stops new accepts; graceful shutdown waits for active handlers until its context deadline.",
    diagram:
      "Select each lifecycle stage to inspect ownership, allowed transitions, and the failure introduced if that stage lies about readiness.",
    implementation:
      "LedgerFlow constructs typed config, opens dependencies, creates an http.Server with explicit timeouts, listens, marks ready, waits for SIGINT/SIGTERM, marks unready, and calls Shutdown with a bounded context. A second signal forces exit.",
    experiment:
      "Predict user-visible behavior when database latency becomes 8 seconds, request timeout is 5 seconds, shutdown budget is 10 seconds, and SIGTERM arrives at second 3. Reveal the timeline only after committing a prediction.",
    "failure-cases":
      "Address already in use, binding only loopback in a container, leaking accepted sockets, reading mutable environment on every request, ignoring SIGTERM, infinite drain, readiness before dependencies, and treating expected server closure as an error.",
    "trade-offs":
      "Long drains preserve more work but delay replacement. Short drains improve rollout speed but abort requests. Fail-fast startup prevents false readiness but can amplify dependency outages. A single process is operationally simple but remains one failure domain.",
    design:
      "Make lifecycle ownership explicit in main. Keep request handlers unaware of Unix signals. Align server, proxy, and platform timeouts. Design write endpoints for retries because graceful shutdown reduces—but cannot eliminate—ambiguous outcomes.",
    ledgerflow:
      "Stage 1 uses one Go process and in-memory storage. It exposes /health/live and /health/ready, handles SIGTERM, rejects new requests while draining, and snapshots state before exit for the project experiment—not as a production persistence strategy.",
    exercises:
      "Work across prediction, implementation, diagnosis, refactoring, and design. The simulator records incorrect causal links for spaced review.",
    mastery:
      "Draw the lifecycle from memory, explain every owned OS resource, implement graceful shutdown, and debug a forced-kill trace. Then defend the limits of graceful shutdown.",
    summary:
      "Mental model: a service is a process with a lifecycle contract. Invariants: one owner per transition, readiness only after dependencies, bounded drain, no new work after withdrawal. Trap: believing SIGTERM waits. Next: packets, connections, DNS, TLS, and HTTP.",
  },
};

export const backendProject = {
  id: "ledgerflow-stage-1",
  title: "LedgerFlow Stage 1 · In-memory service",
  milestones: [
    "Typed startup config",
    "Transaction API",
    "Lifecycle health endpoints",
    "Graceful shutdown tests",
  ],
  failures: [
    "Port collision",
    "slow handler during drain",
    "second termination signal",
    "unexpected server exit",
  ],
  acceptance: [
    "No new requests after readiness withdrawal",
    "accepted requests drain within budget",
    "race detector passes",
  ],
};
