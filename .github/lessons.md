# Lessons Learned

Purpose: Capture high-value lessons discovered during completed prompts so future agents can avoid repeating mistakes.

## Rules
- Add only reusable lessons that are likely to matter again.
- Keep each lesson short and actionable.
- Link to source files when the lesson depends on code patterns.

## Entry Template
| Date | Context | Lesson | Why It Matters |
| --- | --- | --- | --- |
| YYYY-MM-DD | Short task label | One actionable sentence | One short impact sentence |

## Entries
| Date | Context | Lesson | Why It Matters |
| --- | --- | --- | --- |
| 2026-04-18 | Chat customization bootstrap | Keep [AGENTS.md](../AGENTS.md) concise and link to source-of-truth docs instead of duplicating setup details. | Linked docs reduce drift and make future agent guidance more accurate. |
| 2026-04-18 | Convention scan | Keep timeline fields as numeric Date.now() values, consistent with existing sorting in [src/components/TeacherDashboard.tsx](../src/components/TeacherDashboard.tsx) and [src/components/StudentDashboard.tsx](../src/components/StudentDashboard.tsx). | Mixing timestamp types can break ordering and produce inconsistent UI behavior. |
| 2026-04-18 | Skill authoring | For Firebase safety workflows, encode decision branches by change type (`auth`, `config`, `rules`, `data-contract`, `role-flow`) so checks stay focused and repeatable. | Explicit branching prevents missed validations and reduces regressions when scope changes mid-task. |
| 2026-04-18 | Policy hardening | When a workflow leaves validation policy ambiguous, encode explicit defaults directly in the skill instead of deferring to follow-up questions. | Default policies keep execution unblocked and make agent behavior consistent across prompts. |
| 2026-04-18 | Hook design | For completion guards, use `PreToolUse` on `task_complete` with `permissionDecision: "ask"` so risky Firebase diffs are gated without hard-failing normal sessions. | Ask-based gating preserves safety checks while avoiding brittle deny-only workflows. |
| 2026-04-18 | Prompt design | For recurring repository closeout tasks, a dedicated workspace prompt should encode file targets, required row fields, and response format in one place. | Structured closeout prompts reduce missed logging steps and keep team records consistent. |
| 2026-04-19 | Rich text assignment UI | For imported DOCX HTML and Quill content, apply `overflow-wrap: anywhere`, constrain rich media to max width, and allow horizontal scrolling on tables/pre blocks inside the content container. | This prevents assignment content from breaking card layouts while preserving readability for long words, links, and wide elements. |
| 2026-04-19 | Student productivity UI features | Keep assignment timers and language preferences fully client-side (component state and localStorage) when the requirement is personal tracking without persistence in Firestore. | This avoids unnecessary schema/rules changes and prevents non-essential student metadata from being stored. |
| 2026-04-19 | Role policy hardening | Enforce owner-email role mapping in both [src/App.tsx](../src/App.tsx) and [firestore.rules](../firestore.rules), because client-only role checks do not prevent privilege escalation. | Mirroring the policy in rules is required to guarantee only the intended Gmail account can act as lecturer. |
| 2026-04-19 | Git hygiene for secrets | Keep broad ignore rules for env files, debug logs, and key/certificate artifacts, then scan tracked files with `git ls-files` based checks to avoid false positives from build output and dependencies. | Secret scans focused on tracked files better reflect real commit risk and reduce noise from generated bundles. |