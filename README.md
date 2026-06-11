# Movie Quiz — Backend

This is the API behind Movie Quiz: a little app where you browse movies, get
quizzed on the ones you know, and then argue with your friends about who actually
knows their cinema. The backend handles all the unglamorous-but-important stuff —
logins, quiz scoring, friendships, watchlists, leaderboards, the admin panel, and
talking to TMDB so the React app never has to.

It's built with **NestJS** and **MongoDB**. If you've worked with Nest before the
layout will feel familiar; if you haven't, the short version is: every feature
lives in its own folder with a controller (routes), a service (logic), and a
schema (the database shape).

---

## What's in here

```
src/
├── main.ts          → app startup: security headers, gzip, CORS, validation
├── app.module.ts    → wires everything together
├── common/filters/  → one place that catches errors so they come out clean
├── auth/            → login, JWT, password reset, the role guard
├── user/            → registration, profiles, user search
├── quiz/            → questions, answer-checking, scoring
├── leaderboard/     → global + per-movie rankings
├── friends/         → requests, accepting, unfriending
├── watchlist/       → each user's saved movies
├── admin/           → user management for admins
└── movies/          → a cached proxy in front of TMDB
```

Each request runs the same gauntlet on the way in: Helmet sets security headers,
responses get gzipped, CORS only lets the frontend through, and a global
validation pipe checks the request body against a DTO and throws away anything it
doesn't recognize. After that, the JWT is decoded and the user is attached to the
request before your route ever sees it.

---

## Running it locally

You'll need **Node 18+** (the movie proxy uses the built-in `fetch`), a MongoDB
database (local or Atlas), and a free **TMDB API key**.

```bash
npm install
cp .env.example .env     # then fill in the blanks
npm run start:dev
```

That boots the API on **http://localhost:3001** and reloads as you edit.

### The .env file

Nothing secret is committed to the repo — you supply it here. The file is
git-ignored, so don't worry about it sneaking into a commit.

| Variable       | Needed? | What it's for                                              |
| -------------- | ------- | ---------------------------------------------------------- |
| `MONGO_URI`    | yes     | Your MongoDB connection string                             |
| `JWT_SECRET`   | yes     | Signs login tokens — make it long and random (`openssl rand -hex 48`) |
| `TMDB_API_KEY` | yes     | Lets the server fetch movie data from TMDB                 |
| `PORT`         | no      | Defaults to `3001`                                         |
| `FRONTEND_URL` | no      | Your frontend's address — used for CORS and reset links (defaults to `http://localhost:3000`) |

---

## The scripts you'll actually use

| Command               | Does what                                  |
| --------------------- | ------------------------------------------ |
| `npm run start:dev`   | Dev mode with hot reload — your day-to-day |
| `npm run build`       | Compiles to `dist/`                        |
| `npm run start:prod`  | Runs the compiled build (`node dist/src/main`) |
| `npm run lint`        | ESLint, with autofix                       |
| `npm run test`        | Unit tests                                 |

---

## The API

Base URL is `http://localhost:3001`. A 🔒 means you need to be logged in (send
`Authorization: Bearer <token>`); 👑 means you need to be an admin.

**Auth** — `/auth`

| Method | Route                    | | What it does                          |
| ------ | ------------------------ |-| ------------------------------------- |
| POST   | `/auth/login`            | | Log in with a username or email       |
| POST   | `/auth/forgot-password`  | | Kick off a password reset             |
| POST   | `/auth/reset-password`   | | Finish a reset with the emailed token |

**Users** — `/users`

| Method | Route                  | | What it does                         |
| ------ | ---------------------- |-| ------------------------------------ |
| POST   | `/users/register`      | | Create an account                    |
| GET    | `/users/search?q=`     |🔒| Find users by the start of their name|
| GET    | `/users/profile`       |🔒| Your own profile                     |
| PATCH  | `/users/profile`       |🔒| Update your avatar                   |
| GET    | `/users/:id/profile`   |🔒| Someone else's public profile        |

**Quiz** — `/quiz`

| Method | Route                    | | What it does                                      |
| ------ | ------------------------ |-| ------------------------------------------------- |
| GET    | `/quiz/available-movies` | | Which movies have quizzes                         |
| GET    | `/quiz/all`              |👑| Every question (for the admin panel)              |
| GET    | `/quiz/:imdbID`          |🔒| A shuffled quiz — answers deliberately not included |
| POST   | `/quiz`                  |👑| Add a question                                    |
| POST   | `/quiz/check`            |🔒| Check one answer (for instant green/red feedback) |
| POST   | `/quiz/submit`           |🔒| Submit the quiz; the server does the scoring      |
| PUT    | `/quiz/:id`              |👑| Edit a question                                   |
| DELETE | `/quiz/:id`              |👑| Remove a question                                 |

