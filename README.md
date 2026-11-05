# TaskFlow

TaskFlow is a small, responsive personal task manager built with React, Vite, TypeScript, Tailwind CSS, locally-owned shadcn-style UI components, and Supabase. It demonstrates Supabase Auth, PostgreSQL Row Level Security (RLS), a Deno Edge Function that verifies caller identity, and Vitest tests—including live, two-user RLS tests.

## What it does

- Register and sign in with email/password; Supabase Auth persists and refreshes the session.
- Protect the dashboard and display the signed-in email.
- Create, edit, delete, complete, search, and filter tasks by status and priority.
- Store optional descriptions and due dates.
- Enforce per-user task access in PostgreSQL, not just in the UI.
- Return the caller's verified ID and email from `get-my-profile`.

## Technology choices

- **React + Vite + TypeScript** provide a fast typed SPA without a separate web server.
- **Tailwind CSS v4** handles responsive styling. UI elements in `src/components/ui` follow shadcn/ui's locally-owned component approach and use Radix primitives for accessible dialogs and selects; `components.json` contains the shadcn/ui configuration.
- **Supabase Auth and PostgreSQL** provide authentication and persistence. RLS is the security boundary for all task reads and writes.
- **Supabase Edge Functions (Deno)** run trusted token-verification logic without introducing another backend framework.
- **Vitest and React Testing Library** cover validation, service behavior, UI interactions, and Edge Function handler behavior. A separate suite exercises actual PostgreSQL RLS.

## Prerequisites

- Node.js 20.19+ or 22.12+ and npm.
- A Supabase project, or the Supabase CLI and Docker for local development.
- For the live RLS suite: an isolated Supabase project with the migration applied. Its service-role credential is used only by the Node test process to create/delete temporary test users.
- For the live Edge Function suite: the function deployed to the same project (or running locally with `supabase functions serve`).
- For Edge Function deployment: Supabase CLI.

## Install

From the project directory:

```sh
npm install
```

Copy `.env.example` to `.env.local` and set the two frontend values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

The browser bundle uses only the publishable/anon key. **Never add a service-role key to a `VITE_` variable or expose it to the frontend.** Restart Vite after editing environment variables.

## Supabase project setup

### Link an existing project and apply the migration

Install the Supabase CLI, authenticate, then from the project directory:

```sh
supabase init
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Run `supabase init` once per checkout; if a Supabase config already exists, keep it and do not initialize again.
The migration in `supabase/migrations/20261105000000_create_tasks.sql` creates the `public.tasks` table, constraints, indexes, update timestamp trigger, grants, and RLS policies.

For a disposable local Supabase stack instead:

```sh
supabase init
supabase start
supabase db reset
```

`supabase db reset` applies migrations in `supabase/migrations/` to the local database. Copy the local API URL and anon key printed by `supabase status` into `.env.local`.

### Troubleshooting: `PGRST205` / tasks table missing

The app's `VITE_SUPABASE_URL` determines which project it uses. If the dashboard reports `Could not find the table 'public.tasks' in the schema cache`, the migration has not been applied to that project (or the app is pointed at a different project). Apply it from the project directory:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Alternatively, open that exact project's **SQL Editor**, paste the contents of `supabase/migrations/20261105000000_create_tasks.sql`, and run it. Then reload the app; PostgREST normally refreshes its schema cache automatically. If the table was just created and the error persists, use **Project Settings → API → Reload schema cache** (or run `NOTIFY pgrst, 'reload schema';` in the SQL Editor). Ensure `VITE_SUPABASE_URL` points to the same project where the migration was run.

### RLS policy model

RLS is enabled on `public.tasks`. Each authenticated user's `auth.uid()` must match `tasks.user_id`:

- SELECT and DELETE use a row visibility/ownership `USING` predicate.
- INSERT uses a `WITH CHECK` ownership predicate.
- UPDATE uses **both** `USING` and `WITH CHECK`, preventing a user from changing a row's owner.
- The foreign key cascades task cleanup when an auth user is removed.

`createTask` also obtains the current authenticated user from Supabase Auth and assigns that user's ID. This is a convenience and data-integrity measure; the database policy remains authoritative if a client is modified or bypassed.

## Edge Function: `get-my-profile`

The function accepts POST, handles OPTIONS preflight, extracts a Bearer token, and verifies it by calling Supabase Auth's `getUser(token)`. Its response is based on the verified user, never a body-supplied ID. It uses the project URL and anon key, not the service-role key.

Deploy from the project directory:

```sh
supabase functions deploy get-my-profile
```

To try it locally:

```sh
supabase functions serve get-my-profile --no-verify-jwt
```

`--no-verify-jwt` disables only the local gateway check so requests reach the function's own verifier. The function itself still verifies each token. Obtain an access token by signing in through the app or Supabase Auth, then send:

```sh
curl -i -X POST http://127.0.0.1:54321/functions/v1/get-my-profile \
  -H "Authorization: Bearer YOUR_USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected success response:

