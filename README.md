# Skypost

A Twitter-style social app built to demonstrate real system design concepts,
with a complete working feature set on top.

## This build fixes 4 issues
1. **Home feed empty on first login** -- removed the full-page reload after
   login (it created a code path that behaved differently from normal
   navigation); login now uses a lightweight event to reconnect the socket
   instead. Also: backend now waits for Redis to be ready before accepting
   requests, removing a cold-start race.
2. **Photo upload "preset not found"** -- error messages now show the exact
   cloud name/preset being used, so a mismatch is immediately visible.
   Configured with a manually-named preset (`skypost`) to avoid
   auto-generated-name confusion.
3. **Avatar picker expanded** from 10 to 120 options across 6 styles, in a
   scrollable grid in Edit Profile.
4. **Notification bell** -- confirmed working as designed (needs someone
   else to interact with your content); seed data now includes sample
   likes/follows/replies for the first 15 accounts so the bell has content
   immediately without needing a second account.

## One-time setup: Cloudinary preset
In your Cloudinary dashboard: Settings -> Upload -> Upload presets ->
Add upload preset -> name it exactly `skypost` -> Signing Mode: Unsigned -> Save.
(Cloud name `ulstkpyi` and preset `skypost` are already set in
`frontend/src/cloudinary.js`.)

## Running it
```
cp backend/.env.example backend/.env
docker-compose down -v
docker-compose up --build -d
docker-compose ps
docker-compose exec backend npm run seed
```
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Login: person0@example.com ... person149@example.com, password `password123`
- Tip: person0-person14 have pre-seeded notifications waiting in the bell.

## Notable engineering decisions
- Hybrid fan-out timeline (push for regular users, pull for celebrities)
- ACID transactions for follow/like counters
- Redis caching with LPUSH/LTRIM, readiness-gated server startup
- Socket.IO shares the same HTTP server/port as the REST API
- Soft deletes, block (mutual + prevents following) vs mute (silent, one-way)
- sessionStorage auth (closing the tab logs you out) with event-based
  reconnection instead of full page reloads
