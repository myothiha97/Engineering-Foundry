import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 5, lesson — talking to a relational database with the standard
 * database/sql package. Written in the same beginner-friendly voice as
 * Modules 0–4: plain language, one analogy per hard idea, a concrete example
 * before every abstract rule. Reformats the go.dev "Accessing relational
 * databases" material into learner-facing prose. Correct and idiomatic for a
 * modern Go + PostgreSQL stack (pgx driver, Context-aware calls). This lesson
 * is security- and correctness-critical: it unlocks LedgerFlow persistence.
 */
export const goDatabaseSql: Lesson = {
  id: "go-database-sql",
  slug: "database-sql",
  title: "Accessing relational databases (database/sql)",
  description:
    "Query, mutate, and transact against a SQL database with Go's standard database/sql package — using a pooled *sql.DB, Context-aware calls, parameterized queries that stop SQL injection, and the defer-rollback transaction pattern.",
  moduleId: "go-5",
  estimatedMinutes: 65,
  difficulty: "intermediate",
  prerequisites: ["go-error-wrapping", "go-time-context"],
  learningObjectives: [
    "Open a database with a blank-imported driver and treat the returned *sql.DB as a long-lived connection POOL, not a single connection",
    "Read and write safely with the Context variants (QueryContext/QueryRowContext/ExecContext), always using parameterized placeholders and never string-concatenating user input",
    "Group several writes into one atomic transaction using BeginTx, the defer tx.Rollback() safety net, and a final tx.Commit()",
  ],
  concepts: [
    "database/sql",
    "connection-pool",
    "prepared-statements",
    "transactions",
    "sql-injection",
  ],
  ledgerFlowApplications: [
    "Open one pooled *sql.DB at startup and share it across every LedgerFlow request handler instead of dialing Postgres per request",
    "Insert a transaction row and recalculate the running balance inside a single BeginTx/Commit unit so a balance is never left half-updated",
    "Build every WHERE and INSERT with $1/$2 placeholders so a hostile account name or memo can never alter the SQL",
  ],
  references: [
    {
      title: "Tutorial: Accessing a relational database",
      url: "https://go.dev/doc/tutorial/database-access",
      teaches:
        "The end-to-end mechanics of Open, QueryContext with Scan, QueryRowContext with sql.ErrNoRows, and ExecContext for inserts, using a real driver.",
      relevance:
        "A hands-on walkthrough of exactly the calls this lesson teaches, from opening the pool to reading rows.",
      required: true,
      section: "Get a database handle and connect; Query for multiple rows; Add data",
    },
    {
      title: "Accessing relational databases",
      url: "https://go.dev/doc/database/",
      teaches:
        "Why *sql.DB is a pool, how to configure it (SetMaxOpenConns and friends), and the canonical patterns for transactions, prepared statements, and NULL handling.",
      relevance:
        "The reference guide behind every design decision in this lesson — the pool, Context calls, and the defer-rollback transaction pattern.",
      required: true,
      section: "Opening a database handle; Executing transactions; Managing connections",
    },
    {
      title: "Avoiding SQL injection risk",
      url: "https://go.dev/doc/database/sql-injection",
      teaches:
        "Why placeholder parameters (not string formatting) are the defense against SQL injection, and how the driver keeps data separate from SQL text.",
      relevance:
        "The authoritative statement of the #1 rule in this lesson: never concatenate user input into a query.",
      required: true,
      section: "Using parameters; What not to do",
    },
  ],
  exercises: [
    {
      id: "go5db-predict-open",
      type: "prediction",
      prompt:
        "A service calls `db, err := sql.Open(\"pgx\", dsn)` at startup with the database server switched OFF, then checks `err`. Predict whether `err` is non-nil, and predict what would instead surface the connection failure.",
      expectedAnswer:
        "err is nil — sql.Open only validates arguments and prepares the pool; it does not dial the database. The connection failure surfaces on first real use, or immediately if you call db.PingContext(ctx).",
      hints: [
        "sql.Open is lazy: it hands back a pool without contacting the server.",
        "Use db.PingContext to force a real connection attempt at startup.",
      ],
    },
    {
      id: "go5db-read-injection",
      type: "code-reading",
      prompt:
        "Read `q := fmt.Sprintf(\"SELECT * FROM accounts WHERE name = '%s'\", name)` followed by `db.QueryContext(ctx, q)`. Explain what happens when `name` is `x' OR '1'='1`, and rewrite it the safe way.",
      hints: [
        "Sprintf pastes the user's text directly INTO the SQL, so their quotes become part of the query.",
        "Pass the value as a parameter: db.QueryContext(ctx, \"SELECT * FROM accounts WHERE name = $1\", name).",
      ],
    },
    {
      id: "go5db-read-rows",
      type: "code-reading",
      prompt:
        "Read a rows loop that does `for rows.Next() { rows.Scan(&a.ID, &a.Name) ; out = append(out, a) }` but has no `defer rows.Close()` and never calls `rows.Err()`. Name the two bugs and what each one causes.",
      hints: [
        "Without Close, the underlying connection can be held out of the pool and leak.",
        "rows.Next() returning false can mean 'done' OR 'an error stopped us' — only rows.Err() tells them apart.",
      ],
    },
    {
      id: "go5db-implement-getbalance",
      type: "implementation",
      prompt:
        "Implement getBalance so it reads a single account's balance by id using a parameterized QueryRowContext, and returns a wrapped ErrAccountNotFound (keeping it detectable with errors.Is) when the row does not exist.",
      starterCode:
        'package main\n\nimport (\n\t"context"\n\t"database/sql"\n\t"errors"\n\t"fmt"\n)\n\nvar ErrAccountNotFound = errors.New("account not found")\n\nfunc getBalance(ctx context.Context, db *sql.DB, id string) (int64, error) {\n\t// TODO: SELECT balance FROM accounts WHERE id = $1\n\t// Use QueryRowContext + Scan. Map sql.ErrNoRows to ErrAccountNotFound.\n\treturn 0, nil\n}',
      expectedAnswer:
        'func getBalance(ctx context.Context, db *sql.DB, id string) (int64, error) {\n\tvar balance int64\n\terr := db.QueryRowContext(ctx,\n\t\t"SELECT balance FROM accounts WHERE id = $1", id,\n\t).Scan(&balance)\n\tif errors.Is(err, sql.ErrNoRows) {\n\t\treturn 0, fmt.Errorf("account %s: %w", id, ErrAccountNotFound)\n\t}\n\tif err != nil {\n\t\treturn 0, fmt.Errorf("querying balance: %w", err)\n\t}\n\treturn balance, nil\n}',
      hints: [
        "QueryRowContext(...).Scan(&balance) does the query and the read in one line.",
        "QueryRow reports 'no match' as sql.ErrNoRows from Scan — check it with errors.Is and wrap with %w.",
      ],
    },
    {
      id: "go5db-debug-nullscan",
      type: "debugging",
      prompt:
        "`rows.Scan(&memo)` into a `var memo string` fails at runtime with `converting NULL to string is unsupported` because the memo column is nullable. Explain the cause and give two correct fixes.",
      hints: [
        "A SQL NULL has no string value, so it cannot land in a plain string.",
        "Scan into a sql.NullString (check .Valid) or into a *string pointer that becomes nil for NULL.",
      ],
    },
    {
      id: "go5db-refactor-tx",
      type: "refactoring",
      prompt:
        "Two separate ExecContext calls — one inserting a transaction row, one updating the account balance — currently run outside any transaction, so a crash between them leaves the balance wrong. Refactor them into one atomic unit using BeginTx, the defer tx.Rollback() safety net, and a final Commit.",
      hints: [
        "tx, err := db.BeginTx(ctx, nil); then run both writes with tx.ExecContext.",
        "defer tx.Rollback() right after BeginTx — it's a harmless no-op once Commit succeeds; end with return tx.Commit().",
      ],
    },
    {
      id: "go5db-advanced-pool",
      type: "advanced",
      prompt:
        "Under load your service exhausts Postgres connections and new requests hang. Explain how the *sql.DB pool causes this, which knob bounds it (SetMaxOpenConns), and why passing a Context with a deadline turns the silent hang into a clean, timely error.",
      hints: [
        "The pool opens new connections on demand up to its limit; unbounded, it can overwhelm the server.",
        "When the pool is maxed, a call BLOCKS waiting for a free connection — a Context deadline makes that wait fail fast instead of hanging.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-pool",
      kind: "explain",
      description:
        "Explain why *sql.DB is a connection pool (not one connection), why sql.Open does not connect, and why you open it once and share it.",
      required: true,
    },
    {
      id: "predict-injection",
      kind: "predict",
      description:
        "Given a query, predict whether it is injectable, and correctly identify the parameterized rewrite that closes the hole.",
      required: true,
    },
    {
      id: "implement-transaction",
      kind: "implement",
      description:
        "Write a multi-statement transaction using BeginTx, defer tx.Rollback(), and tx.Commit(), with all calls Context-aware and parameterized.",
      required: true,
    },
    {
      id: "design-persistence",
      kind: "design",
      description:
        "Design LedgerFlow's persistence layer: where the pool lives, where transactions wrap writes, and how NULL and 'not found' are handled.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Almost every backend service you will ever write needs to remember things: accounts, orders, transactions. That memory lives in a database, and the database is a separate program on the other side of a network connection. So your Go code needs a disciplined way to send it SQL, hand over user-supplied values *safely*, read results back, and group related writes so they either all happen or none do.\n\nGo's answer is the standard library package `database/sql`. It does not talk to any particular database itself. Instead it defines one common API — open, query, execute, transact — and lets you plug in a **driver** (a small package that knows how to speak PostgreSQL, MySQL, SQLite, and so on) underneath. Learn this one API and you can talk to almost any relational database, and the security- and correctness-critical rules are the same everywhere.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of `database/sql` as a universal power outlet and the driver as the plug adapter for a specific country. Your appliance (your Go code) always has the same plug; you just swap the adapter for Postgres or MySQL. You wire your code to the outlet, not to the wall behind it.",
          },
        },
        {
          type: "points",
          items: [
            "The database is a separate process reached over a connection — not part of your program's memory.",
            "`database/sql` gives one standard API; a **driver** implements it for a specific database.",
            "You need to send values safely, read rows back, and group writes atomically — this lesson covers all three.",
          ],
        },
      ],
    },
    naive: {
      body: "The first instinct, coming from other languages or from shell scripting, is to build the query as a string and paste the user's values straight into it. It reads naturally and it works in the demo:\n\n`q := fmt.Sprintf(\"SELECT balance FROM accounts WHERE name = '%s'\", name)`\n\nA second naive instinct is to treat the connection like a file you open and close: dial the database at the start of each request, run the query, close it at the end. Both instincts feel tidy. Both are quietly wrong — the first is a security hole, the second throws away performance and will exhaust your database under load.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The two tempting shortcuts",
            language: "go",
            code:
              '// Shortcut 1: paste the value into the SQL text.\nname := r.URL.Query().Get("name")\nq := fmt.Sprintf("SELECT balance FROM accounts WHERE name = \'%s\'", name)\nrows, _ := db.QueryContext(ctx, q) // looks fine... until name contains a quote\n\n// Shortcut 2: open a fresh connection per request.\nfunc handle(w http.ResponseWriter, r *http.Request) {\n    db, _ := sql.Open("pgx", dsn) // a NEW pool every request\n    defer db.Close()\n    // ...\n}',
            takeaway:
              "Shortcut 1 lets a user rewrite your query. Shortcut 2 spins up and tears down a connection pool per request, defeating the whole point of pooling.",
          },
        },
        {
          type: "points",
          items: [
            "Pasting user input into SQL text (string formatting) is the classic SQL-injection mistake.",
            "Opening a database per request is wasteful — `*sql.DB` is meant to be created once and reused.",
          ],
        },
      ],
    },
    failure: {
      body: "Watch shortcut 1 fail. Your query is `... WHERE name = '<name>'`. A normal user sends `Alice` and gets one row. An attacker sends `x' OR '1'='1` as the name. Because you pasted it in with `Sprintf`, the database now receives `... WHERE name = 'x' OR '1'='1'` — a condition that is always true — and happily returns *every* account. With a slightly nastier input the same hole can drop tables. The compiler never warned you, the demo passed, and the test with `Alice` passed. The bug only appears when someone feeds you a value containing a quote. This is **SQL injection**, and it is one of the most common serious vulnerabilities in real systems.\n\nThe root cause is a confusion of two things that must stay separate: the **SQL text** (which you, the programmer, control) and the **data values** (which the user controls). The moment user data becomes part of the SQL text, the user can write SQL.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "One quote turns a lookup into a dump",
            context:
              "A search box builds `WHERE name = '<input>'` with fmt.Sprintf. A user types `x' OR '1'='1`. The query returns every account in the table; a variant with a semicolon could delete data.",
            insight:
              "The user's quote closed your string literal and the rest became SQL. Data was allowed to become code — that is exactly what parameterized placeholders prevent.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "The rule this lesson exists to teach",
            text: "NEVER build SQL by concatenating or formatting user input into the query string. Always send values as parameters through placeholders ($1, $2 for Postgres; ? for MySQL/SQLite). The driver keeps data and SQL text strictly apart.",
          },
        },
      ],
    },
    intuition: {
      body: "Fix both shortcuts with two mental shifts.\n\nFirst, the connection. `sql.Open` does not give you a single connection you must nurse — it gives you a `*sql.DB`, which is a **connection pool**: a managed set of connections that it opens, hands out, reclaims, and reuses for you. It is safe for many goroutines to use at once. So you open it *once* at startup, keep it for the life of the program, and share it everywhere. You never open one per request.\n\nSecond, the values. Instead of pasting a value into the SQL, you leave a numbered **placeholder** (`$1`, `$2`, …) where the value goes and pass the actual value as a separate argument. The SQL text and the data travel on separate tracks all the way to the database, so a value can never be mistaken for SQL. This is also what a **prepared statement** does under the hood — the query is parsed once with holes in it, then the holes are filled with data.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "One pool, many callers — SQL and data kept apart",
            kind: "flow",
            nodes: [
              { id: "app", label: "your handlers", detail: "many goroutines" },
              { id: "db", label: "*sql.DB", detail: "the pool (opened once)", tone: "accent" },
              { id: "conns", label: "connections", detail: "opened & reused for you" },
              { id: "pg", label: "PostgreSQL", detail: "SQL text + params arrive separately", tone: "success" },
            ],
            caption:
              "The pool sits between your code and the server. Placeholders keep user data on a separate track from the SQL text.",
          },
        },
        {
          type: "points",
          items: [
            "`*sql.DB` is a POOL — open once, share everywhere, safe for concurrent use.",
            "Placeholders (`$1`, `$2`) send data on a separate track from the SQL, closing the injection hole.",
            "This is what a prepared statement does: parse the query once, fill the holes with data.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Carry four sentences and the whole package falls into place.\n\nFirst: **`*sql.DB` is a pool, and `sql.Open` doesn't connect.** Open just validates your arguments and sets up the pool; the first real connection happens lazily on first use (or when you call `db.PingContext`). Second: **use the Context variants of every call** — `QueryContext`, `QueryRowContext`, `ExecContext` — so a slow query can be cancelled by a timeout or a dropped client, exactly as you learned in the time & context lesson. Third: **placeholders, always.** Every user value goes through `$1`/`$2`, never into the SQL string. Fourth: **pick the call by shape of result** — `QueryContext` for many rows, `QueryRowContext` for exactly one, `ExecContext` for writes that return no rows (INSERT/UPDATE/DELETE).",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-line rule",
            text: "Open one pooled *sql.DB, call the Context variant that matches your result shape (Query = many, QueryRow = one, Exec = no rows), and pass every value as a placeholder parameter.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Which call do I use?",
            text: "QueryContext → you expect 0..N rows and will loop. QueryRowContext → you expect exactly one row (or none). ExecContext → an INSERT/UPDATE/DELETE where you only care that it ran (and maybe how many rows changed).",
          },
        },
      ],
    },
    mechanics: {
      body: "The precise picture. You import the driver for its **side effect**: `import _ \"github.com/jackc/pgx/v5/stdlib\"`. The blank identifier `_` means 'I don't reference this package by name, I just need its `init()` to run' — and that `init()` registers the driver under a name (here, `\"pgx\"`) so `sql.Open(\"pgx\", dsn)` can find it. You then use only the standard `database/sql` API; the driver stays invisible.\n\nReading many rows is a loop with a strict shape. `rows, err := db.QueryContext(ctx, sql, args...)` gives you a `*sql.Rows` cursor. You **must** `defer rows.Close()` immediately (it returns the underlying connection to the pool). Then `for rows.Next()` advances one row at a time and `rows.Scan(&x, &y)` copies that row's columns into your variables — the pointer count and order must match the SELECT. After the loop you **must** check `rows.Err()`, because `rows.Next()` returns `false` both when the data is exhausted *and* when an error stopped it early; only `rows.Err()` distinguishes them. For a single row, `db.QueryRowContext(...).Scan(&x)` combines query and read; if nothing matched, `Scan` returns the sentinel `sql.ErrNoRows`, which you detect with `errors.Is`. For writes, `res, err := db.ExecContext(...)` returns a `sql.Result` you can ask for `RowsAffected()`.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The rows loop (Query for many rows)",
            kind: "sequence",
            nodes: [
              { id: "q", label: "rows, err := db.QueryContext(ctx, sql, args...)", detail: "run query, get a cursor" },
              { id: "close", label: "defer rows.Close()", detail: "return the connection to the pool — do this now", tone: "accent" },
              { id: "loop", label: "for rows.Next() { rows.Scan(&...) }", detail: "one row per iteration; pointers match columns" },
              { id: "err", label: "if err := rows.Err(); err != nil", detail: "Next() == false could mean error, not just done", tone: "danger" },
            ],
            caption:
              "defer Close and check rows.Err() are not optional — skipping them leaks connections or hides mid-iteration failures.",
          },
        },
        {
          type: "example",
          example: {
            title: "Import the driver for its side effect",
            language: "go",
            code:
              'import (\n\t"database/sql"\n\n\t_ "github.com/jackc/pgx/v5/stdlib" // blank import: runs init(), registers "pgx"\n)\n\n// Now the standard API can find the driver by name.\ndb, err := sql.Open("pgx", "postgres://learning:learning@localhost:5432/app")',
            takeaway:
              'The `_` import runs the driver\'s init() (which calls sql.Register) without you referencing it directly. After that you touch only database/sql.',
          },
        },
        {
          type: "points",
          items: [
            "`import _ \"...driver\"` runs the driver's `init()` so `sql.Open` can find it by name.",
            "`defer rows.Close()` immediately after a successful `QueryContext` — it frees the connection.",
            "After the loop, check `rows.Err()`; `rows.Next()` returning false can mean 'error', not just 'done'.",
            "`QueryRowContext(...).Scan(...)` returns `sql.ErrNoRows` when nothing matched — detect with `errors.Is`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Let's watch a single safe read end to end, from the pooled handle to a scanned struct. The value the user supplied (`id`) rides the parameter track as `$1`; it never touches the SQL text. Select a step to see what each stage owns.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A safe single-row read, start to finish",
            kind: "sequence",
            nodes: [
              { id: "pool", label: "db (pooled *sql.DB)", detail: "opened once at startup, shared" },
              { id: "call", label: 'db.QueryRowContext(ctx, "... WHERE id = $1", id)', detail: "SQL text + id as a parameter", tone: "accent" },
              { id: "conn", label: "pool lends a connection", detail: "borrowed for this call, returned after" },
              { id: "scan", label: "row.Scan(&acc.ID, &acc.Balance)", detail: "columns copied into your struct" },
              { id: "norows", label: "sql.ErrNoRows?", detail: "no match → wrap as ErrAccountNotFound", tone: "danger" },
              { id: "done", label: "return acc, nil", detail: "one row, safely read", tone: "success" },
            ],
            caption:
              "The id travels as data ($1), the connection is borrowed and returned automatically, and 'no match' is a specific detectable error.",
          },
        },
      ],
    },
    implementation: {
      body: "Here is the whole toolkit in one file: opening the pool once with a real connectivity check, a multi-row read with the mandatory `defer Close`/`rows.Err()`, a single-row read that maps `sql.ErrNoRows` to a domain error, and a write with `ExecContext`. Every value is a placeholder; every call is Context-aware.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Open once, query safely, read every row",
            language: "go",
            code:
              'package store\n\nimport (\n\t"context"\n\t"database/sql"\n\t"errors"\n\t"fmt"\n\t"time"\n\n\t_ "github.com/jackc/pgx/v5/stdlib"\n)\n\nvar ErrAccountNotFound = errors.New("account not found")\n\ntype Account struct {\n\tID      string\n\tName    string\n\tBalance int64\n}\n\n// Open the POOL once and verify connectivity. Call this at startup, keep the *sql.DB.\nfunc Open(ctx context.Context, dsn string) (*sql.DB, error) {\n\tdb, err := sql.Open("pgx", dsn) // does NOT connect yet\n\tif err != nil {\n\t\treturn nil, fmt.Errorf("opening pool: %w", err)\n\t}\n\tdb.SetMaxOpenConns(25) // bound the pool so we never overwhelm Postgres\n\n\tpingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)\n\tdefer cancel()\n\tif err := db.PingContext(pingCtx); err != nil { // force a real connection now\n\t\treturn nil, fmt.Errorf("connecting to database: %w", err)\n\t}\n\treturn db, nil\n}\n\n// Many rows: Query + loop + defer Close + rows.Err().\nfunc ListAccounts(ctx context.Context, db *sql.DB) ([]Account, error) {\n\trows, err := db.QueryContext(ctx,\n\t\t"SELECT id, name, balance FROM accounts ORDER BY name")\n\tif err != nil {\n\t\treturn nil, fmt.Errorf("listing accounts: %w", err)\n\t}\n\tdefer rows.Close() // return the connection to the pool no matter what\n\n\tvar out []Account\n\tfor rows.Next() {\n\t\tvar a Account\n\t\tif err := rows.Scan(&a.ID, &a.Name, &a.Balance); err != nil {\n\t\t\treturn nil, fmt.Errorf("scanning account: %w", err)\n\t\t}\n\t\tout = append(out, a)\n\t}\n\tif err := rows.Err(); err != nil { // did iteration stop on an error?\n\t\treturn nil, fmt.Errorf("iterating accounts: %w", err)\n\t}\n\treturn out, nil\n}\n\n// One row: QueryRow + Scan, with sql.ErrNoRows mapped to a domain error.\nfunc GetAccount(ctx context.Context, db *sql.DB, id string) (Account, error) {\n\tvar a Account\n\terr := db.QueryRowContext(ctx,\n\t\t"SELECT id, name, balance FROM accounts WHERE id = $1", id, // id is a PARAMETER\n\t).Scan(&a.ID, &a.Name, &a.Balance)\n\tif errors.Is(err, sql.ErrNoRows) {\n\t\treturn Account{}, fmt.Errorf("account %s: %w", id, ErrAccountNotFound)\n\t}\n\tif err != nil {\n\t\treturn Account{}, fmt.Errorf("getting account %s: %w", id, err)\n\t}\n\treturn a, nil\n}\n\n// A write: Exec returns a Result, not rows.\nfunc Rename(ctx context.Context, db *sql.DB, id, name string) error {\n\tres, err := db.ExecContext(ctx,\n\t\t"UPDATE accounts SET name = $1 WHERE id = $2", name, id)\n\tif err != nil {\n\t\treturn fmt.Errorf("renaming account %s: %w", id, err)\n\t}\n\tif n, _ := res.RowsAffected(); n == 0 {\n\t\treturn fmt.Errorf("account %s: %w", id, ErrAccountNotFound)\n\t}\n\treturn nil\n}',
            takeaway:
              "One pool opened and pinged at startup; every value passed as a placeholder; every read either loops with Close+Err() or maps ErrNoRows to a domain error.",
          },
        },
        {
          type: "points",
          items: [
            "Call `Open` once at startup and pass the `*sql.DB` down — don't reopen per request.",
            "`PingContext` after Open turns a lazy pool into a real, verified connection (with a timeout).",
            "Multi-row: always `defer rows.Close()` and check `rows.Err()`. Single-row: check `sql.ErrNoRows`.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before reading on, commit to a prediction — a corrected wrong guess sticks better than a right answer you skimmed. Here are two writes with no transaction around them:\n\n`db.ExecContext(ctx, \"INSERT INTO transactions (account_id, amount) VALUES ($1, $2)\", id, amt)`\n`db.ExecContext(ctx, \"UPDATE accounts SET balance = balance + $1 WHERE id = $2\", amt, id)`\n\nThe process crashes (or the request is cancelled) *between* the two calls. Question: what is the state of the database afterward? Decide now, then reveal.\n\nThe answer: the transaction row exists but the balance was never updated — the two are now **out of sync**, and nothing will ever reconcile them. Each `ExecContext` is its own independent, already-committed unit of work; there is no relationship between them, so the first survives and the second simply never happened. This is exactly the situation a database **transaction** exists to prevent. Wrapping both writes in one transaction makes them **atomic**: either both land together on `Commit`, or — if anything goes wrong before `Commit` — both are discarded on `Rollback`, leaving the database exactly as it was. For anything touching money, this is non-negotiable.",
    },
    "failure-cases": {
      body: "Almost every database/sql bug is one of a handful of recurring slips. Here are the ones you will actually hit and the signal each gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**Formatted user input into the SQL string** → SQL injection; the demo passes, an attacker's quote rewrites your query. Use `$1` placeholders.",
            "**Opened a `*sql.DB` per request** → connection churn and pool exhaustion under load. Open once, share it.",
            "**Forgot `defer rows.Close()`** → the borrowed connection is never returned; the pool slowly starves and requests hang.",
            "**Skipped `rows.Err()` after the loop** → a mid-iteration failure looks like a clean 'end of rows', so you silently drop data.",
            "**Scanned a nullable column into a plain `string`/`int`** → runtime error 'converting NULL to string is unsupported'. Use `sql.NullString` or a pointer.",
            "**Used non-Context calls (`Query`, `Exec`)** → a slow query can't be cancelled by a client disconnect or timeout; it hangs a connection.",
            "**Treated `sql.ErrNoRows` as a hard failure** → returned a 500 where the answer is simply 'not found' (a 404). Detect it with `errors.Is`.",
          ],
        },
        {
          type: "example",
          example: {
            title: "NULL needs a nullable target",
            language: "go",
            code:
              '// memo column is nullable; this row has memo = NULL.\nvar memo string\nerr := db.QueryRowContext(ctx, "SELECT memo FROM txns WHERE id = $1", id).Scan(&memo)\n// runtime error: sql: Scan error ... converting NULL to string is unsupported\n\n// Fix: scan into a type that can represent NULL.\nvar memo sql.NullString\n_ = db.QueryRowContext(ctx, "SELECT memo FROM txns WHERE id = $1", id).Scan(&memo)\nif memo.Valid {\n    fmt.Println("memo:", memo.String) // present\n} else {\n    fmt.Println("no memo") // it was NULL\n}',
            takeaway:
              "A SQL NULL has no plain value. Scan it into sql.NullString (check .Valid) or a *string that becomes nil.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "database/sql gives you choices, and each has a cost. The goal is a policy you can defend plus the signal that would change it.",
      blocks: [
        {
          type: "points",
          items: [
            "**Standard `database/sql` vs an ORM**: the standard package keeps your SQL visible and dependency-light, but you write the queries and scanning by hand; an ORM saves boilerplate at the cost of hidden queries and a heavy dependency.",
            "**`QueryRowContext` vs `QueryContext`**: QueryRow is simplest when you truly want one row, but returns `ErrNoRows` you must handle; Query is right for 0..N rows but forces the Close/Err loop even for one.",
            "**Sentinel `sql.ErrNoRows` vs empty result**: mapping it to a domain 'not found' gives clean 404s, but you must remember it only comes from QueryRow — Query simply yields zero iterations.",
            "**Bounded pool (`SetMaxOpenConns`) vs unbounded**: a cap protects the database from too many connections but can make callers wait when saturated; leaving it unbounded risks overwhelming Postgres. Pair the cap with Context deadlines so waiting fails fast.",
            "**Ad-hoc queries vs prepared statements**: prepared statements (`db.PrepareContext`) pay off when you run the *same* query many times; for one-off queries the plain parameterized call is simpler and just as safe.",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into a habit that scales across a service. Open exactly one `*sql.DB` at startup, verify it with `PingContext`, bound it with `SetMaxOpenConns`, and pass it into a thin storage layer — never reach for a global or reopen per request. Inside that layer, every method takes a `context.Context` and uses the Context call variants, every user value is a placeholder, and every method that changes more than one row does so inside a transaction. Map `sql.ErrNoRows` to a domain 'not found' error at the storage boundary so the layers above decide on a 404 without knowing SQL exists. That discipline — one pool, Context everywhere, placeholders always, transactions for multi-write invariants — keeps persistence both safe and predictable as the code grows.",
      blocks: [
        {
          type: "points",
          items: [
            "One pool, opened and pinged at startup, injected into a storage layer — not a per-request open, not a global.",
            "Every storage method is Context-aware and parameterized; no value ever enters the SQL string.",
            "Any operation that must stay consistent across multiple writes runs inside a single transaction.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A storage layer that hides SQL from the rest of the app",
            context:
              "The service layer calls store.GetAccount(ctx, id) and gets back either an Account or ErrAccountNotFound. It never sees a *sql.DB, a placeholder, or sql.ErrNoRows.",
            insight:
              "Keeping database/sql behind a storage boundary means the pool, parameters, and NULL handling live in one place — and the layers above stay database-agnostic and testable.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "Here is the lesson applied to LedgerFlow, and it is the exact reason this lesson unlocks persistence. Recording a transaction touches *two* rows that must agree: a new row in `transactions`, and the account's running `balance`. If only one lands, the ledger is corrupt. So the store wraps both writes in a single transaction using the canonical Go pattern: `BeginTx`, an immediate `defer tx.Rollback()` as a safety net, both writes with `tx.ExecContext` and `$1/$2` placeholders, and a final `tx.Commit()`. The defer is the key idea — `Rollback` after a successful `Commit` is a harmless no-op, so on the happy path it does nothing, but on *any* error path (an early `return`, a scan failure, a cancelled Context) it guarantees the half-finished transaction is discarded and no changes leak. One `*sql.DB` pool, opened at startup, serves every request.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Recording a LedgerFlow transaction atomically",
            language: "go",
            code:
              'func (s *Store) RecordTransaction(ctx context.Context, accountID string, amount int64) error {\n\ttx, err := s.db.BeginTx(ctx, nil) // nil = default isolation\n\tif err != nil {\n\t\treturn fmt.Errorf("begin: %w", err)\n\t}\n\tdefer tx.Rollback() // safety net: no-op after Commit, undo on any early return\n\n\t// Write 1: the transaction row.\n\tif _, err := tx.ExecContext(ctx,\n\t\t"INSERT INTO transactions (account_id, amount) VALUES ($1, $2)",\n\t\taccountID, amount,\n\t); err != nil {\n\t\treturn fmt.Errorf("inserting transaction: %w", err)\n\t}\n\n\t// Write 2: recalculate the running balance.\n\tif _, err := tx.ExecContext(ctx,\n\t\t"UPDATE accounts SET balance = balance + $1 WHERE id = $2",\n\t\tamount, accountID,\n\t); err != nil {\n\t\treturn fmt.Errorf("updating balance: %w", err)\n\t}\n\n\t// Both writes succeeded — make them permanent, together.\n\tif err := tx.Commit(); err != nil {\n\t\treturn fmt.Errorf("commit: %w", err)\n\t}\n\treturn nil\n}',
            takeaway:
              "BeginTx + defer tx.Rollback() + tx.Commit() makes the insert and the balance update atomic: both land, or neither does. The deferred Rollback covers every error path automatically.",
          },
        },
        {
          type: "points",
          items: [
            "The insert and the balance update are one atomic unit — a crash between them can never desync the ledger.",
            "`defer tx.Rollback()` right after `BeginTx` guarantees no dangling transaction on any error path; it's a no-op once `Commit` succeeds.",
            "Both writes use `tx.ExecContext` with placeholders, so hostile input can never alter the SQL.",
          ],
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I recognize QueryRowContext' into 'I can open a pool, read safely, and transact without looking it up'. Work across prediction, code-reading, implementation, debugging, refactoring, and an advanced task — each produces a different kind of evidence, so clearing one doesn't cover the rest.",
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain why `*sql.DB` is a pool and why `sql.Open` doesn't connect; look at a query and say whether it's injectable and how to parameterize it; write a Context-aware, parameterized transaction with `BeginTx`, `defer tx.Rollback()`, and `Commit`; and design where the pool and transactions live in a service. Check a criterion only when you genuinely have that evidence — reading the lesson doesn't count.",
    },
    summary: {
      body: "Three ideas carry the whole lesson: **`*sql.DB` is a long-lived pool you open once and share**; **every user value goes through a placeholder (`$1`), never into the SQL string**; and **multi-write invariants belong in a transaction with `BeginTx` + `defer tx.Rollback()` + `Commit`**. Always use the Context call variants, always `defer rows.Close()` and check `rows.Err()`, and map `sql.ErrNoRows` to a domain 'not found'.",
      blocks: [
        {
          type: "points",
          items: [
            "`sql.Open` returns a POOL and does not connect; use `PingContext` to verify, open it once, share it.",
            "Parameterize everything with `$1`/`$2` (Postgres) or `?` (MySQL) — never format user input into SQL.",
            "Pick by result shape: `QueryContext` (many), `QueryRowContext` (one, may return `sql.ErrNoRows`), `ExecContext` (writes).",
            "Multi-row reads: `defer rows.Close()` and check `rows.Err()` after the loop, always.",
            "Transactions: `tx, _ := db.BeginTx(ctx, nil)`, `defer tx.Rollback()`, do the writes, `tx.Commit()`.",
            "Scan nullable columns into `sql.NullString`/pointers; use the Context variants so slow queries can be cancelled.",
          ],
        },
      ],
    },
  },
};
