# 🔧 ToolShare India

**Padosi se maango, padosi ko do.** A neighbourhood tool-lending platform built with the MERN stack.
People in a society or colony list tools they own (drills, ladders, mixers, idli steamers…) and neighbours
borrow them for specific dates, free or for a small fee.

Built by [Prabhat Yadav](https://github.com/Prabhatyadav92), B.Tech CSE (2027), IEC College of Engineering and Technology, Greater Noida.

## Features

- Sign up and log in with JWT auth (bcrypt-hashed passwords)
- List, edit, pause and delete your own tools, with ₹ fee per day and refundable ₹ deposit
- Browse and search by keyword, category, city and availability; free-only filter; saved tools
- Neighbourhood map view grouped by locality (Greater Noida, Noida, Ghaziabad, Delhi…)
- Borrow for a date range, with double-booking protection
- Instant-book tools are auto-approved, others wait for the owner to approve or decline
- Owner dashboard (requests, mark returned) and borrower dashboard (track, cancel, review)
- 1-5★ reviews after return, rolled up into each tool's rating and lender badges
- Live home-page stats read from the database

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS 4, lucide-react |
| Backend | Node.js, Express 4, JWT, bcryptjs |
| Database | MongoDB (Atlas) with Mongoose |

## Run locally

Requires Node.js 18+ and a MongoDB connection string (free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
git clone https://github.com/<your-username>/toolshare-india.git
cd toolshare-india
npm run install-all



npm run seed        # one-time demo data (10 tools, 6 neighbours)
npm run dev         # API on :5001, app on http://localhost:5173
```

Demo login after seeding: `prabhat@example.com` / `password123`.

> `npm run seed` **wipes** users, tools and bookings. It refuses to run on a database that already has data
> unless you add `--force`: `npm run seed -- --force`.
>
> If `MONGO_URI` is not set and no local MongoDB is running, development mode falls back to a temporary in-memory
> database with demo data. Production never does this.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | yes (production) | MongoDB connection string |
| `JWT_SECRET` | yes (production) | Secret for signing login tokens |
| `PORT` | no | API port, default `5001` |
| `NODE_ENV` | no | Set to `production` when deployed |

Secrets live in `server/.env`, which is git-ignored. Never commit it.

## Deploy (Render, free tier)

1. Push this repo to GitHub.
2. In MongoDB Atlas, open **Network Access** and allow `0.0.0.0/0` so the host can connect.
3. On [Render](https://render.com): **New > Blueprint**, pick the repo. `render.yaml` sets everything up.
4. When asked, paste your `MONGO_URI`. `JWT_SECRET` is generated for you.
5. After the first deploy, seed demo data once from your own computer: `npm run seed` (with your `server/.env` pointing at the same Atlas database).

The Express server serves the built React app, so it is a single service. Production build locally:

```bash
npm run build && NODE_ENV=production npm start     # http://localhost:5001
```

## API overview

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | /api/health | no | Health check |
| GET | /api/stats | no | Live counts for the home page |
| POST | /api/auth/register | no | Create account |
| POST | /api/auth/login | no | Login, returns JWT |
| GET | /api/auth/me | yes | Current user |
| GET | /api/tools | no | Search (`q`, `category`, `city`, `locality`, `available`, `free`, `lat`, `lng`, `maxKm`) |
| GET | /api/tools/:id | no | Tool detail |
| GET | /api/tools/:id/availability | no | Approved booked date ranges |
| GET | /api/tools/:id/reviews | no | Reviews |
| GET | /api/tools/mine/list | yes | My tools |
| POST / PUT / DELETE | /api/tools, /api/tools/:id | yes | Create, update, delete (owner only) |
| POST | /api/bookings | yes | Request or instantly book a tool |
| GET | /api/bookings/mine | yes | My borrowings |
| GET | /api/bookings/incoming | yes | Requests for my tools |
| PATCH | /api/bookings/:id/status | yes | approve / decline / returned (owner), cancel (borrower) |
| POST | /api/bookings/:id/review | yes | Review after return |

## Project structure

```
├── server/   Express API, Mongoose models, JWT middleware, seed script
├── client/   React + Vite + Tailwind app
├── render.yaml                 One-click Render deploy
└── .github/workflows/ci.yml    Build check on every push
```

## License

MIT, see [LICENSE](LICENSE).
