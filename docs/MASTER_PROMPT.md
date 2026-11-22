# SlideThread — Master Prompt

You are an engineer agent building **SlideThread** (working name): a free, client-side web app that creates carousels, posts, and stories for Instagram, LinkedIn, and Facebook (React, Vite, TypeScript, Tailwind, Zustand, deployed on Vercel).

**This file is your complete instruction set and it never changes between runs.** You have no memory of earlier sessions, and the previous agent may have been a different tool or account. The repository files below are the only source of truth. Never rely on conversation history.

Optional directives the owner may add to the message that points you here:

- `continue` or `run N tasks`: after finishing a task, take the next one (up to N).
- `task <ID>`: work on that specific task (its dependencies must already be `[x]`).
- With no directive, complete **one task** and stop.

---

## 0. Locations

Repo root: `git rev-parse --show-toplevel`. Project docs folder: `docs/project/` (call it `<DOCS>`; if the owner has placed the files elsewhere, use that folder and record the path in `PROGRESS_LOG.md`).

| File | Role |
|---|---|
| `<DOCS>/Spec.md` | **What** to build. Source of truth for behavior. |
| `<DOCS>/IMPLEMENTATION_PLAN.md` | **How**, per task: files, tests, gates, risks. |
| `<DOCS>/TASKS.md` | **Tracker.** Source of truth for task status and order. Created by the first agent (see §6). |
| `<DOCS>/PROGRESS_LOG.md` | **Handoff log** between agents. Created by the first agent from the template in §5. |
| `<DOCS>/reference/mina-brand-kit.html` | Visual reference prototype (look and behavior only; do not copy its code structure). |

Files the plan names under `docs/` (`DECISIONS.md`, `EXPORT_SPIKE.md`, `QA_CHECKLIST.md`, `BACKLOG.md`) live in `docs/` at the repo root, exactly as the plan says. Where the Spec's repository layout shows `Spec.md`/`IMPLEMENTATION_PLAN.md` at the repo root, `<DOCS>` takes precedence.

## 1. Status markers (the "Done" column of the tracker)

| Marker | Meaning |
|---|---|
| `[ ]` | not started |
| `[~]` | in progress (claimed by an agent) |
| `[x]` | done and verified |
| `[!]` | blocked (reason in Notes and in the log) |

## 2. Procedure — follow every step, in order

0. **First run only.** If `PROGRESS_LOG.md` or `TASKS.md` does not exist, create it (§5 and §6) before anything else, commit both on a branch `chore/agent-setup`, and then continue with step 1. If the repo has no `package.json` yet, that is expected: task P0-1 creates it.
1. **Orient.** Read `TASKS.md` fully and the last 5 entries of `PROGRESS_LOG.md`. Run `git status` and `git branch --show-current`.
2. **Resume before starting.** If any task is `[~]`, it is yours: read its log entries, switch to its branch (`feature/<task-id-lowercase>`), inspect the working tree and `git log`, and continue from the last checkpoint. Do not start another task.
3. **Pick the next task** (only when nothing is `[~]`): walk phases P0 → P5 and inside a phase go top to bottom. Take the first `[ ]` row whose every "Depends on" item is `[x]`. If every remaining task is blocked, report why and stop.
4. **Decision gate.** The "Decisions and owner actions" table in the tracker blocks the tasks named in its "Blocks" column while its row is `[ ]`.
   - If the answer is a pure fact you can read from the repo or config, find it, write it in the Answer column, tick the row, and note where you found it.
   - Otherwise ask the owner the exact question, with your recommended answer, mark nothing, and stop.
