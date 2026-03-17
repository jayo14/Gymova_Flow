# GymovaFlow

A modern fitness platform for clients and trainers, built with Next.js, Supabase, and shadcn/ui. This app provides a seamless experience for booking trainers, managing sessions, and handling admin workflows.

---

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Main Components](#main-components)
- [Authentication](#authentication)
- [Supabase Integrations](#supabase-integrations)
- [API & Server Actions](#api--server-actions)
- [UI-Only Features](#ui-only-features)
- [Environment Variables](#environment-variables)
- [Setup & Development](#setup--development)
- [Missing Features](#missing-features)

---

## Features
- User authentication (Supabase)
- Trainer application & admin review
- Trainer availability management
- Browse trainers & profiles
- Booking flow (UI only)
- Messaging (UI only)
- AI Coach (mocked)
- Admin dashboard (users, trainers, applications)
- Responsive, modern UI (shadcn/ui)

---

## Project Structure
- `app/` — Next.js app directory (pages, layouts, server actions)
- `components/` — UI and global components (shadcn/ui, providers, auth)
- `hooks/` — Custom React hooks
- `lib/` — Supabase clients, utilities, authentication helpers
- `public/` — Static assets
- `styles/` — Global styles (Tailwind)
- `types/` — TypeScript types
- `supabase/` — Database migrations
- `docs/` — Schema and handoff docs

---

## Pages & Routes
- `/` — Landing page
- `/login` — User sign-in
- `/signup` — User registration & trainer application
- `/trainers` — Trainers list
- `/trainers/[id]` — Trainer profile
- `/booking/[id]` — Booking flow (UI only)
- `/map` — Trainer location map (UI only)
- `/ai-coach` — AI chat assistant (mocked)
- `/messages` — Messaging (UI only)
- `/dashboard` — Client dashboard
- `/dashboard/bookings` — Booking history (UI only)
- `/dashboard/profile` — Profile settings
- `/dashboard/trainer` — Trainer dashboard redirect
- `/trainer` — Trainer dashboard
- `/trainer/availability` — Availability editor
- `/trainer/sessions` — Session list (UI only)
- `/admin/login` — Admin sign-in
- `/admin` — Admin dashboard
- `/admin/applications` — Trainer applications review
- `/admin/users` — User management (UI only)
- `/admin/trainers` — Trainer management (UI only)
- `/supabase-test` — Dev connectivity test

---

## Main Components
- **Global:** AuthProvider, Providers, ThemeProvider
- **UI Library:** 55+ shadcn/ui components in `components/ui/`
- **Inline:** Navbar, HeroSection, FeaturesSection, TestimonialsSection, Footer, FilterSidebar, TrainerCard, TrainerProfileView, BookingPage, ConversationItem, MessageBubble, MapMarker, TrainerListCard, BookingCard, Sidebar/TopNav for dashboard/trainer/admin

---

## Authentication
- **User:** Supabase Auth (client-side protection)
- **Trainer status:** `lib/trainerAuth.ts` (uses `profiles` table)
- **Admin:** Cookie-based (see `app/admin/actions.ts`, protected by `middleware.ts`)

---

## Supabase Integrations
- **Connected:** Auth, profiles, trainer_applications, trainers list/profile, trainer_availability
- **Not yet used:** bookings, messages, reviews, gym_locations, trainer_locations, client_goals

---

## API & Server Actions
- No Next.js API routes (`route.ts`)
- Server actions: `app/admin/actions.ts` (admin login/logout), `middleware.ts` (admin cookie check)

---

## UI-Only Features
- Booking flow (no DB write)
- Dashboard home, bookings, sessions (mock data)
- Messages, map, AI Coach, admin users/trainers (UI only)
- Trainer profile reviews tab (no reviews table)

---

## Environment Variables
Create a `.env.local` file in the project root with the following:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ADMIN_EMAIL=your-admin-email (optional, for admin login)
ADMIN_PASSWORD=your-admin-password (optional, for admin login)
```

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `ADMIN_EMAIL` — (Optional) Admin login email (default: admin@gymovaflow.com)
- `ADMIN_PASSWORD` — (Optional) Admin login password (default: admin123)

---

## Setup & Development
1. Install dependencies:
   ```sh
   pnpm install
   ```
2. Create `.env.local` as above.
3. Run the development server:
   ```sh
   pnpm dev
   ```
4. Visit [http://localhost:3000](http://localhost:3000)

---

## Missing Features / TODO
- Booking, messages, reviews, locations, client goals — backend integration
- Real AI Coach API
- Dashboard stats from DB
- Admin users/trainers — real data
- Align `trainer_availability` schema (JSONB vs relational)

---

## License
MIT
