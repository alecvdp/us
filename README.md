# Us Dashboard

A shared household dashboard built for two people on one clean page.  
It combines collaborative tasks, recurring routines, notes, links, weather, and a combined agenda (events + due tasks).

## Overview

The app is designed to answer one question quickly on desktop or mobile:  
**“What do we need to do next?”**

Current capabilities:

- Shared task board with three assignee columns (`Shared`, `Alec`, `Wife`)
- Workflow groupings per person (`Today`, `This Week`, `Groceries`, `Recurring`, `Later`)
- Priority + due date + recurrence on tasks
- Recurring cadence support (`Daily`, `Weekly`, `Monthly`)
- Inline task editing + quick-move controls + drag/drop between sections
- Combined calendar agenda (events + task due dates)
- Scratchpad / whiteboard-style note
- Shared links/pastebin widget
- Dual-location weather widget

## Tech Stack

- **Next.js 16** (App Router, Server Actions)
- **React 19**
- **TypeScript**
- **Prisma 5**
- **SQLite** (local file DB)

## Project Structure

```text
prisma/
  schema.prisma
  migrations/
src/
  app/
    actions/        # server actions (tasks, events, notes, links)
    page.tsx        # dashboard page composition
  components/
    TasksWidget.tsx
    EventsWidget.tsx
    WhiteboardWidget.tsx
    PastebinWidget.tsx
    WeatherWidget.tsx
  lib/
    prisma.ts
    tasks.ts        # task metadata + normalization helpers
```

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env` at project root:

```bash
DATABASE_URL="file:./prisma/dev.db"
```

### 3) Run database migrations

```bash
npx prisma migrate dev
```

### 4) Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` — local development server
- `npm run lint` — ESLint checks
- `npm run build` — production build + type check
- `npm run start` — run built app

## Task Model (current)

Each task supports:

- `title`
- `assignee`: `SHARED | ALEC | PAU`
- `priority`: `LOW | MEDIUM | HIGH`
- `bucket`: `TODAY | THIS_WEEK | RECURRING | LATER`
- `recurrence`: `NONE | DAILY | WEEKLY | MONTHLY`
- `dueDate` (optional)
- `isGrocery` (separate workflow section)
- `completed`, `lastCompletedAt`, `nextResetAt`

## Recurring Behavior

- When a recurring task is completed, the app computes its next cycle and stores `nextResetAt`.
- Completed recurring tasks show reset indicators (for example, “Resets tomorrow”).
- When the reset time arrives, the task is reopened automatically on fetch.

## Tips

- Use **Shared** for household-level work and personal columns for ownership.
- Use **Groceries** for short-lived shopping tasks regardless of recurrence.
- Use **Recurring + due date** for routines where cadence and timing both matter.
- Use quick arrows for fast bucket changes and drag/drop for larger reorganizing.

## Validation Checklist

Before committing:

```bash
npm run lint
npm run build
```

## Troubleshooting

### `Environment variable not found: DATABASE_URL`

Ensure `.env` exists and includes:

```bash
DATABASE_URL="file:./prisma/dev.db"
```

### Prisma schema changed but app errors persist

Run:

```bash
npx prisma migrate dev
```

### Type errors after pulling changes

Reinstall and regenerate:

```bash
npm install
npx prisma generate
```

## Roadmap Ideas

- Notifications / daily summary
- Auth + real profile avatars
- Calendar month/week views
- Task comments and activity history
- Optional sync/deployment beyond local SQLite
