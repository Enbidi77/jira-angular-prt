# Database Schema & Entity Relationships

The PostgreSQL database enforces strict relational integrity with foreign keys, checks, indexes, and triggers.

## Entity-Relationship Diagram

```
[profiles]
   ^
   | (user_id)
[workspace_members] ---> [workspaces]
                              ^
                              | (workspace_id)
                         [projects] <---+
                              ^         |
                              |         |
                              |         +---- [boards] ---> [board_columns]
                              |         |
                              |         +---- [sprints]
                              |         |
                              |         +---- [issue_statuses] ---> [issue_transitions]
                              |
                              +---- [issues] <----+---- [comments]
                                      ^           |
                                      |           +---- [attachments]
                               [issue_types]      |
                                                  +---- [activity_events]
                                                  |
                                                  +---- [issue_links]
                                                  |
                                                  +---- [issue_labels]
```

## Core Tables

| Table                      | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| `profiles`                 | User profiles mirrored from `auth.users` via trigger                 |
| `workspaces`               | Multi-tenant organization containers                                 |
| `workspace_members`        | Role-based membership (`owner`, `admin`, `member`, `viewer`)         |
| `projects`                 | Scoped project entities with atomic `issue_counter`                  |
| `issue_types`              | Types such as Epic, Story, Task, Bug, Subtask                        |
| `issue_statuses`           | Project-specific workflow states (`To Do`, `In Progress`, `Done`)    |
| `issue_transitions`        | Allowed workflow transition matrix                                   |
| `issues`                   | Core work items with key `KEY-NUM`, rank string, priority, assignee  |
| `sprints`                  | Time-boxed sprint iterations                                         |
| `boards` & `board_columns` | Kanban and Scrum board column mappings                               |
| `comments`                 | Threaded discussions with Markdown support                           |
| `activity_events`          | Immutable audit trail of issue modifications                         |
| `notifications`            | Private user notifications for assignments, mentions, status changes |