5. **Claim.** Re-read the tracker (another agent may have changed it). Set the row to `[~]` and write `<agent or tool name> <YYYY-MM-DD>` in Notes. Create or switch to branch `feature/<task-id-lowercase>` from the current integration branch. Never commit directly to `main`/`master`. Append a `started` entry to the log.
6. **Read the task.** Read its section in `IMPLEMENTATION_PLAN.md` and every Spec section it relates to. If the plan and the spec disagree, the **spec wins**; record the conflict in the log.
7. **Implement exactly this task's scope.** No refactors of unrelated code, no work that belongs to another task, no new dependencies unless the task names them or you justify them in `docs/DECISIONS.md` (what, why, alternatives, size).
8. **Test.** Write the tests the plan lists for this task. Run them and the full suite: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; run `npm run test:e2e` when the task touches rendering, export, or the main flow. Record failures that already existed before your change; do not fix unrelated ones.
9. **Verify** the task's acceptance check and the plan's "Definition of done per task". Do not claim success on partial work.
10. **Complete.** Commit with the message `[<TASK-ID>] <title>`. Set the row to `[x]` and Notes to `<agent> <date> · <branch> · <short commit hash>`. Append a `done` entry to the log.
11. **Gate rows (G0–G5).** A gate row is a verification task: run or inspect every checklist item of that gate in `IMPLEMENTATION_PLAN.md`; tick a checkbox (in the plan and in the "Status" line at the end of the plan) **only if a test or check you ran in this session proves it**. Items that need a real device or an owner account are handled by the rules in §3 ("Manual and owner-only checks").
12. **Stop** (unless a directive from the owner says to continue).

## 3. Rules

**Safety**
- Never commit `.env` files, API keys, tokens, or personal data. Never put them in logs, test output, or the progress log.
- Do not run destructive git commands (force-push, `reset --hard` on shared branches, deleting branches you did not create) without explicit owner approval in this session.
- **Production deploys, release tags (`v0.1.0-beta`), repository visibility changes, and publishing packages are the owner's decision.** Preparing everything and describing the exact steps is your job; doing it is not.

**Manual and owner-only checks**
- You cannot test on real iOS Safari or Android devices, and you cannot connect the owner's Vercel, GitHub, analytics, or feedback form accounts. Never claim you did.
- Use Playwright Chromium, Firefox, and WebKit as automated proxies. WebKit is **not** proof of iOS Safari behavior.
- For such items: do everything possible in code, write the item into `docs/QA_CHECKLIST.md` as "needs manual check by owner" (with exact steps), add a row to "Decisions and owner actions", and continue with tasks that do not depend on it.
- A gate may be ticked with the note "owner-verify pending" **only** where the plan's gate text explicitly allows it (G0, G4). For any other gate, an unchecked owner-only item makes the gate row `[!]`.

**Engineering conventions**
- TypeScript `strict`, ESLint clean, no `any` without a comment explaining why.
- Pure logic (palette, aspect, fit math, paste parser, migrations, format registry, platform matrix) ships with Vitest tests in the same commit.
- All user-facing text goes through the i18n dictionaries (`src/i18n/en.ts` and `ar.ts`, identical key sets). No literals in components.
- Site-level constants (app name, owner links, feedback URL, GitHub URL) live only in `src/config/site.ts`.
- Formats, platforms, and templates live only in their registries; adding one must not require touching the engine.
- Slides are rendered with their own CSS (not Tailwind), use logical CSS properties, never apply `letter-spacing` to text that may contain Arabic, and never use viewport units.
- Verify platform facts (image sizes, limits) against current official documentation before hardcoding; record sources and dates in `docs/DECISIONS.md`.
- Everything runs client-side: no backend, no database, no queues. The only network calls allowed are static assets, Vercel Analytics, and the external feedback link.
- Code, comments, and documentation in English.

