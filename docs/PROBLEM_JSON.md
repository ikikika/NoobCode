# Authoring & using problem JSON

NoobCode problems are plain JSON files in `src/content/problems/<slug>.json`,
auto-discovered at build time via `import.meta.glob`. There is no registry to
edit and no in-app upload — you add problems by putting files in that directory.

This guide documents the JSON format. For how to break a solution into teaching
steps, see [`SOLUTION_INSTRUCTIONS.md`](./SOLUTION_INSTRUCTIONS.md).

---

## Adding a problem

1. Copy [`templates/problem.template.json`](../templates/problem.template.json)
   to `src/content/problems/<slug>.json`.
2. Set `slug` to match the filename (`two-sum.json` → `"two-sum"`) and fill in
   the rest. (Or generate the stub with `npm run new:problem -- <slug> "Title"`,
   or via the **New** page in the app — in `dev` it writes the file; on the
   hosted site it downloads it.)
3. Run `npm run validate:content` to check it, then restart `npm run dev` so the
   glob picks it up.

---

## Required shape

Every problem must provide code for **all three languages** (`python`,
`javascript`, `typescript`) wherever code appears. A missing language makes the
import (or `validate:content`) fail with the offending field path.

### Top-level fields

| Field          | Type                                 | Notes                                                                                                                                 |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`         | string                               | URL id. Must be unique and not collide with a built-in. For built-in files it must equal the filename (`two-sum.json` → `"two-sum"`). |
| `title`        | string                               | Display name.                                                                                                                         |
| `order`        | non-negative int                     | Sort key within a pattern group on the list page (lower first).                                                                       |
| `difficulty`   | `"easy" \| "medium" \| "hard"`       |                                                                                                                                       |
| `tags`         | string[]                             | Free-form labels shown as chips.                                                                                                      |
| `patterns`     | PatternId[]                          | **At least one.** See [Patterns](#patterns).                                                                                          |
| `description`  | string                               | Markdown (GitHub-flavored). Use `\n` for newlines.                                                                                    |
| `constraints`  | string[]                             | Shown as a bulleted list.                                                                                                             |
| `examples`     | Example[]                            | May be empty.                                                                                                                         |
| `functionName` | `{ python, javascript, typescript }` | The function the harness calls in each language (use idiomatic names, e.g. `two_sum` vs `twoSum`).                                    |
| `starterCode`  | LangCode                             | The editor's starting code per language.                                                                                              |
| `tests`        | TestCase[]                           | **At least one.**                                                                                                                     |
| `solutions`    | Solution[]                           | **At least one.**                                                                                                                     |

`LangCode` = `{ "python": string, "javascript": string, "typescript": string }`.

### Example

```json
{ "input": "nums = [2,7], target = 9", "output": "[0,1]", "explanation": "optional" }
```

### TestCase

```json
{ "name": "example 1", "args": [[2, 7, 11, 15], 9], "expected": [0, 1], "hidden": false }
```

- `args` is the **array of arguments** spread into the function:
  `args: [[2,7,11,15], 9]` calls `twoSum([2,7,11,15], 9)`.
- `expected` is compared to the return value with a **deep/structural** equality
  (order matters for arrays). Python tuples and sets are normalized to lists.
- `hidden` (default `false`): hidden tests run only on **Run All**, not
  **Run Sample**.

### Solution & steps

`steps` is keyed by language. Include only the languages you are shipping; at
least one language must have steps.

```json
{
  "approachName": "Hash Map",
  "summary": "optional one-liner",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(n)",
  "technique": {
    "primaryPattern": "hash-map",
    "optimal": true,
    "signature": {
      "maxLoopDepth": 1,
      "usesHashStructure": true,
      "usesSorting": false,
      "usesRecursion": false,
      "twoPointer": false
    }
  },
  "steps": {
    "typescript": [
      {
        "title": "optional",
        "explanation": "markdown",
        "code": "function twoSum(...) {\n  return [];\n}\n"
      }
    ]
  }
}
```

- A solution needs **at least one step** in at least one language. The Solution
  tab shows steps as a diff from the previous step's code, so build the solution
  up incrementally (each step's `code` is the full snapshot at that point).
- `technique` is optional but recommended. The solution marked
  `"optimal": true` is used as the **reference** for the Compare tab and the
  built-in code review. Its `signature` (loop depth, hash use, sorting, etc.)
  drives the heuristic verdict.

### Solution step sidecars

Editing multiline `code` strings inside JSON (`\n` everywhere) is painful.
Optional **sidecar** files let you author each step as a real source file, then
pack them back into the JSON (which is still what the app loads).

Layout next to `<slug>.json`:

```
src/content/problems/<slug>/
  solutions/
    00-<approach-slug>/
      typescript/
        01-<step-slug>.ts      # step code (real newlines)
        01-<step-slug>.md      # title + explanation
      javascript/
        01-<step-slug>.js
        01-<step-slug>.md
      python/
        01-<step-slug>.py
        01-<step-slug>.md
```

Each `.md` companion uses YAML frontmatter:

```md
---
title: Start from the function shape
---

Optional explanation markdown.
```

Commands:

```bash
# Create sidecars from an existing problem JSON
npm run steps:unpack -- string-reversal

