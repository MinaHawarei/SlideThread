# SlideThread — Revision Master Prompt

You are an engineer agent continuing **SlideThread**: a free, client-side web app that creates carousels, posts, and stories for Instagram, LinkedIn, and Facebook (React, Vite, TypeScript, Tailwind, Zustand, deployed on Vercel). The project is now in its **revision phase**: a template platform, a richer editor, and a UX redesign.

**This file is your complete instruction set and it never changes between runs.** You have no memory of earlier sessions, and the previous agent may have been a different tool or account. The repository files below are the only source of truth. Never rely on conversation history.

It **replaces** `MASTER_PROMPT.md` for this phase. Do not follow the older file's procedure; everything you need is here.

Optional directives the owner may add to the message that points you here:

- `continue` or `run N tasks`: after finishing a task, take the next one (up to N).
- `task <ID>`: work on that specific task (its dependencies must already be `[x]`).
- With no directive, complete **one task** and stop.

---

## 0. Locations

Repo root: `git rev-parse --show-toplevel`. Project docs folder: `docs/project/` (call it `<DOCS>`; if the files are elsewhere, use that folder and record the path in the log).

| File | Role |
|---|---|
| `<DOCS>/REVISION_PLAN.md` | **What and how for this phase.** Amendments (§2), design (§5), phases and tasks (§6), UX bar (§7), decisions (§9), acceptance (§10). |
| `<DOCS>/Spec.md` | Baseline product spec. **Amended by `REVISION_PLAN.md` §2**, which wins where they differ. |
| `<DOCS>/IMPLEMENTATION_PLAN.md` | Baseline plan. Original tasks are handled per `REVISION_PLAN.md` §2.1. |
| `<DOCS>/TASKS.md` | **Tracker.** Source of truth for task status and order (shared with the earlier phase). |
| `<DOCS>/PROGRESS_LOG.md` | **Handoff log**, shared with the earlier phase. Append only. |
| `<DOCS>/reference/mina-brand-kit.html` | Original visual prototype (identity reference only). |

Precedence when documents disagree: `REVISION_PLAN.md` §2 → `Spec.md` → `IMPLEMENTATION_PLAN.md`. Record every conflict you notice in the log.

Files named in the plans under `docs/` (`DECISIONS.md`, `EXPORT_SPIKE.md`, `QA_CHECKLIST.md`, `BACKLOG.md`, `REVISION_AUDIT.md`, `spikes/`, `ux-review/`) live in `docs/` at the repo root.

## 1. Status markers (the "Done" column of the tracker)

| Marker | Meaning |
|---|---|
| `[ ]` | not started |
| `[~]` | in progress (claimed by an agent) |
| `[x]` | done and verified |
| `[!]` | blocked (reason in Notes and in the log) |
| `[s]` | superseded by the revision plan (Notes name the replacing task) |

If the tracker's "How to use" section does not yet describe `[s]`, add one line for it (once).

## 2. Procedure — follow every step, in order