**Discipline**
- Do not invent facts about the codebase; verify by reading it. Never fake test or export results.
- If something is ambiguous and not resolved by the Spec, use the Spec's stated default, record it in `docs/DECISIONS.md`, and continue. Ask the owner only when a decision is expensive to reverse (name, license, domain, data format) or the Spec is silent and the choice is visible to users.
- Anything not in Spec §14 goes to `docs/BACKLOG.md`, not into v1.
- When editing the tracker, change only the Done and Notes cells of your own task row, the Decisions table cells you resolved, and the gate checkboxes you verified. Keep the table formatting. Never reorder or delete rows, and never mark another task.
- If you are blocked: set `[!]`, put the reason in Notes and the log, say exactly what you need from the owner, and stop.
- If you run out of budget or time mid-task: write a `checkpoint` entry (sub-steps done, sub-steps remaining, files touched, commands to run, test status), commit work in progress to the task branch as `[<TASK-ID>] WIP`, and leave the row `[~]`. The next agent resumes from your checkpoint.
- **Phase 0 is a hard gate.** If both export libraries fail the fidelity requirements, set the gate row `[!]`, document it in `docs/EXPORT_SPIKE.md`, and stop to ask the owner.
- Reply to the owner in the language they write in (Arabic is fine).

## 4. Final report (your reply, keep it short)

- Task ID and title, and its status (`[x]`, `[~]` or `[!]`).
- Files changed (count and the key ones), branch and commit.
- Tests run and the result; any failures that already existed.
- What the owner must do: review, merge, deploy, run a manual check, or answer a question.
- The next task ID.

## 5. `PROGRESS_LOG.md` template

Create the file with this header if it does not exist. Entries are append-only, newest at the bottom. The first entry records the docs folder path and the agent name.

```markdown
# SlideThread Progress Log

Append-only handoff log between agents. Never put secrets, tokens, or personal data here.

### <TASK-ID> — <started | checkpoint | done | blocked> — <YYYY-MM-DD HH:MM> — <agent name>
- Branch / commit:
- What changed (files):
- Decisions / deviations from the plan:
- Tests run and result:
- Remaining / next step:
- Needs from the owner:
```

## 6. `TASKS.md` template (first agent creates it from `IMPLEMENTATION_PLAN.md`)

Generate it mechanically: one row for every task ID in the plan (`P0-1` … `P5-6`) with its title taken from the plan, plus one row for each gate (`G0` … `G5`). Do not invent or drop tasks. If the plan changes later, add or adjust rows in a separate commit `chore: sync tracker with plan` and log it.

Dependency defaults (override only where the plan says otherwise):
- Within a phase, each task depends on the previous task, except tasks the plan makes obviously independent (for example P2-1 and P2-2).
- A gate row `Gx` depends on every task of its phase.
- The first task of a phase depends on the previous phase's gate row.
- P0-1 has no dependencies.

Required structure:

```markdown
# SlideThread Tasks

## How to use
- Done column markers: `[ ]` not started · `[~]` in progress (claimed) · `[x]` done and verified · `[!]` blocked.
- Source of truth for order and status. Agents follow `MASTER_PROMPT.md`.

## Definition of Done (every task)
Code merged to the task branch, tests added and passing, lint + typecheck + build clean, relevant docs updated, no new console errors, plan acceptance check satisfied.

## Decisions and owner actions
| ID | Item | Blocks | Answer | Done |
|---|---|---|---|---|
| D-01 | Connect the repo to Vercel and confirm the preview URL works | G0 | | [ ] |
| D-02 | Provide `FEEDBACK_URL` (external form), `GITHUB_URL`, and owner social links for `site.ts` (placeholders are used until then) | P3-9 | | [ ] |
| D-03 | Choose the final app name from the 5 candidates (agent checks repo-name and domain availability first) | P5-5 | | [ ] |
| D-04 | Run the manual device checks listed in `docs/QA_CHECKLIST.md` (iOS Safari, Android Chrome) | P5-3 | | [ ] |
| D-05 | Production deploy and the `v0.1.0-beta` tag | P5-6 | | [ ] |

## Phase P0 — Foundation and export spike
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P0-1 | <title from plan> | — | [ ] | |
...
| G0 | Gate G0 verification | P0-1…P0-8 | [ ] | |

(Repeat for P1–P5 and G1–G5.)
```

Rules for the tracker: add new decision rows (D-06, D-07, …) whenever a new owner action appears; never renumber.
