# Sufra backend

Express and MongoDB backend implementing the contract in `sufra-fe/API.md`.

## Setup

1. Use Node.js 20 or later and run `npm install`.
2. Copy `.env.example` to `.env`, set `MONGO_URI` and a private, random `JWT_SECRET`.
3. Configure `INITIAL_USERS` as a JSON array of household accounts, for example:

   ```json
   [
     { "username": "nabi", "password": "use-a-long-password", "name": "نبيه", "isAdmin": true, "isSuperAdmin": true },
     { "username": "sara", "password": "use-another-long-password", "name": "سارة", "isAdmin": true, "isSuperAdmin": false }
   ]
   ```

   The environment variable must contain the JSON on one line. Accounts are inserted only when their username is not already in MongoDB; existing accounts must have `isSuperAdmin` set explicitly in MongoDB to grant super-admin access. Change passwords through a secure account-management process rather than relying on startup seeding.
4. Set the frontend's `VITE_API_URL` to this server's base URL, then run `npm start`.

For local development, `npm run dev` restarts the server when files change. `GET /health` is public; application endpoints require a bearer token except `POST /auth/login`. Configure `CORS_ORIGINS` as a comma-separated allowlist.

## Permissions and data behavior

- Users can read the household's dishes and users, and create, update, or delete only their own dishes. Dish deletion is soft so historical plans retain valid references.
- Admins can replace a dish only on an open day they proposed. Only super admins can regenerate plans or close non-future days as cooked or free.
- Categories are validated as unique, non-empty arrays. Replacements must contain the day's planning category.
- Saturday is the first day of a week. `HOUSEHOLD_TIMEZONE` controls the cutoff for rejecting future outcomes.
- Outcomes and cooked-count increments run in one MongoDB transaction. Configure MongoDB as a replica set (including local development) because standalone MongoDB servers do not support transactions.
- Closed days retain the dish name and full category snapshot independently of later dish edits, deletion, or plan regeneration.
