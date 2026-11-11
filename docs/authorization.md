# Authorization & Row Level Security (RLS) Model

Security is enforced at the PostgreSQL database layer using PostgreSQL Row Level Security (RLS). Frontend route guards serve only as navigation guides; every database query evaluates user authorization against the authenticated JWT session.

## Helper Functions

Security helper functions are marked `SECURITY DEFINER` and have their search path locked to `public` to prevent search path injection attacks:

1. `is_workspace_member(p_workspace_id UUID)`
2. `is_workspace_admin(p_workspace_id UUID)`
3. `is_project_member(p_project_id UUID)`
4. `is_project_admin(p_project_id UUID)`

## Policy Matrix

| Resource        | Select Policy          | Insert Policy            | Update Policy          | Delete Policy             |
| --------------- | ---------------------- | ------------------------ | ---------------------- | ------------------------- |
| `workspaces`    | Workspace members      | Authenticated            | Workspace admins       | Workspace owners          |
| `projects`      | Workspace members      | Workspace admins/members | Project admins         | Workspace owners          |
| `issues`        | Project members        | Project members          | Project members        | Project admins            |
| `comments`      | Project members        | Comment author           | Comment author         | Author or Project admin   |
| `notifications` | `auth.uid() = user_id` | Server/Triggers          | `auth.uid() = user_id` | `auth.uid() = user_id`    |
| `attachments`   | Project members        | Project members          | Uploader               | Uploader or Project admin |
