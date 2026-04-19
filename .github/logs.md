# Work Logs

Purpose: Track completed prompt work so future agents can quickly understand what was done before.

## Notes
- Use one row per completed prompt.
- Keep entries factual and concise.
- Include validation performed (lint/build/manual checks).

## Log
| Date | Prompt/Task | Files Changed | Validation | Outcome |
| --- | --- | --- | --- | --- |
| 2026-04-18 | Initialize chat customization files and ingest repository conventions | [AGENTS.md](../AGENTS.md), [.github/lessons.md](lessons.md), [.github/logs.md](logs.md) | Verified project conventions from config and source files | Baseline agent instructions and tracking workflow established |
| 2026-04-18 | Create firebase-change-safety skill | [.github/skills/firebase-change-safety/SKILL.md](skills/firebase-change-safety/SKILL.md), [.github/logs.md](logs.md), [.github/lessons.md](lessons.md) | Verified skill format against customization reference and checked markdown diagnostics | Reusable Firebase change workflow added for safer auth, rules, and data-model edits |
| 2026-04-18 | Finalize firebase-change-safety defaults | [.github/skills/firebase-change-safety/SKILL.md](skills/firebase-change-safety/SKILL.md), [.github/logs.md](logs.md), [.github/lessons.md](lessons.md) | Checked markdown diagnostics after policy updates | Skill now defines explicit defaults for validation strictness, blocked environments, and scope limits |
| 2026-04-18 | Create firebase-diff-guard hook | [.github/hooks/firebase-diff-guard.json](hooks/firebase-diff-guard.json), [.github/hooks/scripts/firebase-diff-guard.mjs](hooks/scripts/firebase-diff-guard.mjs), [.github/logs.md](logs.md), [.github/lessons.md](lessons.md) | Reviewed hook schema references and performed script dry-run checks | Added deterministic completion guard for Firebase-sensitive diffs |
| 2026-04-18 | Create task-closeout-log prompt | [.github/prompts/task-closeout-log.prompt.md](prompts/task-closeout-log.prompt.md), [.github/logs.md](logs.md), [.github/lessons.md](lessons.md) | Verified prompt frontmatter and markdown diagnostics | Added reusable closeout prompt to standardize logs and lessons updates |
| 2026-04-19 | Fix assignment UI overflow and sticky editor toolbar | [src/components/StudentDashboard.tsx](../src/components/StudentDashboard.tsx), [src/components/TeacherDashboard.tsx](../src/components/TeacherDashboard.tsx), [src/index.css](../src/index.css), [.github/logs.md](logs.md), [.github/lessons.md](lessons.md) | Ran `npm run lint` and `npm run build` successfully | Rich text no longer bleeds outside assignment cards, and editor formatting controls now stay accessible during scroll |
| 2026-04-19 | Add student 60-minute timer and EN/VI language switch | [src/App.tsx](../src/App.tsx), [src/components/StudentDashboard.tsx](../src/components/StudentDashboard.tsx), [src/types.ts](../src/types.ts), [.github/logs.md](logs.md), [.github/lessons.md](lessons.md) | Ran `npm run lint` and `npm run build` successfully | Student assignment view now includes a local 60-minute timer with pause/resume/reset, and the app supports English/Vietnamese UI switching |