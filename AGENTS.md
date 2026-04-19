# AGENTS Guide for studentLMS

## Scope
Instructions for AI coding agents working in this repository. Keep changes small, focused, and aligned with existing patterns.

## Quick Start
1. Install dependencies: npm install
2. Run development server: npm run dev
3. Type-check code: npm run lint
4. Build production bundle: npm run build
5. Preview production build: npm run preview

## Key References
- Firebase setup checklist: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- App auth and role routing: [src/App.tsx](src/App.tsx)
- Firebase auth/db/error utilities: [src/firebase.ts](src/firebase.ts)
- Shared data contracts: [src/types.ts](src/types.ts)
- Teacher flows: [src/components/TeacherDashboard.tsx](src/components/TeacherDashboard.tsx)
- Student flows: [src/components/StudentDashboard.tsx](src/components/StudentDashboard.tsx)
- Shared UI primitives: [src/components/ui.tsx](src/components/ui.tsx)
- Firestore security rules: [firestore.rules](firestore.rules)

## Architecture Snapshot
- React + Vite + TypeScript single-page app.
- [src/main.tsx](src/main.tsx) mounts [src/App.tsx](src/App.tsx).
- [src/App.tsx](src/App.tsx) gates by Firebase auth and user role, then renders teacher or student dashboards.
- Firestore collections in active use: users, assignments, submissions.
- Assignment and submission document bodies are stored as HTML strings and rendered in the UI.

## Project Conventions
- Keep timestamp fields numeric using Date.now() to match existing sort logic.
- Prefer generating Firestore document IDs via doc(collection(...)) and writing via setDoc(...).
- Route Firestore failures through handleFirestoreError(error, operationType, path) for consistent diagnostics.
- Reuse primitives from [src/components/ui.tsx](src/components/ui.tsx) before adding new component patterns.
- Respect alias @ => repository root (see [vite.config.ts](vite.config.ts) and [tsconfig.json](tsconfig.json)).

## Pitfalls and Environment Notes
- Google sign-in and authorized domains must match [FIREBASE_SETUP.md](FIREBASE_SETUP.md).
- Firestore database ID comes from [firebase-applet.json](firebase-applet.json); mismatches break reads/writes.
- [package.json](package.json) uses rm -rf in the clean script, which is not Windows-native.
- HMR behavior is controlled by DISABLE_HMR in [vite.config.ts](vite.config.ts). Do not change unless explicitly requested.

## Agent Logging Workflow
After completing a user request:
1. Append one concise entry to [.github/logs.md](.github/logs.md) with date, task, changed files, and validation done.
2. If a reusable insight was discovered, append one short entry to [.github/lessons.md](.github/lessons.md).
3. Keep both files concise and avoid duplicating details already captured in source docs.