```json
{"id":"the-authenticated-user-uuid","email":"user@example.com"}
```

A request without a token, with a malformed header, or with an invalid/expired token returns HTTP 401. The deployed Supabase gateway also verifies JWTs by default; `getUser(token)` inside the function independently verifies the token with Supabase Auth.

## Run the frontend

```sh
npm run dev
```

Open the local URL printed by Vite. If Supabase environment variables are missing, the login and registration pages show a setup message instead of silently attempting a demo or mock backend.

Production build and preview:

```sh
npm run build
npm run preview
```

## Automated tests

### Unit and handler tests

```sh
npm run test:typecheck
npm test
```

These tests run without Supabase credentials. They exercise task validation, task-service behavior (with a mocked Supabase client), and the Edge Function's exported HTTP handler with an injected verifier. The handler tests mock the verifier and **are not claimed as live Deno/Supabase JWT verification tests**; the production Deno entry point calls `supabase.auth.getUser(token)`. Test output is produced by Vitest when the command is run.

### Live PostgreSQL RLS integration tests

These tests use two real temporary Supabase Auth users and authenticated anon-key clients against PostgreSQL. They do not mock RLS. Use a disposable/isolated project, apply the migration first, and provide these **Node process only** variables (the configs may load them from the ignored `.env.local` file):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key is used only to create and delete the test users. The task operations in the test use the two users' authenticated clients. The integration-test configs load these three variables from `.env.local` automatically; values already set in the shell take precedence. Keep `.env.local` untracked and use an isolated test project. Alternatively, on Windows PowerShell set the variables for the current terminal and run:

```powershell
$env:SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_ANON_KEY = "YOUR_PUBLISHABLE_OR_ANON_KEY"
$env:SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY"
npm run test:rls
```

On macOS/Linux:

```sh
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
npm run test:rls
```

The RLS suite checks that User A can create/read their task; User B cannot read, update, or delete it; User B can create/read their own task; and User A cannot see User B's task. Missing test credentials fail with an actionable error rather than skipping the tests. The `afterAll` hook removes the generated users (and their cascaded tasks).

Run both test groups in sequence:

```sh
npm run test:all
```

`npm run test:edge` separately runs live HTTP tests against the deployed/local function. It creates a real temporary Supabase user and checks that a real access token returns that user's ID/email while missing and invalid tokens return 401:

```powershell
# Set the same three Node-only variables used by the RLS test.
$env:SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_ANON_KEY = "YOUR_PUBLISHABLE_OR_ANON_KEY"
$env:SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY"
npm run test:edge
```

For a local stack, start `supabase functions serve get-my-profile --no-verify-jwt` in a separate terminal before running the live test. The function itself still verifies the token with Supabase Auth. The live test does not mint a reliably expired JWT; the handler unit tests cover the verifier's expired-token rejection path, and invalid-token 401 is exercised against the live function.

`npm run test:all` requires the RLS and Edge Function test prerequisites above. To run just tests that don't need credentials, use `npm test`.

### Demonstrating User A / User B isolation manually

1. Apply the migration and start the app.
2. Register two distinct accounts and sign in as User A; add a task.
3. Sign out and sign in as User B. The dashboard should not show User A's task.
4. The integration suite additionally attempts cross-user reads, updates, and deletes through User B's authenticated client and verifies User A's record remains unchanged.

## Security considerations

- Task data is isolated by PostgreSQL RLS on every request.
- The browser uses only the Supabase publishable/anon key; never ship a service-role key.
- Edge Function identity comes from a token verified by Supabase Auth, not decoded claims or request input.
- Test admin credentials are read from server-side environment variables and must belong to an isolated test project.
- Authenticated routes improve UX, but do not replace RLS.

## Known limitations

- This is a personal, single-user task manager; it has no teams, sharing, notifications, or recurring tasks.
- Email confirmation behavior depends on the Supabase project's Auth settings.
- The Edge Function unit tests exercise its request handler with a mocked verifier. A deployed/local function request with a real access token is the runtime verification check.
- Live RLS tests require network access, a migrated Supabase project, and the three dedicated integration-test environment variables.
