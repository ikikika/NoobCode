# How to write a solution (for authors & AIs)

This document tells anyone — a human or an AI generating a new problem — how to
decompose a `solution` into incremental **steps** so the Solution tab teaches the
approach as a guided build-up. Read `docs/PROBLEM_JSON.md` for the full JSON
field reference; this file is about the _pedagogy_ of the `steps` array.

## The core idea

The Solution tab renders each step as a **diff against the previous step**
(`StepViewer`). So a learner should be able to click **Next** and watch the
function grow a little at a time, from an empty shell to the finished answer.

Each `step.code` is the **full code snapshot at that point** (not just the new
lines) — the app computes the diff for you.

## Rules

1. **One small logical block per step.** A step introduces just the lines that
   belong to a single idea: "create the hash map", "add the loop", "return on a
   match". Not a single token, not the whole function — a coherent move.
2. **Aim for ~4–7 steps per solution.** Fewer than 3 isn't a build-up; more than
   ~8 is usually too granular to click through.
3. **Step 1 is always the empty shell** — the function signature plus a default
   return that keeps it valid (`return []` / `return false` / `return 0`).
4. **Every later step is a superset of the previous one** — only add (or lightly
   adjust) lines; never reshuffle everything, or the diff becomes noise.
5. **All three languages** (`python`, `javascript`, `typescript`) must stay in
   lockstep — the same step in each language adds the same logical block.
6. **`title`** = the action in a few words ("Compute the complement").
   **`explanation`** = one or two sentences on _what_ and _why_ (markdown,
   backticks for code terms). Keep it tight.
7. The **last step** is the complete, test-passing solution.

## A worked shape

For a typical "loop + accumulator/lookup" solution:

1. Signature + default return.
2. Create the data structure (map/set/stack/accumulator) and, if relevant, set
   the final return in terms of it.
3. Add the loop (empty body).
4. Compute the per-iteration value (complement, current char, etc.).
5. The decision (the `if` that returns early or records the answer).
6. The follow-up action (store/push/accumulate).

Branch-heavy solutions (e.g. a stack matcher) split the loop body across two
steps: the "closing" case, then the "else" case.

## Multiple solutions

List solutions from **simplest/most-naive to optimal**. Mark exactly the best one
with `technique.optimal: true` — it becomes the reference for the Compare tab and
the code review. Set each solution's `technique.signature` to honestly describe
_that_ solution's shape:

- `maxLoopDepth`: 0 none, 1 single loop, 2 nested, …
- `usesHashStructure`: a dict/set/Map/Set/object is used.
- `usesSorting`: the code sorts.
- `usesRecursion`: the function calls itself.
- `twoPointer`: a `left = 0` / `right = len - 1` style pair.

## Tests

Provide several `tests`. Cover the happy path (the examples), plus edge cases as
`"hidden": true` (empty input, single element, negatives, no-answer). `args` is
the **argument list** spread into the function; `expected` is compared
structurally, so array order matters.

## Checklist before finishing

- [ ] Each solution has ~4–7 steps, step 1 is the empty shell, last step passes.
- [ ] Every step has python + javascript + typescript code that compiles/runs.
- [ ] Steps only grow; diffs read cleanly.
- [ ] Exactly one solution is `optimal: true`; signatures are accurate.
- [ ] `npm run validate:content` passes.
