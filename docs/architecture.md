# Architecture Overview: Kite Platform

## 1. High-Level System Architecture

Kite is designed around a modern Single Page Application (SPA) frontend communicating directly with Supabase managed services over HTTP REST (PostgREST) and WebSockets (Supabase Realtime).

```
+-------------------------------------------------------+
|                    Browser Client                     |
|  +-------------------------------------------------+  |
|  |           Angular 22+ Application Shell         |  |
|  |  (Signals, CDK Drag & Drop, Tailwind Tokens)   |  |
|  +------------------------+------------------------+  |
|                           |                           |
|       +-------------------+-------------------+       |
|       | Domain Repositories & State Services  |       |
|       | (Issue, Project, Sprint, Workspace)   |       |
|       +-------------------+-------------------+       |
|                           |                           |
+---------------------------+---------------------------+
                            |
           +----------------+----------------+
           |                                 |
           v HTTPS                           v WebSockets
+----------------------+           +--------------------+
|  Supabase PostgREST  |           | Supabase Realtime  |
|  (RLS Protected API) |           | (Changes, Presence)|
+----------+-----------+           +---------+----------+
           |                                 |
           +----------------+----------------+
                            |
                            v
+-------------------------------------------------------+
|                  PostgreSQL Database                  |
|  - Row Level Security (RLS) Policies                  |
|  - Sequential Locking (`create_issue_transactional`)  |
|  - Workflow Status Transition Engine                  |
|  - Trigram & Full-Text Search Indexes                 |
+-------------------------------------------------------+
```

## 2. Layered Frontend Architecture

- **Presentation Layer**: Thin, standalone Angular components driven by reactive Signals.
- **Domain Layer**: Normalized business entities, models, and repositories.
- **Platform Layer**: Supabase client wrapper, authentication session management, and Realtime event multiplexing.
- **Shared UI Layer**: Accessible UI primitives built on top of Angular CDK with zero business logic dependencies.

## 3. Concurrency & Optimistic State Management

1. **Board Card Moves**:
   - Applying optimistic state locally immediately updates UI responsiveness.
   - Dispatches `transition_issue` to the database.
   - If the database transition constraint rejects the move, the UI rolls back cleanly to previous state.
2. **Issue Number Allocation**:
   - Handled exclusively inside the database transaction with `FOR UPDATE` lock on the project counter to guarantee strict sequence without gaps or duplicates under heavy concurrent creation.
