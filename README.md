# Kite — Jira-Inspired Project Management Platform

A high-performance, Jira-inspired project management web application built for modern engineering and product teams. Features interactive drag-and-drop Kanban boards, backlog and sprint management, transactional issue key generation, real-time collaboration with presence indicators, in-app notifications, and analytics.

---

## 🚀 Key Highlights & Architecture

- **Angular 22+ Frontend**: Standalone components, reactive Signals, Angular CDK (drag-and-drop, overlays), and lazy-loaded feature routes.
- **Nx Monorepo Orchestration**: Structured into clean layers (`apps/web`, `libs/platform/*`, `libs/domain/*`, `libs/features/*`, `libs/shared/ui`).
- **PostgreSQL & Supabase**: Normalized schema with Row Level Security (RLS) policies on every public table, triggers for automated profile sync, and transactional sequence locking.
- **Atomic Issue Key Allocation**: Stored database function `create_issue_transactional` locks the project record to guarantee unique, sequential issue numbers (e.g., `CORE-1`, `CORE-2`) under high concurrency.
- **Real-Time Collaboration**: Subscriptions via Supabase Realtime for instant card movements across connected clients and Presence tracking for active collaborators.
- **Enterprise Design System**: Light and dark theme support via CSS variable design tokens and Tailwind CSS v4 styling.

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| Monorepo | Nx 24 + pnpm 10 workspaces |
| Framework | Angular 22+ with TypeScript strict mode |
| UI & Drag/Drop | Tailwind CSS v4, Angular CDK, Lucide Angular |
| Backend & Database | Supabase (PostgreSQL, RLS, Auth, Realtime, Storage) |
| Testing | Vitest (unit tests), Playwright (E2E browser tests) |
| CI/CD | GitHub Actions |

---

## 📂 Repository Layout

```
project-management-platform/
├── apps/
│   ├── web/                     # Angular Single Page Application
│   └── web-e2e/                 # Playwright E2E test suites
├── libs/
│   ├── platform/                # Platform adapters
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

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Local Supabase Setup
```bash
# Start local Supabase Docker stack
pnpm supabase:start

# Apply migrations and seed sample projects & issues
pnpm db:reset
```

### 4. Start Development Server
```bash
pnpm dev
```
Navigate to `http://localhost:4200`.

---

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts local Angular dev server on `http://localhost:4200` |
| `pnpm build` | Compiles production SPA bundles into `dist/apps/web` |
| `pnpm test` | Runs all Vitest unit tests |
| `pnpm test:e2e` | Runs Playwright end-to-end browser tests |
| `pnpm lint` | Runs ESLint across all projects |
| `pnpm typecheck` | Validates TypeScript types across the monorepo |
| `pnpm format` | Formats all files using Prettier |
| `pnpm format:check` | Verifies code formatting |
| `pnpm supabase:start`| Starts local Supabase Docker stack |
| `pnpm db:reset` | Resets local database and applies all migrations + seeds |
| `pnpm db:types` | Regenerates TypeScript database types from local PostgreSQL |

---

## 🔒 Security & Authorization

- All public tables have Row Level Security (RLS) enabled.
- Fine-grained access control is verified using security-definer helper functions (`is_workspace_member`, `is_project_member`, `is_project_admin`) with fixed `search_path = public`.
- Notifications are restricted strictly to `auth.uid() = user_id`.
