# Digital Evidence Vault

A full-stack MERN application for managing digital evidence with role-based
access control, chain-of-custody logging, integrity verification, case
management, dashboards, notifications, and PDF reporting.

## Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Zod, Multer, PDFKit
- **Frontend:** React (Vite), React Router, plain CSS

## Project Structure

```
evidence-vault/
  backend/
    src/
      config/       mongo connection
      middleware/   auth, roles, validation, upload, errors
      models/       User, Case, Evidence, AuditLog, Notification, RefreshToken
      controllers/  business logic
      routes/       REST endpoints
      validators/   zod schemas
      utils/        hashing, audit logging, notifications
    server.js
    seed.js
  frontend/
    src/
      pages/        one file per screen
      components/   Layout, ProtectedRoute, Modal, Badge, Feedback
      context/      AuthContext (access/refresh token handling)
      services/     axios instance with auto-refresh interceptor
```

## 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

- `MONGO_URI` — point this at your MongoDB instance, e.g.
  `mongodb://127.0.0.1:27017/evidence_vault` for a local install, or an
  Atlas connection string.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — set these to long random
  strings (e.g. `openssl rand -hex 32`).
- Adjust `PORT`, `FRONTEND_URL`, `MAX_UPLOAD_MB` if needed.

```bash
cd ../frontend
cp .env.example .env
```

`VITE_API_URL` should point at the backend's `/api` path
(`http://localhost:5000/api` by default).

## 3. Seed the database

With MongoDB running and `backend/.env` configured:

```bash
cd backend
npm run seed
```

This wipes and repopulates the database with the users, cases, and
evidence records described below.

## 4. Start the backend

```bash
cd backend
npm run dev      # nodemon, auto-restarts
# or
npm start
```

The API listens on `http://localhost:5000` (or your configured `PORT`).
Visit `http://localhost:5000/api/health` to confirm it's running.

## 5. Start the frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173`.

## Development credentials

All seeded accounts use the password `Password123!`.

| Role         | Email                        |
|--------------|-------------------------------|
| Admin        | admin@vault.test             |
| Supervisor   | supervisor@vault.test        |
| Investigator | investigator1@vault.test     |
| Investigator | investigator2@vault.test     |

These are placeholder accounts for local development only — do not reuse
these credentials or seed data in any production deployment.

## Notes on what's implemented

- Every list/dashboard view is powered by live Mongoose queries — nothing
  is hardcoded or mocked.
- File uploads are stored under `backend/uploads/` with randomized
  (UUID-based) filenames; the original filename and MIME type are kept
  only as metadata in MongoDB.
- SHA-256 is calculated at upload time and re-verified both on explicit
  "Verify Integrity" requests and on every download attempt — a hash
  mismatch blocks the download and logs an `INTEGRITY_FAILURE` audit
  and security event.
- Audit log documents are immutable at the schema level (update/delete
  operations are rejected) and are written for every meaningful action:
  logins/logouts, case and evidence lifecycle events, approvals/rejections,
  integrity checks, user management actions, and report generation.
- Role permissions are enforced in Express middleware/controllers, not
  just hidden in the UI — e.g. an investigator's JWT cannot approve
  evidence even if they call the API directly.
- Refresh tokens are stored server-side (hashed) so they can be revoked on
  logout and are rotated on every refresh.

### Security Center / cybersecurity monitoring

A `SecurityEvent` model records security-relevant activity separately
from the general-purpose `AuditLog` (chain-of-custody, case/user history):
authentication events, authorization failures, evidence integrity
results, and report generation. Both are written from the same request,
so nothing is duplicated as business logic — `AuditLog` stays the record
of "what happened to this resource," `SecurityEvent` is "was this activity
a security concern, and how risky was it."

- **Failed login monitoring** — every failed login is recorded with the
  attempted email, IP, and user agent (never the password). If the same
  IP accumulates `FAILED_LOGIN_THRESHOLD` failures within
  `FAILED_LOGIN_WINDOW_MINUTES`, a `REPEATED_FAILED_LOGIN` event is
  raised at `HIGH` risk (once per window, not once per failed attempt).