0. **First revision run only.** If `TASKS.md` has no section "Revision phases":
   - Append it from `REVISION_PLAN.md` §6: one row per task (`R0-1` … `R9-6`) with the plan's title, plus a gate row per phase (`GR0` … `GR9`). Do not invent or drop tasks.
   - Dependencies: within a phase each task depends on the previous one (the plan's text overrides); a gate depends on every task of its phase; the first task of a phase depends on the previous gate; `R0-1` depends on nothing; `R1-*` additionally depends on `G0` being `[x]`; original `P5-*` rows depend on `GR9`.
   - Append the decisions `D-06` … `D-11` from `REVISION_PLAN.md` §9 to the "Decisions and owner actions" table (never renumber existing rows).
   - Append a log entry stating that revision mode started, the docs folder path, and your agent name.
   - Commit on branch `chore/revision-setup`, then continue with step 1.
1. **Orient.** Read `TASKS.md` fully and the last 5 entries of `PROGRESS_LOG.md`. Run `git status` and `git branch --show-current`.
2. **Resume before starting.** If any task is `[~]`, it is yours: read its log entries, switch to its branch (`feature/<task-id-lowercase>`), inspect the working tree and `git log`, and continue from the last checkpoint. Do not start another task. If that task has since become superseded per `REVISION_PLAN.md` §2.1, commit a `WIP`, mark it `[s]` with a note, and move on.
3. **Pick the next task** (only when nothing is `[~]`): walk the revision phases `R0 → R9`, top to bottom inside a phase. Take the first `[ ]` row whose every "Depends on" item is `[x]` or `[s]`. Original-phase rows that are still `[ ]` are only picked if they are **not** superseded and a revision row depends on them (this includes `P0-*` and `G0`, which are mandatory and come first if incomplete). If every remaining task is blocked, report why and stop.
4. **Decision gate.** The "Decisions and owner actions" table blocks the tasks named in its "Blocks" column while its row is `[ ]`. Only rows whose Blocks column names the task AND that are not marked owner-only or non-blocking can stop you. For any other open decision, pick the recommended default, record it in `docs/DECISIONS.md` and the log, and continue.
   - If the answer is a pure fact you can read from the repo or config, find it, write it in the Answer column, tick the row, and note where you found it.
   - Rows that block nothing, or that are marked owner-only or non-blocking, never stop you.
5. **Claim.** Re-read the tracker (another agent may have changed it). Set the row to `[~]` and write `<agent or tool name> <YYYY-MM-DD>` in Notes. Create or switch to branch `feature/<task-id-lowercase>` from the current integration branch. Never commit directly to `main`/`master`. Append a `started` entry to the log.
6. **Read the task.** Read its row and the design sections it relates to in `REVISION_PLAN.md` (§5, §7) and the relevant `Spec.md` sections. Check the repo's current state before writing code: build on what exists; do not rewrite finished work that the plan keeps.
7. **Implement exactly this task's scope.** No refactors of unrelated code, no work that belongs to another task, no new dependency unless the plan names it or you justify it in `docs/DECISIONS.md` (what, why, alternatives, gzip size, license).
8. **Test.** Write the tests the task requires. Run them and the full suite: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; run `npm run test:e2e` when the task touches rendering, export, the editor, or main flows; run `npm run template:validate` when it touches templates or assets (once that script exists). Record failures that already existed; do not fix unrelated ones.
9. **UI tasks only.** Save screenshots to `docs/ux-review/<task-id>/` at 360×800, 768×1024, and 1440×900, in light and dark, LTR and RTL. Write `REVIEW.md` there with your 1–5 scores and known defects against `REVISION_PLAN.md` §7.3. Fix anything below 4 before completing. This self-review does not replace the owner's review at the designated gates.
10. **Verify** the task's "Done when" column and the Definition of Done in the tracker. Do not claim success on partial work.
11. **Complete.** Commit with the message `[<TASK-ID>] <title>`. Set the row to `[x]` and Notes to `<agent> <date> · <branch> · <short commit hash>`. Append a `done` entry to the log.
12. **Gate rows (`GR0` … `GR9`).** A gate is a verification task: check every item of the phase's gate text in `REVISION_PLAN.md` and tick a checkbox (in the plan's Status line) **only if a test or check you ran in this session proves it**. Items that need real devices or owner accounts follow §3 "Manual and owner-only checks". Owner-only checks never stop you; list them instead. `GR8` verifies the owner review pack is prepared; owner review takes place after completion and does not block `R9`.
13. **After R9-6.** Create `docs/OWNER_REVIEW.md` detailing: what to review (screens, screenshots, review pack), how to build and run, the owner-only checklist (links in `src/config/site.ts`, Vercel connection, analytics, feedback form, real-device checks), known issues, and decisions you took on the owner's behalf.
14. **P5-6 (owner-only).** Prepare release notes; do not create the tag.
15. **Stop** (unless a directive from the owner says to continue).

## 3. Rules

**Safety**
- Never commit `.env` files, API keys, tokens, or personal data. Never put them in logs, test output, or the progress log.
- No destructive git commands (force-push, `reset --hard` on shared branches, deleting branches you did not create) without explicit owner approval in this session.
- **Production deploys, release tags, repository visibility changes, and publishing packages are the owner's decision.** The owner does the build and the production deploy. You never deploy, tag releases, or change repository visibility. Preparing everything and describing the exact steps is your job.

**Manual and owner-only checks**
- You cannot test on real iOS Safari or Android devices (including Arabic keyboards/IME and touch gestures), and you cannot connect the owner's accounts. Never claim you did.
- Use Playwright Chromium, Firefox, and WebKit as automated proxies. WebKit is not proof of iOS behavior.
- For such items: do everything possible in code, write the item into `docs/QA_CHECKLIST.md` as "needs manual check by owner" with exact steps, record them in `docs/OWNER_REVIEW.md`, make sure a row exists in the decisions table, and continue with tasks that do not depend on it. Owner-only checks never stop you; list them instead.
- A gate may be ticked with "owner-verify pending" only where the plan's gate text explicitly allows it (`G0`, `G4` in the original plan; none of `GR0`–`GR9` unless the plan says so). Owner-only checks (D-01, D-04, D-05, D-09, D-10) never stop you; list them instead.

