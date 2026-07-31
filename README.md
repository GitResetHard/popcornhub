# Moviestrackr

A movie and TV series tracker built with **Next.js 16** (App Router), **React 19**, and
**MySQL**. Track a watchlist across five statuses, favorite titles, follow friends, write
reviews, build custom lists, and earn XP, achievements, and streaks for what you watch.

> This repository is a standalone application. It was built from an analysis of a reference
> project to mirror its domain and feature set, but it is its own codebase with its own
> database, its own authentication, and no shared infrastructure.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, React Server Components) |
| UI | React 19, TypeScript, Tailwind CSS 4, Radix primitives |
| Data | MySQL 8 via Drizzle ORM |
| Auth | Database-backed sessions, scrypt passwords, TOTP two-factor, Google OAuth |
| Cache | Redis with an in-process fallback |
| Media data | TMDB API v3 |

## Features in this codebase

- Browse movies and TV by category, plus genre / year / rating / sort filters
- Movie and TV detail pages with cast, recommendations, and Open Graph + JSON-LD metadata
- Full-text search across movies, TV, and people, with header autocomplete
- Watchlist with five statuses, status filters, notes, and per-item progress
- Favorites, plus watchlist-status badges shown on every media card
- Email + password registration, Google sign-in, and TOTP two-factor authentication
- XP, levels, achievements, and a daily engagement streak

## Getting started

Requirements: Node 20+, MySQL 8 (or MariaDB 10.6+), and optionally Redis.

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `AUTH_SECRET` — generate with `openssl rand -base64 48`
- `DATABASE_URL` — the application database
- `TMDB_API_TOKEN` — a TMDB v4 read access token; pages that need TMDB data fail without it
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional, to enable Google sign-in

Then create the schema and seed it:

```bash
mysql -e "CREATE DATABASE moviestrackr_next"
npm run db:migrate
npm run db:seed
```

`npm run db:seed` loads the level thresholds and achievements and creates an admin account
(`ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables override its credentials).

## Running

```bash
npm run dev     # development server on :3000
npm run build   # production build
npm start       # serve the production build
```

## Checks

```bash
npm test        # vitest (integration tests run against a real MySQL database)
npm run types   # tsc --noEmit
npm run lint    # eslint
```

The test suite truncates tables, so `DATABASE_URL` must point at a database whose name ends
in `test`; it refuses to run otherwise. Create and load it the same way as the development
database:

```bash
mysql -e "CREATE DATABASE moviestrackr_next_test"
mysql moviestrackr_next_test < drizzle/0000_initial.sql
```

## Layout

```
src/
  app/            pages, route handlers, layouts, and the root stylesheet
  components/     UI primitives and feature components (media, layout, auth, browse)
  db/             Drizzle schema, connection pool, and the seed script
  lib/            enums, cache, TMDB client and services, security, SEO, validation
  server/         auth (sessions, credentials, 2FA, OAuth) and domain services
tests/            integration and DOM tests
```
