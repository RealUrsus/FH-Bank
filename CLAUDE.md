# CLAUDE.md

First Home Bank: an Express 5 + EJS + SQLite app where parents (Admin) run a pretend-but-real-money bank for their teens (Client). Chequing accounts, loans, GICs, agreements, reports. No test suite (`npm test` is a stub).

## Commands

- `npm install`
- `cp .env.example .env` (PORT, SESSION_SECRET, DATABASE_PATH, SESSION_DB_PATH, LOG_LEVEL, LOG_DIR)
- `npm start` / `npm run dev` (nodemon), serves on http://localhost:8000
- Default seeded login: `admin` / `admin` (created by `utils/db.js`; change it)
- Daily jobs can be run manually: `node -e "require('./jobs/dailyTasks').runDailyTasks()"` (note: requiring the module also registers the cron)

## Layout

- `app.js`: middleware stack (helmet w/o CSP+HSTS, sessions in SQLite, passport, csrf-sync, flash `res.locals.message`), mounts `/` (auth), `/client`, `/admin`, plain-text 404 and error handler. Requires `jobs/dailyTasks` at startup.
- `routes/` (`auth.js`, `client.js`, `admin.js`): thin handlers wrapped in `asyncHandler`; call services, render EJS.
- `services/*.service.js`: all business logic and SQL. Object-literal services (`loanService`, `gicService`, ...). Use `database.service.js` (`queryOne`, `queryMany`, `run`, `transaction`) and not raw `db`.
- `services/constants.js`: IDs and names for account types, roles, statuses, transaction types, payment frequencies, categories, password and financial config. Use these constants, never magic numbers or status strings.
- `utils/db.js`: opens SQLite, creates tables, runs inline migrations (`ALTER TABLE ... ADD COLUMN`, errors ignored if "duplicate column"), seeds lookup tables and admin. Schema changes go here as idempotent migrations.
- `utils/crypto.js`: PBKDF2 hashing (310k iterations, sha256). `utils/validators.js`, `middleware/validators.js`: input validation/sanitizing.
- `helpers/configService.js`: loads lookup tables (whitelisted names only) into `{UPPERCASE_NAME: id}` maps.
- `middleware/`: `ensureAuth`, `checkRole`, `loadConfig`, `getAccountID`, `passwordValidation`, `asyncHandler`.
- `jobs/dailyTasks.js`: node-cron at midnight: disburse loans, process loan interest, check payoffs, loan maturity, GIC maturity. Each item is try/caught individually.
- `views/`: EJS, `admin-*`, `client-*` prefixes, shared `partials/`. `public/`: static assets (bootstrap, feather).

## Domain notes

- Roles: Admin=1, Auditor=2, Client=3. Account types: Chequing=1, Loan=2, Saving=3, Investment=4 (a GIC is an Investment account with `ProductID` -> `GICProducts`). Loans are also rows in `Accounts`.
- Status: Pending=1, Approved=2, Rejected=3, Active=4, Closed=5, Paid Off=6.
- Payment frequency uses `PaymentFrequencyID` (0 bi-weekly, 1 monthly, 2 annually, 3 at maturity). The old `PaymentFrequency` TEXT column is legacy; don't use it for new code.
- Loans: simple interest. GICs: compound, monthly. Money is `REAL`, so compare with `FINANCIAL_CONFIG.ROUNDING_TOLERANCE`.
- Transfers create linked transactions grouped by `TransferID`.
- Parse date-only strings as local time (a past bug caused timezone-shifted interest processing).

## Conventions and gotchas

- CommonJS, 2-space indent in newer files, JSDoc on service methods, `async/await`, parameterized SQL only (table names via whitelist).
- `checkRole("ADMIN")` reads `req.roles`, set by `loadConfig`. `routes/auth.js` applies `loadConfig` for everything because it's mounted at `/`, so admin routes rely on that. Keep that mount order.
- All POST forms need the `_csrf` hidden field (`csrfToken` is in `res.locals`).
- `req.user` carries `id`, `role`, `account` (chequing AccountID).
- Rate limiters on login and signup (`routes/auth.js`).
- Dependencies are all `"latest"` in package.json; expect drift, and prefer Express 5 idioms.
- `var/` (DBs and logs) and `.env` are git-ignored. Sessions store: `SESSION_DB_PATH` relative to `./`.
- Don't log or commit real PII or financial data; this app handles real family finances.
