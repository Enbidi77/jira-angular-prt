# Kite: Jira-Inspired Project Management Platform - Agent Guidelines

Welcome to the Kite engineering codebase. This document outlines the architectural boundaries, coding conventions, Supabase practices, security requirements, and development workflows for this repository.

---

## 1. Project Overview & Mission

Kite is a high-performance, Jira-inspired project management platform designed for modern product and software engineering teams. It provides end-to-end functionality for managing workspaces, projects, issues, sprints, backlogs, boards, workflows, real-time collaboration, and analytics.

---

## 2. Technology Stack

- **Monorepo Orchestration**: Nx with pnpm workspaces
- **Frontend Framework**: Angular (v22+) with TypeScript strict mode, standalone components, Angular Signals, and lazy-loaded routes
- **Styling & Design System**: Tailwind CSS v4 with custom CSS variable design tokens supporting light and dark themes
- **UI & Accessibility Primitives**: Angular CDK (Drag & Drop, Overlays) and custom enterprise presentation components
- **Reactivity & Realtime**: Angular Signals for local/derived state, RxJS for async composition and Realtime events
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security, Realtime channels/presence, Storage)
- **Quality & Testing**: Vitest for unit tests, Playwright for E2E user journeys, ESLint, Prettier

---

## 3. Monorepo Architecture & Architectural Boundaries

```
project-management-platform/
├── apps/
│   ├── web/                     # Angular Single Page Application
│   └── web-e2e/                 # Playwright E2E test suites
├── libs/
│   ├── platform/                # Infrastructure & external adapters
│   │   ├── supabase-client/     # Typed Supabase client & generated database types
│   │   ├── authentication/      # Session, profile management, and route guards
│   │   ├── realtime/            # Postgres Changes, Broadcast & Presence
│   │   └── notifications/       # In-app notifications & unread counts
│   ├── domain/                  # Normalized business entities and repositories
│   │   ├── workspaces/          # Workspace & membership data access
│   │   ├── projects/            # Project, board, and status data access
│   │   ├── issues/              # Issue CRUD, transactional counter & transitions
│   │   └── sprints/             # Sprint lifecycle and backlog management
│   ├── features/                # Page-level feature components
│   │   ├── auth/                # Login & registration views
│   │   ├── workspaces/          # Workspaces & projects directory
│   │   ├── board/               # Interactive drag-and-drop Kanban board
│   │   ├── backlog/             # Backlog prioritization & sprint planning
│   │   ├── issues-list/         # Advanced filtering and dense issue tables
│   │   ├── reports/             # Velocity, burndown, and distribution charts
│   │   └── settings/            # Project & workflow configuration
│   └── shared/                  # Reusable presentation UI & layout components
│       └── ui/                  # Topbar, sidebar, layout, buttons, badges, modals
├── supabase/
│   ├── config.toml              # Supabase local environment configuration
│   ├── migrations/              # Version-controlled SQL migrations
│   └── seed.sql                 # Sample demo data for local development
└── docs/                        # In-depth architectural & deployment documentation
```

### Dependency Rules

1. **Feature libraries** must not access the raw Supabase client directly; all data persistence and queries route through domain data-access repositories (`IssueRepository`, `ProjectRepository`, etc.).
2. **Domain repositories** own database queries, optimistic updates, and schema mapping.
3. **Shared UI libraries** are purely presentational and never own business logic or make network requests.
4. **Platform libraries** provide infrastructure abstractions and must not depend on domain libraries.

---

## 4. Coding & Angular Conventions

- **Standalone Components Only**: All components, directives, and pipes must specify `standalone: true`.
- **Signals First**: Use Angular `signal()`, `computed()`, and `effect()` for reactive UI state.
- **Strict Typing**: Never use `any` to silence compiler errors. All database models are typed against `Database` in `@jira-prt/platform/supabase-client`.
- **RxJS Discipline**: Use RxJS for streams, debounce operators, event composition, and Supabase Realtime subscriptions. Always clean up channels and subscriptions in `ngOnDestroy`.

---

## 5. Supabase & Database Architecture

### Transactional Issue Number Generation

Issue keys (`PROJ-101`) are generated atomically on the database side using the `create_issue_transactional` stored function:

- Acquires an exclusive row-level lock on the project: `SELECT * FROM projects WHERE id = p_project_id FOR UPDATE`.
- Increments `issue_counter = issue_counter + 1`.
- Formats `issue_key = key || '-' || new_counter`.
- Inserts issue and logs an activity record in the same atomic transaction.
- **Never** generate issue counters in the browser or by running `SELECT COUNT(*)`.

### Row Level Security (RLS)

- Every public table must have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- Use security-definer helper functions (`is_workspace_member`, `is_project_member`, `is_project_admin`) with fixed `search_path = public`.
- Workspace users cannot read or modify another workspace's records.
- Notifications are strictly constrained: `auth.uid() = user_id`.

---

## 6. Realtime Architecture

- **Postgres Changes**: Subscribe to `issues` table changes filtered by `project_id=eq.${projectId}`.
- **Presence**: Track online collaborators viewing active boards or issue drawers using `RealtimeChannel.track()`.
- Always unsubscribe from channels when components are destroyed to prevent memory leaks.

---

## 7. Development & Automation Commands

| Command               | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `pnpm dev`            | Starts local Angular dev server on `http://localhost:4200`  |
| `pnpm build`          | Compiles production SPA bundles into `dist/apps/web`        |
| `pnpm test`           | Runs all Vitest unit tests                                  |
| `pnpm test:e2e`       | Runs Playwright end-to-end browser tests                    |
| `pnpm lint`           | Runs ESLint across all projects                             |
| `pnpm typecheck`      | Validates TypeScript types across the monorepo              |
| `pnpm format`         | Formats all files using Prettier                            |
| `pnpm supabase:start` | Starts local Supabase Docker stack                          |
| `pnpm db:reset`       | Resets local database and applies all migrations + seeds    |
| `pnpm db:types`       | Regenerates TypeScript database types from local PostgreSQL |