- **Unauthorized access detection** — when an investigator requests a
  case or evidence item they aren't assigned to/didn't upload, the
  request is denied with 403 and an `UNAUTHORIZED_ACCESS` event is
  logged with the user, resource, IP, and user agent.
- **Forbidden actions** — `requireRole` logs a `FORBIDDEN_ACTION` event
  (`HIGH` risk) any time a role-restricted endpoint is hit by a role
  that isn't permitted, in addition to returning 403.
- **Risk levels** — `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`, assigned by
  action type (see `backend/src/utils/security.js`); integrity failures
  are always `CRITICAL`, ordinary logins/uploads/downloads are `LOW`.
- **Security Center** (frontend, ADMIN/SUPERVISOR only) — stats cards,
  a security alerts feed (HIGH/CRITICAL events), an events-over-time and
  risk-breakdown view, a searchable/filterable/paginated event table
  with a detail page, and Excel export buttons.
- **Excel exports** (ExcelJS, ADMIN/SUPERVISOR only) — a multi-sheet
  security report (Summary, Security Events, Login Activity, Audit Logs,
  Evidence Activity, Integrity Checks, Access Violations, User Activity),
  a standalone audit log export, and a standalone evidence activity
  export. None of these ever include passwords, JWTs, refresh tokens, or
  other secrets — only the metadata described in the spec.
- Every report/export generation itself creates a `REPORT_GENERATED`
  audit entry and security event, so report generation is part of the
  audit trail too.
- `app.set('trust proxy', ...)` is configured so `req.ip` reflects the
  real client address behind a reverse proxy in production; set
  `TRUST_PROXY=0` if you're running the backend directly exposed with no
  proxy in front of it.

## Known limitations / what to check before production use

- This was built and verified in a sandboxed environment without a live
  MongoDB instance available, so while the code has been syntax-checked,
  dependency-installed, and load-tested (the Express app boots and wires
  all routes/controllers without error, and the frontend builds cleanly
  with Vite), it has **not** been exercised against a real running
  database and browser in that environment. Run through the flows below
  yourself once MongoDB is available.
- `.env.example` secrets are placeholders — replace `JWT_ACCESS_SECRET`
  and `JWT_REFRESH_SECRET` before any real deployment.
- Rate limiting, CORS, and Helmet defaults are reasonable starting points
  but should be reviewed against your actual deployment topology
  (reverse proxy, HTTPS termination, etc.).

## Suggested manual test pass

1. `npm run seed`, then start backend and frontend.
2. Log in as `admin@vault.test` — confirm dashboard shows seeded totals.
3. Log in as `supervisor@vault.test` — create a new case, assign
   `investigator1@vault.test`.
4. Log in as `investigator1@vault.test` — confirm the new case is visible,
   upload a file to it, confirm it appears with `PENDING` status and a
   SHA-256 hash.
5. Log back in as supervisor — approve or reject the new evidence item;
   confirm a notification appears for the investigator.
6. As any role with access, open the evidence item and click
   "Verify Integrity" — should report a match. Download it — should
   succeed and log an `EVIDENCE_DOWNLOADED` audit entry.
7. As admin, open Audit Logs and Users — confirm the actions above are
   listed, and exercise deactivate/reset-password/soft-delete/restore.
8. As supervisor or admin, generate each of the four PDF reports from the
   Reports page.
9. Log in as `investigator1@vault.test` and try to open the case created
   for a different investigator (edit the URL directly, or use the API
   with that investigator's token) — should get a 403 and the attempt
   should show up in Security Center as an `UNAUTHORIZED_ACCESS` event.
10. As `investigator1@vault.test`, try calling
    `POST /api/evidence/:id/approve` directly (e.g. with curl/Postman) —
    should get a 403 and a `FORBIDDEN_ACTION` security event.
11. Log out, then attempt to log in with a wrong password 5+ times within
    10 minutes from the same machine — check Security Center for a
    `REPEATED_FAILED_LOGIN` alert at HIGH risk.
12. As admin or supervisor, open Security Center, confirm the stats,
    alerts, and recent-events table reflect what you just did, then use
    the three export buttons and open the resulting `.xlsx` files to
    confirm they contain real data and no passwords/tokens.
13. As `investigator1@vault.test`, try calling `GET /api/security/stats`
    directly — should get a 403.
#   t e s t - v a u l t  
 