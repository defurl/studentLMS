# Firebase Setup Details

## 1) Authentication Providers
Open Firebase Console for project `gen-lang-client-0397274710`:
- Go to Authentication -> Sign-in method.
- Enable Google provider.
- Enable Email/Password provider.

If Email/Password is not enabled, app sign in will fail with `auth/operation-not-allowed`.

If Google Sign-In shows `auth/unauthorized-domain`, add your app domain in Firebase Authentication settings.

## 2) Authorized Domains
In Authentication -> Settings -> Authorized domains, ensure these are present:
- `localhost`
- `127.0.0.1`
- Any local network host you use from Vite output (for example `192.168.1.3`)

Set `VITE_CLASSROOM_OWNER_EMAIL` in `.env` to your teacher account email.
Users signing up with that email become `teacher`; all others default to `student`.

## 3) Firestore Database
- Confirm Firestore database exists and is in Native mode.
- This app uses database id from `firebase-applet.json`:
  - `firestoreDatabaseId: ai-studio-042fcab0-7710-4f9e-83ce-266adcd31535`
- If you use a different database id, update `firebase-applet.json` accordingly.

## 4) Security Rules
Rules are defined in `firestore.rules` for:
- users: user can read/write own profile only
- assignments: authenticated users can read; only teacher owner can create/update/delete
- submissions: student owner or assignment teacher can read/update

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

If your Firebase CLI uses a named project:

```bash
firebase use gen-lang-client-0397274710
firebase deploy --only firestore:rules
```

## 5) Local App Run

```bash
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:3000` or next available port).

## 6) Quick Auth Test Matrix
1. Create account with email/password.
2. Sign out.
3. Sign in with the same email/password.
4. Click Forgot password and verify reset email arrives.
5. Verify teacher dashboard appears only for `VITE_CLASSROOM_OWNER_EMAIL`.

## 7) Common Errors
- `auth/operation-not-allowed`: Email/Password provider disabled.
- `auth/invalid-credential`: Wrong email/password.
- `permission-denied`: Firestore rules not deployed or rule condition fails.
- Login works but wrong dashboard: check `VITE_CLASSROOM_OWNER_EMAIL` and user profile role in Firestore.
