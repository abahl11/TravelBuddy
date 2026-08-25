# Travel Buddy

Find fellow students heading the same way. Post a journey, accept companions,
split the costs, and review each other afterwards.

React (Create React App) + Express + MongoDB, deployed as **one service on one
URL**: Express serves the compiled React app and the `/api` routes together.

```
mongo_back/
├── client/          React app (Tailwind)
├── server/          Express API + static hosting of client/build
├── render.yaml      Render blueprint
└── package.json     workspace scripts
```

## Running locally

**Requirements:** Node 20+, and a MongoDB you can reach (local `mongod`, or a
free MongoDB Atlas cluster).

```bash
# 1. install everything
npm run install:all

# 2. configure the API
cp server/.env.example server/.env
#    then edit server/.env and set MONGO_URI and JWT_SECRET
#    generate a secret with:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. optional: maps. Both free tiers, neither needs a credit card.
#    Add to server/.env:
#      GEOAPIFY_API_KEY   city autocomplete   https://myprojects.geoapify.com
#      MAPTILER_API_KEY   map tiles           https://cloud.maptiler.com

# 4. optional: fill the university list, and some demo journeys
npm run seed
npm run seed -- --demo      # also creates 3 demo accounts (password: demo1234)

# 5. start both, with live reload
npm run dev
```

- Client: <http://localhost:3000> (proxies `/api` to the server)
- API: <http://localhost:5000>, health check at `/api/health`

To run only one side: `npm run dev:server` or `npm run dev:client`.

### Production build locally

```bash
npm run build     # installs deps and compiles client/build
npm start         # Express serves the API *and* the built client on :5000
```

## Deploying to Render

The app is a single Render **Web Service** — no separate static site, no Docker.

### 1. Create a database

Render does not host MongoDB, so use [MongoDB Atlas](https://www.mongodb.com/atlas)
(the free M0 tier is enough):

1. Create a cluster and a database user.
2. Under **Network Access**, allow `0.0.0.0/0` — Render's outbound IPs are not
   fixed on the free plan.
3. Copy the connection string. Add the database name before the `?`, e.g.
   `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/travelbuddy?retryWrites=true&w=majority`

### 2. Create the service

Push this repo to GitHub, then in Render either:

- **Blueprint:** New → Blueprint, point it at the repo. `render.yaml` sets
  everything up, or
- **Manual:** New → Web Service with:

  | Setting | Value |
  | --- | --- |
  | Runtime | Node |
  | Build command | `npm run build` |
  | Start command | `npm start` |
  | Health check path | `/api/health` |

### 3. Set the environment variables

In the service's **Environment** tab:

| Key | Required | Notes |
| --- | --- | --- |
| `MONGO_URI` | yes | The Atlas connection string from step 1. |
| `JWT_SECRET` | yes | 32+ random characters. The blueprint generates one. |
| `NODE_ENV` | yes | `production` |
| `CI` | yes | `false` — Create React App treats warnings as errors otherwise. |
| `GEOAPIFY_API_KEY` | no | City autocomplete. Free 3,000/day, no card. Stays server-side. |
| `MAPTILER_API_KEY` | no | Map tiles. Free 100k loads/month, no card. Sent to the browser — restrict it by origin. |
| `EMAIL_USER` / `EMAIL_PASSWORD` | no | Enables join-request notification emails. |
| `CLIENT_URL` | no | Leave blank. Only needed if a separate front end calls this API. |

Map keys are read at runtime and served to the client from `/api/config`, so
rotating one needs only a restart, not a rebuild.

The service boots, connects to Mongo, builds its indexes, and serves the whole
app from the Render URL. `/api/*` is the API; everything else returns the React
app, so deep links and refreshes work.

> **Free plan note:** the service sleeps after inactivity, so the first request
> after a while takes ~30 seconds to wake up.

## API

All routes are prefixed with `/api`. Protected routes need
`Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | public | Service and database status |
| `POST` | `/users` | public | Register |
| `POST` | `/users/login` | public | Log in |
| `GET`/`PUT` | `/users/profile` | private | Read / update own profile |
| `GET` | `/users/:id` | public | Public profile with reviews |
| `GET` | `/journeys` | public | Search — `destination`, `lat`+`lng`+`radius`, `departureDate`, `university`, `transportMode`, `creator`, `companion`, `status`, `includePast`, `limit` |
| `POST` | `/journeys` | private | Create a journey |
| `GET` | `/journeys/nearby` | public | Starting or ending near `lat`/`lng` |
| `GET` | `/journeys/along-route` | public | Route passes near `lat`/`lng` |
| `POST` | `/journeys/intersect-area` | public | Route crosses a GeoJSON polygon |
| `GET` | `/journeys/university` | private | Journeys from your own university |
| `GET`/`PUT`/`DELETE` | `/journeys/:id` | mixed | Read / update / delete (creator only for writes) |
| `POST` | `/journeys/:id/join` | private | Ask to join |
| `PUT` | `/journeys/:id/companions/:userId` | private | Accept or reject a request |
| `PUT` | `/journeys/:id/complete` | private | Mark completed |
| `PUT` | `/journeys/:id/cancel` | private | Cancel |
| `GET`/`POST` | `/messages` | private | Conversation list / send |
| `GET` | `/messages/unread-count` | private | Unread badge count |
| `GET` | `/messages/:userId` | private | One conversation (marks it read) |
| `POST` | `/expenses` | private | Add an expense (participants only) |
| `GET` | `/expenses/journey/:id` | private | A journey's expenses |
| `GET` | `/expenses/journey/:id/summary` | private | Balances and settlement plan |
| `PUT` | `/expenses/:id/settle` | private | Mark your share paid |
| `POST` | `/reviews` | private | Review a companion after completion |
| `GET` | `/reviews/user/:userId` | public | Reviews about a person |
| `GET` | `/universities` | public | University list |
| `GET` | `/geocode/autocomplete` | public | City suggestions (proxies Geoapify, key stays server-side) |
| `GET` | `/config` | public | Runtime map configuration for the client |

## Notes on how it works

- **Coordinates are optional.** A journey posted without map data is still
  created and searchable by text; it just does not take part in proximity
  searches. This is what keeps the app fully usable with no map keys at all.
- **Maps are OpenStreetMap-backed**, via MapTiler for tiles and Geoapify for
  city search. Neither free tier requires a credit card, so there is no route
  to a surprise bill. The Geoapify key never reaches the browser: autocomplete
  is proxied through `/api/geocode`, with a short in-memory cache so repeated
  keystroke prefixes do not each cost quota.
- **Proximity search** uses `$geoWithin` / `$centerSphere` rather than `$near`,
  because `$near` cannot be combined with a sort or nested inside `$or`.
- **No transactions.** Every write is a single document, which MongoDB is
  already atomic over, so the app runs against a standalone `mongod` as well as
  a replica set.
- **Ratings** on a user are recalculated from the reviews after every review
  write, so `averageRating` never drifts.
- **Deleting a journey** also deletes its expenses and reviews, and detaches its
  messages.
