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
   the rest. (Or run `npm run new:problem -- <slug> "Title"` to generate a stub.)
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
  "steps": [
    {
      "title": "optional",
      "explanation": "markdown",
      "code": { "python": "...", "javascript": "...", "typescript": "..." }
    }
  ]
}
```

- A solution needs **at least one step**. The Solution tab shows steps as a diff
  from the previous step's code, so build the solution up incrementally (each
  step's `code` is the full snapshot at that point).
- `technique` is optional but recommended. The solution marked
  `"optimal": true` is used as the **reference** for the Compare tab and the
  built-in code review. Its `signature` (loop depth, hash use, sorting, etc.)
  drives the heuristic verdict.

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

## Common pitfalls

- **All three languages are required.** Omitting `typescript` (or any language)
  anywhere — `functionName`, `starterCode`, or a step's `code` — fails validation.
- **`args` is a list of arguments, not a single value.** A one-argument function
  still needs `"args": [theValue]`.
- **`expected` comparison is exact and structural.** `[1,0]` ≠ `[0,1]`.
- **Slugs must be unique and match the filename.** `two-sum.json` must have
  `"slug": "two-sum"`; `validate:content` enforces this.
- **TypeScript is executed, not type-checked.** Types are stripped before running,
  and the editor only does syntax highlighting — so a type error won't be
  reported, but a runtime error will.
