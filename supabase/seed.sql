-- ============================================================================
-- Seed Data: Sample Demo Data for Jira Platform
-- ============================================================================

-- Ensure demo user profile exists if auth user exists
DO $$
DECLARE
    v_ws_id UUID;
    v_proj_id UUID;
    v_board_id UUID;
    v_s_todo UUID;
    v_s_prog UUID;
    v_s_done UUID;
    v_t_story UUID;
    v_t_bug UUID;
    v_t_task UUID;
    v_sprint_id UUID;
BEGIN
    -- Global issue types IDs
    SELECT id INTO v_t_story FROM public.issue_types WHERE name = 'Story' LIMIT 1;
    SELECT id INTO v_t_bug FROM public.issue_types WHERE name = 'Bug' LIMIT 1;
    SELECT id INTO v_t_task FROM public.issue_types WHERE name = 'Task' LIMIT 1;

    -- Create Demo Workspace
    INSERT INTO public.workspaces (id, name, slug)
    VALUES ('a0000000-0000-0000-0000-000000000001', 'Acme Engineering', 'acme-eng')
    ON CONFLICT (slug) DO NOTHING;

    -- Create Demo Project
    INSERT INTO public.projects (id, workspace_id, name, key, description, category, issue_counter)
    VALUES (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'Cloud Platform',
        'CORE',
        'High-performance distributed cloud orchestration engine',
        'platform',
        4
    )
    ON CONFLICT (workspace_id, key) DO NOTHING;

    -- Create default statuses for CORE
    INSERT INTO public.issue_statuses (id, project_id, name, category, color, position)
    VALUES 
        ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'To Do', 'todo', '#94a3b8', 0),
        ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'In Progress', 'in_progress', '#3b82f6', 1),
        ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Done', 'done', '#10b981', 2)
    ON CONFLICT DO NOTHING;

    -- Create Kanban Board
    INSERT INTO public.boards (id, project_id, name, type)
    VALUES ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CORE Kanban', 'kanban')
    ON CONFLICT DO NOTHING;

    -- Create Board Columns
    INSERT INTO public.board_columns (board_id, status_id, name, position)
    VALUES
        ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'To Do', 0),
        ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'In Progress', 1),
        ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Done', 2)
    ON CONFLICT DO NOTHING;

    -- Create Active Sprint
    INSERT INTO public.sprints (id, project_id, name, goal, status, start_date, end_date, sequence)
    VALUES (
        'e0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'Sprint 1 - Foundation',
        'Deliver core authentication and board workflows',
        'active',
        now() - INTERVAL '3 days',
        now() + INTERVAL '11 days',
        1
    )
    ON CONFLICT DO NOTHING;
END $$;