**Leaderboard** — `/leaderboard`

| Method | Route                         | | What it does                          |
| ------ | ----------------------------- |-| ------------------------------------- |
| GET    | `/leaderboard/global`         | | Best players overall (paginated)      |
| GET    | `/leaderboard/movies`         | | Which movies show up on the board     |
| GET    | `/leaderboard/movie/:imdbID`  | | Rankings for one movie                |
| POST   | `/leaderboard`                |🔒| Record a score                        |

**Friends** — `/friends`

| Method | Route                            | | What it does            |
| ------ | -------------------------------- |-| ----------------------- |
| POST   | `/friends/request/:recipientId`  |🔒| Send a request          |
| POST   | `/friends/accept/:requesterId`   |🔒| Accept one              |
| GET    | `/friends`                       |🔒| Your friends            |
| GET    | `/friends/requests/incoming`     |🔒| Pending requests to you |
| DELETE | `/friends/requests/:id`          |🔒| Reject or cancel        |
| DELETE | `/friends/:friendId`             |🔒| Unfriend                |

**Watchlist** — `/watchlist`

| Method | Route                 | | What it does     |
| ------ | --------------------- |-| ---------------- |
| POST   | `/watchlist`          |🔒| Save a movie     |
| GET    | `/watchlist`          |🔒| Your saved list  |
| DELETE | `/watchlist/:imdbID`  |🔒| Remove one       |

**Admin** — `/admin`

| Method | Route                      | | What it does                                  |
| ------ | -------------------------- |-| --------------------------------------------- |
| GET    | `/admin/dashboard`         |👑| Paginated list of users + the total count     |
| PATCH  | `/admin/users/:id/role`    |👑| Promote/demote someone (you can't change your own role) |
| DELETE | `/admin/users/:id`         |👑| Delete a user (not yourself)                  |

**Movies** — `/movies` (the TMDB proxy)

| Method | Route                          | | What it does                              |
| ------ | ------------------------------ |-| ----------------------------------------- |
| GET    | `/movies/categories`           | | Homepage rows (top rated, popular, etc.)  |
| GET    | `/movies/search?q=`            | | Search movies                             |
| GET    | `/movies/category/:type?page=` | | One category, paginated                   |
| GET    | `/movies/details/:id`          | | Full details, cast, and trailers          |

The reason this proxy exists: the TMDB key stays on the server instead of being
baked into the browser, and since everyone sees the same "popular movies" list,
the server caches the responses (~10 min) rather than hammering TMDB on every
page load.

---

## The data

Five collections, nothing exotic:

- **User** — credentials, avatar, role (`user`/`admin`), quiz history, reset-token fields
- **Quiz** — a movie ID, the question, the choices, and which one's correct
- **Leaderboard** — who scored what on which movie, and how long it took
- **FriendRequest** — requester, recipient, and a status
- **Watchlist** — a user and a movie they saved

---

## A note on security

I spent a fair bit of time making sure this isn't trivially exploitable:

- Logins use JWTs that expire after an hour, and passwords are bcrypt-hashed.
- Every request body is validated and whitelisted, which closes off mass-assignment
  (you can't sneak a `role: admin` into a profile update) and NoSQL injection.
- Admin routes are gated behind a role guard, and admins can't delete or demote
  themselves into a corner.
- Login and the password-reset endpoints are rate-limited to slow down brute force.
- Quiz answers never leave the server — they're checked and scored server-side, so
  you can't read the answer key off the network tab.
- Password-reset tokens are stored hashed, "forgot password" doesn't reveal whether
  an email exists, and unexpected errors return a generic message instead of a stack
  trace.

---

## A note on performance

A few things keep it quick as data grows: indexes on the fields that actually get
queried (quiz lookups, leaderboard sorting, friend lookups, username search),
in-memory caching for the heavy leaderboard aggregations and TMDB calls, pagination
on the big lists, and gzip on responses.

---

## Deploying it

Anywhere that runs Node works (Render, Railway, Fly, etc.). The gist:

1. Set `MONGO_URI`, `JWT_SECRET`, `TMDB_API_KEY`, and `FRONTEND_URL` in the host's
   environment settings — not in a committed file.
2. `npm install && npm run build && npm run start:prod`
3. Point `FRONTEND_URL` at your deployed frontend so CORS lets it in.
4. If you're on Atlas, allow your host's IP under Network Access.