# After editing .ts/.js/.py (+ .md), write steps back into the JSON
npm run steps:pack -- string-reversal

# Verify sidecars match JSON (also part of validate:content)
npm run steps:check
```

Solution folders are ordered by their numeric prefix and must stay 1:1 with
`solutions[]` in the JSON. Language folders are optional — only include the
languages you are authoring. `npm run steps:pack` with no args packs every
problem that already has a sidecar directory.

---

## Patterns

`patterns` and `technique.primaryPattern` use these ids:

```
hash-map  hash-set  two-pointers  sliding-window  stack  queue
binary-search  recursion  dynamic-programming  backtracking
depth-first-search  breadth-first-search  greedy  sorting
divide-and-conquer  brute-force
```

---

## Minimal complete example

A valid, copy-pasteable problem (`add` returns `a + b`):

```json
{
  "slug": "add-two-numbers-basic",
  "title": "Add Two Numbers",
  "difficulty": "easy",
  "tags": ["math"],
  "patterns": ["brute-force"],
  "description": "Return the sum of `a` and `b`.",
  "constraints": ["-1000 <= a, b <= 1000"],
  "examples": [{ "input": "a = 2, b = 3", "output": "5" }],
  "functionName": { "python": "add", "javascript": "add", "typescript": "add" },
  "starterCode": {
    "python": "def add(a, b):\n    pass\n",
    "javascript": "function add(a, b) {\n}\n",
    "typescript": "function add(a: number, b: number): number {\n  return 0;\n}\n"
  },
  "tests": [
    { "name": "positives", "args": [2, 3], "expected": 5 },
    { "name": "negatives", "args": [-4, 1], "expected": -3, "hidden": true }
  ],
  "solutions": [
    {
      "approachName": "Direct",
      "timeComplexity": "O(1)",
      "spaceComplexity": "O(1)",
      "technique": {
        "primaryPattern": "brute-force",
        "optimal": true,
        "signature": {
          "maxLoopDepth": 0,
          "usesHashStructure": false,
          "usesSorting": false,
          "usesRecursion": false,
          "twoPointer": false
        }
      },
      "steps": [
        {
          "title": "Add and return",
          "explanation": "Return `a + b`.",
          "code": {
            "python": "def add(a, b):\n    return a + b\n",
            "javascript": "function add(a, b) {\n  return a + b;\n}\n",
            "typescript": "function add(a: number, b: number): number {\n  return a + b;\n}\n"
          }
        }
      ]
    }
  ]
}
```

---

## Structured inputs (trees & linked lists)

By default every argument and the return value are passed through as plain JSON.
For binary-tree and linked-list problems, declare an `io` codec so tests stay
readable as arrays while the solution receives real node objects:

```jsonc
{
  "io": { "args": ["tree"], "result": "json" }, // per-arg + return codec
  // ...
  "tests": [{ "name": "t", "args": [[3, 9, 20, null, null, 15, 7]], "expected": [[3], [9, 20], [15, 7]] }]
}
```

- `"tree"` — the array is **level-order** with `null` for missing children; it is
  decoded into nodes with `.val` / `.left` / `.right`. A returned tree is
  re-encoded to the same level-order array (trailing `null`s trimmed).
- `"list"` — the array is decoded into a singly linked list of `.val` / `.next`
  nodes, and a returned list is encoded back to an array.
- `"json"` (default) — passed through untouched.

`io.args[i]` applies to the i-th argument; omit an entry (or the whole `io`
block) to leave it as JSON. The runner injects nothing into your code's scope, so
include any `TreeNode` / `ListNode` class your solution constructs in the
`starterCode` (see `add-two-numbers.json`).

## Design (class) problems

Set `"kind": "design"` for "implement a class" problems (e.g. `min-stack`,
`lru-cache`). `functionName` then names the **class**, and each test drives a
sequence of method calls:

```jsonc
{
  "kind": "design",
  "functionName": { "python": "MinStack", "javascript": "MinStack", "typescript": "MinStack" },
  "tests": [
    {
      "name": "sequence",
      "ops": ["MinStack", "push", "getMin"], // first op constructs the instance
      "args": [[], [-2], []],                  // per-op argument lists
      "expected": [null, null, -2]             // per-op results (constructor → null)
    }
  ]
}
```

Void methods report `null`. The first `op` is always the constructor and its
`expected` entry is `null`.

## Common pitfalls

- **`functionName` and `starterCode` need all three languages.** Walkthrough
  `steps` may ship a subset of languages, but at least one language is required.
- **`args` is a list of arguments, not a single value.** A one-argument function
  still needs `"args": [theValue]`.
- **`expected` comparison is exact and structural.** `[1,0]` ≠ `[0,1]`.
- **Slugs must be unique and match the filename.** `two-sum.json` must have
  `"slug": "two-sum"`; `validate:content` enforces this.
- **If you use sidecars, pack before committing.** `validate:content` fails when
  `<slug>/solutions` drifts from the JSON — run `npm run steps:pack`.
- **TypeScript is executed, not type-checked.** Types are stripped before running,
  and the editor only does syntax highlighting — so a type error won't be
  reported, but a runtime error will.
