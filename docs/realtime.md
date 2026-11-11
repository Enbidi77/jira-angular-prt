# Real-Time Collaboration Architecture

Kite leverages Supabase Realtime to power instantaneous multi-user collaboration without full-page reloads or polling.

## Channels & Topics

### 1. Project Issues Subscription (`project-issues:${projectId}`)

- Listens to PostgreSQL `INSERT`, `UPDATE`, and `DELETE` events on the `issues` table filtered by `project_id=eq.${projectId}`.
- Triggered whenever another user drags a card on a Kanban board, creates an issue, or edits an issue's details.

### 2. User Notifications Subscription (`user-notifications:${userId}`)

- Listens to `INSERT` events on the `notifications` table filtered by `user_id=eq.${userId}`.
- Instantly increments the top navigation unread badge and updates the notifications dropdown.

### 3. Presence Rooms (`presence:board-${projectId}`)

- Utilizes the Supabase Realtime Presence protocol.
- Broadcasts `{ userId, userName, avatarUrl, onlineAt }` to all clients viewing the board.
- Renders avatar indicators in the top right of the Kanban board.
- Automatically handles disconnects and untracking.
