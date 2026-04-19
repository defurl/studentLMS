---
name: firebase-change-safety
description: "Safely implement Firebase Authentication, Firestore rules, config, and data-model changes in studentLMS. Use when editing auth flows, firestore.rules, firebase-applet.json, role routing, or assignment/submission read-write paths to prevent permission regressions and broken classroom flows."
argument-hint: "Describe the Firebase change, affected files, and expected behavior"
user-invocable: true
---

# Firebase Change Safety

## Outcome
Produce a safe Firebase-related change with explicit risk checks, validation evidence, and follow-up actions.

## When to Use
- Any change to Firebase auth, Firestore config, Firestore rules, or role-based access.
- Any feature that reads/writes `users`, `assignments`, or `submissions`.
- Any update that can affect status transitions (`pending`, `submitted`, `graded`) or sorting by timestamps.

## Scope Boundaries
- In scope: Firebase Authentication, Firestore config/rules, role routing, and Firestore-backed data contracts.
- Out of scope by default: Firebase Storage and Cloud Functions changes. Use a dedicated skill for those areas.

## Required Inputs
- Change intent in one to three sentences.
- Expected user-facing behavior after the change.
- Files expected to be touched (if known).

## Procedure
1. Classify the change type.
   - `auth`: sign-in providers, domain authorization, user creation paths.
   - `config`: Firebase project/database identifiers and runtime config wiring.
   - `rules`: Firestore permission logic.
   - `data-contract`: TypeScript types and Firestore document fields.
   - `role-flow`: Teacher and student routing and permissions.

2. Map blast radius before editing.
   - Always inspect [src/firebase.ts](../../../src/firebase.ts), [src/App.tsx](../../../src/App.tsx), [src/types.ts](../../../src/types.ts), [src/components/TeacherDashboard.tsx](../../../src/components/TeacherDashboard.tsx), [src/components/StudentDashboard.tsx](../../../src/components/StudentDashboard.tsx), and [firestore.rules](../../../firestore.rules).
   - For setup-sensitive changes, also inspect [FIREBASE_SETUP.md](../../../FIREBASE_SETUP.md) and [firebase-applet.json](../../../firebase-applet.json).

3. Apply change-type guardrails.
   - If `auth` or `config` changed:
     - Keep auth error messaging actionable in [src/firebase.ts](../../../src/firebase.ts).
     - Confirm authorized-domain and provider assumptions still match [FIREBASE_SETUP.md](../../../FIREBASE_SETUP.md).
     - Ensure Firestore initialization still uses the intended database id from [firebase-applet.json](../../../firebase-applet.json).
   - If `rules` changed:
     - Verify each modified rule corresponds to a real query/write path in dashboard components.
     - Ensure teacher vs student data boundaries are preserved for read and update operations.
   - If `data-contract` changed:
     - Update [src/types.ts](../../../src/types.ts) and all reads/writes together.
     - Keep time fields numeric with `Date.now()` to preserve sorting behavior.
   - If `role-flow` changed:
     - Confirm role selection, persistence, and dashboard routing remain consistent in [src/App.tsx](../../../src/App.tsx).

4. Enforce implementation conventions.
   - Prefer `doc(collection(...))` and `setDoc(...)` when creating new documents with explicit ids.
   - Route Firestore failures through `handleFirestoreError(error, operationType, path)`.
   - Preserve the current content model where assignment and submission bodies are HTML strings.

5. Validate safety and behavior.
   - Run `npm run lint`.
   - Run `npm run build`.
    - Validation strictness by change type:
       - For `auth`, `rules`, `data-contract`, or `role-flow`: manual behavior checks are required.
       - For `config` only: manual behavior checks are recommended and may be skipped with a short rationale if no user-visible flow changed.
    - Manual Firebase behavior checks:
       - Teacher can sign in and create assignment.
       - Student can open assignment, auto-create pending submission, save draft, and submit.
       - Teacher can review and grade submission.
       - Student cannot edit after submitted or graded.
       - Access control still blocks unauthorized reads/updates.
    - Blocked environment policy:
       - If manual checks are blocked (for example no Firebase credentials), proceed only when `npm run lint` and `npm run build` pass.
       - In closeout, mark each skipped manual check as blocked, include reason, and state residual risk and required human follow-up.

6. Report results in closeout.
   - List changed files and why each changed.
   - Call out regressions prevented or residual risks.
   - Include validation outcomes and unresolved blockers.

## Completion Criteria
- No new type/build errors from the Firebase-related change.
- Rules and code paths are aligned for all modified reads/writes.
- Role routing and submission status behavior remain correct.
- Any environment-dependent verification gaps are documented.
- Scope remained within Auth/Firestore unless the task explicitly asked for Storage/Functions.

## References
- Project agent guide: [AGENTS.md](../../../AGENTS.md)
- Firebase setup checklist: [FIREBASE_SETUP.md](../../../FIREBASE_SETUP.md)
- Firestore rules: [firestore.rules](../../../firestore.rules)
- Firebase utilities: [src/firebase.ts](../../../src/firebase.ts)
- Role routing: [src/App.tsx](../../../src/App.tsx)
- Data contracts: [src/types.ts](../../../src/types.ts)