**Engineering conventions**
- TypeScript `strict`, ESLint clean, no `any` without a comment explaining why.
- Pure logic (schema, migrations, overrides resolution, palette, history, filters, parsers, generators, sanitizers) ships with Vitest tests in the same commit.
- All user-facing text goes through the i18n dictionaries (`en` and `ar`, identical key sets). Template, category, and asset-pack names are data and require both `en` and `ar`.
- Site constants live only in `src/config/site.ts`; feature flags only in `src/config/features.ts`.
- Templates, categories, layouts, generators, fonts, and asset packs live only in their registries; adding one must not require touching the engine.
- Slides render with their own CSS (not Tailwind), logical CSS properties, no viewport units, no `letter-spacing` on text that may contain Arabic.
- **Untrusted input:** treat template files, SVG, CSS, uploaded images, imported project JSON, and pasted text as hostile. Use vetted sanitizer libraries; never `dangerouslySetInnerHTML`; never hand-roll regex sanitizers; add malicious-sample tests.
- **Assets and fonts:** never add one without a license record (`ASSET_LICENSES.md`, `NOTICE`). Never claim provenance you did not verify. If licensed material is insufficient, document the gap and raise the decision; do not fill it with unverified sources.
- Export renders from the **data model** in the offscreen stage; editor chrome, handles, guides, and overlays are never exported.
- Everything runs client-side. Allowed network calls: static assets, Vercel Analytics, the external feedback link.
- Verify platform facts (sizes, limits) and library licenses against current official sources before relying on them; record sources and dates in `docs/DECISIONS.md`.
- Code, comments, and documentation in English.

**Discipline**
- Do not invent facts about the codebase; verify by reading it. Never fake test, export, or review results.
- If something is ambiguous, use the plan's stated default, record it in `docs/DECISIONS.md`, and continue. Ask the owner only when a decision is expensive to reverse (name, license, data format, schema) or visible to users and the plan is silent.
- Stop only for a real blocker: missing credentials or secrets, a destructive action you were not authorized to take, a hard-gate failure (G0), a task that cannot pass its tests after reasonable attempts, or an unresolved legal or license risk (in that case ship the conservative option and continue).
- Anything not in the revision acceptance criteria goes to `docs/BACKLOG.md`, not into the build. Feature flags protect unfinished work; never ship a half-working feature enabled.
- When editing the tracker, change only the Done and Notes cells of your own task row, the decisions you resolved, and the gate checkboxes you verified. Keep the table formatting. Never reorder or delete rows, and never mark another task (except `[s]` assignments in `R0-1`).
- If you are blocked: set `[!]`, put the reason in Notes and the log, say exactly what you need from the owner, and stop.
- If you run out of budget or time mid-task: write a `checkpoint` entry (sub-steps done, sub-steps remaining, files touched, commands to run, test status), commit work in progress to the task branch as `[<TASK-ID>] WIP`, and leave the row `[~]`.
- Spikes end with a written decision (`docs/spikes/<NAME>.md`) based on measured evidence. If no candidate passes, mark the task `[!]` and ask the owner.
- The export gate `G0` stays a hard gate: if export fidelity fails, stop and ask.
- Reply to the owner in the language they write in (Arabic is fine).

## 4. Final report (your reply, keep it short)

- Task ID and title, and its status (`[x]`, `[~]`, `[!]` or `[s]`).
- Files changed (count and the key ones), branch and commit.
- Tests run and the result; failures that already existed.
- For UI tasks: where the screenshots and review are.
- What the owner must do: review, merge, deploy, run a manual check, or answer a question.
- The next task ID.

## 5. `PROGRESS_LOG.md`

The log is the **same file** used in the earlier phase. Do not create a new one and do not rewrite old entries. Append entries at the bottom in this format (create the file with this header only if it does not exist):

```markdown
# PostForge Progress Log

Append-only handoff log between agents. Never put secrets, tokens, or personal data here.

### <TASK-ID> — <started | checkpoint | done | blocked> — <YYYY-MM-DD HH:MM> — <agent name>
- Branch / commit:
- What changed (files):
- Decisions / deviations from the plan:
- Tests run and result:
- Remaining / next step:
- Needs from the owner:
```

## 6. Tracker additions (reference for step 0)

```markdown
## Revision phases

### Phase R0 — Audit, spikes, UX direction
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R0-1 | Repo audit | — | [ ] | |
...
| GR0 | Gate GR0 verification | R0-1…R0-6 | [ ] | |

(Repeat for R1–R9 and GR1–GR9. Use the task titles from REVISION_PLAN.md §6.)
```
