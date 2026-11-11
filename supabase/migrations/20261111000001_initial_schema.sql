-- ============================================================================
-- Migration: 20261111000001_initial_schema.sql
-- Description: Core schema, RLS policies, functions, and triggers for Jira-inspired platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. Profiles (sync with auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Workspaces & Memberships
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.workspace_members (
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + INTERVAL '7 days')
);

-- ----------------------------------------------------------------------------
-- 3. Projects & Memberships
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    category TEXT,
    lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issue_counter INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_project_workspace_key UNIQUE (workspace_id, key)
);

CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.project_members (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (project_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 4. Issue Types, Statuses & Workflows
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_subtask BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.issue_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('todo', 'in_progress', 'done')),
    color TEXT NOT NULL DEFAULT '#64748b',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.issue_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    from_status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE CASCADE,
    to_status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    CONSTRAINT uq_issue_transitions UNIQUE (project_id, from_status_id, to_status_id)
);

-- ----------------------------------------------------------------------------
-- 5. Sprints & Boards
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    sequence INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_sprints_updated_at
    BEFORE UPDATE ON public.sprints
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'kanban' CHECK (type IN ('kanban', 'scrum')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.board_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    wip_limit INTEGER,
    CONSTRAINT uq_board_column UNIQUE (board_id, status_id)
);

-- ----------------------------------------------------------------------------
-- 6. Issues
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    issue_number INTEGER NOT NULL,
    issue_key TEXT NOT NULL,
    type_id UUID NOT NULL REFERENCES public.issue_types(id),
    status_id UUID NOT NULL REFERENCES public.issue_statuses(id),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest')),
    summary TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
    story_points NUMERIC(5,2),
    rank TEXT NOT NULL DEFAULT '0',
    due_date DATE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_issue_project_number UNIQUE (project_id, issue_number),
    CONSTRAINT uq_issue_project_key UNIQUE (project_id, issue_key)
);

CREATE TRIGGER set_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Full-text search index on issues summary & description
CREATE INDEX IF NOT EXISTS idx_issues_search 
    ON public.issues USING gin(to_tsvector('english', summary || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_issues_project_status 
    ON public.issues(project_id, status_id);
CREATE INDEX IF NOT EXISTS idx_issues_project_sprint 
    ON public.issues(project_id, sprint_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee 
    ON public.issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_rank 
    ON public.issues(project_id, rank);

-- ----------------------------------------------------------------------------
-- 7. Labels & Components
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    CONSTRAINT uq_project_label UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS public.issue_labels (
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, label_id)
);

-- ----------------------------------------------------------------------------
-- 8. Comments & Attachments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 9. Activity Events & Notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON public.notifications(user_id, is_read, created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. Issue Links & Watchers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inward_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    outward_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('blocks', 'is_blocked_by', 'relates_to', 'duplicates', 'is_duplicated_by')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.issue_watchers (
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (issue_id, user_id)
);

-- ============================================================================
-- 11. Security Definer Helper Functions (RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = p_workspace_id
          AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = p_workspace_id
          AND user_id = auth.uid()
          AND role IN ('owner', 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p_project_id
          AND pm.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = p_project_id
          AND wm.user_id = auth.uid()
          AND wm.role IN ('owner', 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_project_admin(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p_project_id
          AND pm.user_id = auth.uid()
          AND pm.role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = p_project_id
          AND wm.user_id = auth.uid()
          AND wm.role IN ('owner', 'admin')
    );
$$;

-- ============================================================================
-- 12. Transactional Business Logic Functions
-- ============================================================================

-- Function: create_issue_transactional
-- Safely increments project issue counter and generates human-readable key (e.g., PROJ-101)
CREATE OR REPLACE FUNCTION public.create_issue_transactional(
    p_project_id UUID,
    p_type_id UUID,
    p_summary TEXT,
    p_description TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium',
    p_assignee_id UUID DEFAULT NULL,
    p_parent_id UUID DEFAULT NULL,
    p_sprint_id UUID DEFAULT NULL,
    p_story_points NUMERIC DEFAULT NULL
)
RETURNS public.issues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_project public.projects%ROWTYPE;
    v_new_counter INTEGER;
    v_issue_key TEXT;
    v_initial_status_id UUID;
    v_new_issue public.issues%ROWTYPE;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify project access
    IF NOT public.is_project_member(p_project_id) THEN
        RAISE EXCEPTION 'Forbidden: not a project member';
    END IF;

    -- Lock project row to guarantee sequential counter without race conditions
    SELECT * INTO v_project
    FROM public.projects
    WHERE id = p_project_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    v_new_counter := v_project.issue_counter + 1;
    v_issue_key := v_project.key || '-' || v_new_counter;

    -- Update project issue counter
    UPDATE public.projects
    SET issue_counter = v_new_counter,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_project_id;

    -- Find initial status for this project
    SELECT id INTO v_initial_status_id
    FROM public.issue_statuses
    WHERE project_id = p_project_id
    ORDER BY position ASC
    LIMIT 1;

    IF v_initial_status_id IS NULL THEN
        RAISE EXCEPTION 'Project has no configured issue statuses';
    END IF;

    -- Insert new issue
    INSERT INTO public.issues (
        project_id,
        issue_number,
        issue_key,
        type_id,
        status_id,
        priority,
        summary,
        description,
        assignee_id,
        reporter_id,
        parent_id,
        sprint_id,
        story_points,
        rank
    ) VALUES (
        p_project_id,
        v_new_counter,
        v_issue_key,
        p_type_id,
        v_initial_status_id,
        p_priority,
        p_summary,
        p_description,
        p_assignee_id,
        v_caller_id,
        p_parent_id,
        p_sprint_id,
        p_story_points,
        to_char(v_new_counter, 'FM000000')
    )
    RETURNING * INTO v_new_issue;

    -- Record activity event
    INSERT INTO public.activity_events (
        project_id,
        issue_id,
        actor_id,
        action,
        new_value
    ) VALUES (
        p_project_id,
        v_new_issue.id,
        v_caller_id,
        'created',
        v_issue_key
    );

    -- Notify assignee if assigned upon creation
    IF p_assignee_id IS NOT NULL AND p_assignee_id <> v_caller_id THEN
        INSERT INTO public.notifications (
            user_id,
            actor_id,
            issue_id,
            type,
            title,
            body
        ) VALUES (
            p_assignee_id,
            v_caller_id,
            v_new_issue.id,
            'assigned',
            'Assigned to issue ' || v_issue_key,
            p_summary
        );
    END IF;

    RETURN v_new_issue;
END;
$$;

-- Function: transition_issue
-- Validates transitions and updates status atomically
CREATE OR REPLACE FUNCTION public.transition_issue(
    p_issue_id UUID,
    p_new_status_id UUID
)
RETURNS public.issues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_issue public.issues%ROWTYPE;
    v_old_status public.issue_statuses%ROWTYPE;
    v_new_status public.issue_statuses%ROWTYPE;
    v_transition_allowed BOOLEAN;
    v_transition_count INTEGER;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_issue
    FROM public.issues
    WHERE id = p_issue_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Issue not found';
    END IF;

    IF NOT public.is_project_member(v_issue.project_id) THEN
        RAISE EXCEPTION 'Forbidden: not a project member';
    END IF;

    -- Same status, no-op
    IF v_issue.status_id = p_new_status_id THEN
        RETURN v_issue;
    END IF;

    SELECT * INTO v_old_status FROM public.issue_statuses WHERE id = v_issue.status_id;
    SELECT * INTO v_new_status FROM public.issue_statuses WHERE id = p_new_status_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target status not found';
    END IF;

    -- Check if workflow transition constraints exist for this project
    SELECT COUNT(*) INTO v_transition_count
    FROM public.issue_transitions
    WHERE project_id = v_issue.project_id;

    -- If transitions are configured, verify this transition exists
    IF v_transition_count > 0 THEN
        SELECT EXISTS (
            SELECT 1 FROM public.issue_transitions
            WHERE project_id = v_issue.project_id
              AND from_status_id = v_issue.status_id
              AND to_status_id = p_new_status_id
        ) INTO v_transition_allowed;

        IF NOT v_transition_allowed THEN
            RAISE EXCEPTION 'Transition from % to % is not allowed by project workflow', v_old_status.name, v_new_status.name;
        END IF;
    END IF;

    -- Update issue
    UPDATE public.issues
    SET status_id = p_new_status_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_issue_id
    RETURNING * INTO v_issue;

    -- Log activity
    INSERT INTO public.activity_events (
        project_id,
        issue_id,
        actor_id,
        action,
        field_name,
        old_value,
        new_value
    ) VALUES (
        v_issue.project_id,
        p_issue_id,
        v_caller_id,
        'status_changed',
        'status',
        v_old_status.name,
        v_new_status.name
    );

    -- Notify assignee if different from actor
    IF v_issue.assignee_id IS NOT NULL AND v_issue.assignee_id <> v_caller_id THEN
        INSERT INTO public.notifications (
            user_id,
            actor_id,
            issue_id,
            type,
            title,
            body
        ) VALUES (
            v_issue.assignee_id,
            v_caller_id,
            p_issue_id,
            'status_changed',
            v_issue.issue_key || ' changed status to ' || v_new_status.name,
            v_issue.summary
        );
    END IF;

    RETURN v_issue;
END;
$$;

-- Function: create_project_with_defaults
-- Creates project and initializes default statuses, board, and columns
CREATE OR REPLACE FUNCTION public.create_project_with_defaults(
    p_workspace_id UUID,
    p_name TEXT,
    p_key TEXT,
    p_description TEXT DEFAULT NULL,
    p_category TEXT DEFAULT 'software'
)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_project public.projects%ROWTYPE;
    v_board public.boards%ROWTYPE;
    v_s_backlog public.issue_statuses%ROWTYPE;
    v_s_todo public.issue_statuses%ROWTYPE;
    v_s_progress public.issue_statuses%ROWTYPE;
    v_s_done public.issue_statuses%ROWTYPE;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT public.is_workspace_member(p_workspace_id) THEN
        RAISE EXCEPTION 'Forbidden: not a workspace member';
    END IF;

    INSERT INTO public.projects (
        workspace_id,
        name,
        key,
        description,
        category,
        lead_id
    ) VALUES (
        p_workspace_id,
        p_name,
        upper(trim(p_key)),
        p_description,
        p_category,
        v_caller_id
    )
    RETURNING * INTO v_project;

    -- Add creator as admin
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (v_project.id, v_caller_id, 'admin');

    -- Create default statuses
    INSERT INTO public.issue_statuses (project_id, name, category, color, position)
    VALUES (v_project.id, 'To Do', 'todo', '#94a3b8', 0)
    RETURNING * INTO v_s_todo;

    INSERT INTO public.issue_statuses (project_id, name, category, color, position)
    VALUES (v_project.id, 'In Progress', 'in_progress', '#3b82f6', 1)
    RETURNING * INTO v_s_progress;

    INSERT INTO public.issue_statuses (project_id, name, category, color, position)
    VALUES (v_project.id, 'Done', 'done', '#10b981', 2)
    RETURNING * INTO v_s_done;

    -- Create default Kanban Board
    INSERT INTO public.boards (project_id, name, type)
    VALUES (v_project.id, v_project.name || ' Board', 'kanban')
    RETURNING * INTO v_board;

    -- Create board columns
    INSERT INTO public.board_columns (board_id, status_id, name, position)
    VALUES 
        (v_board.id, v_s_todo.id, 'To Do', 0),
        (v_board.id, v_s_progress.id, 'In Progress', 1),
        (v_board.id, v_s_done.id, 'Done', 2);

    RETURN v_project;
END;
$$;

-- Trigger: create profile when new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = coalesce(EXCLUDED.full_name, profiles.full_name),
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Hook into auth.users if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT OR UPDATE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ============================================================================
-- 13. Enable Row Level Security (RLS) on all tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_watchers ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 14. Define RLS Policies
-- ----------------------------------------------------------------------------

-- PROFILES: anyone authenticated can read profiles; users can update their own
CREATE POLICY "Profiles readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- WORKSPACES: members can read; admins/owners can update/delete; any authenticated user can create
CREATE POLICY "Workspaces readable by members"
    ON public.workspaces FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(id));

CREATE POLICY "Authenticated users can create workspaces"
    ON public.workspaces FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Workspace admins can update"
    ON public.workspaces FOR UPDATE
    TO authenticated
    USING (public.is_workspace_admin(id))
    WITH CHECK (public.is_workspace_admin(id));

CREATE POLICY "Workspace owners can delete"
    ON public.workspaces FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = id AND user_id = auth.uid() AND role = 'owner'
        )
    );

-- WORKSPACE MEMBERS: readable by members of that workspace
CREATE POLICY "Workspace members readable by workspace members"
    ON public.workspace_members FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can insert members"
    ON public.workspace_members FOR INSERT
    TO authenticated
    WITH CHECK (public.is_workspace_admin(workspace_id) OR auth.uid() = user_id);

CREATE POLICY "Workspace admins can update members"
    ON public.workspace_members FOR UPDATE
    TO authenticated
    USING (public.is_workspace_admin(workspace_id))
    WITH CHECK (public.is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins or self can delete member"
    ON public.workspace_members FOR DELETE
    TO authenticated
    USING (public.is_workspace_admin(workspace_id) OR auth.uid() = user_id);

-- PROJECTS: members can view; workspace admins can create/update
CREATE POLICY "Projects viewable by workspace members"
    ON public.projects FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Projects insertable by workspace admins"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (public.is_workspace_admin(workspace_id) OR public.is_workspace_member(workspace_id));

CREATE POLICY "Projects updatable by project admins"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (public.is_project_admin(id))
    WITH CHECK (public.is_project_admin(id));

-- PROJECT MEMBERS
CREATE POLICY "Project members readable by project members"
    ON public.project_members FOR SELECT
    TO authenticated
    USING (public.is_project_member(project_id));

CREATE POLICY "Project members manageable by project admins"
    ON public.project_members FOR ALL
    TO authenticated
    USING (public.is_project_admin(project_id))
    WITH CHECK (public.is_project_admin(project_id));

-- ISSUE TYPES
CREATE POLICY "Issue types readable by all authenticated"
    ON public.issue_types FOR SELECT
    TO authenticated
    USING (workspace_id IS NULL OR public.is_workspace_member(workspace_id));

-- STATUSES & WORKFLOWS
CREATE POLICY "Statuses viewable by project members"
    ON public.issue_statuses FOR SELECT
    TO authenticated
    USING (public.is_project_member(project_id));

CREATE POLICY "Statuses editable by project admins"
    ON public.issue_statuses FOR ALL
    TO authenticated
    USING (public.is_project_admin(project_id))
    WITH CHECK (public.is_project_admin(project_id));

CREATE POLICY "Transitions viewable by project members"
    ON public.issue_transitions FOR SELECT
    TO authenticated
    USING (public.is_project_member(project_id));

CREATE POLICY "Transitions editable by project admins"
    ON public.issue_transitions FOR ALL
    TO authenticated
    USING (public.is_project_admin(project_id))
    WITH CHECK (public.is_project_admin(project_id));

-- BOARDS & COLUMNS
CREATE POLICY "Boards viewable by project members"
    ON public.boards FOR SELECT
    TO authenticated
    USING (public.is_project_member(project_id));

CREATE POLICY "Boards editable by project members"
    ON public.boards FOR ALL
    TO authenticated
    USING (public.is_project_member(project_id))
    WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Board columns viewable by project members"
    ON public.board_columns FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.is_project_member(b.project_id)));

CREATE POLICY "Board columns editable by project members"
    ON public.board_columns FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.is_project_member(b.project_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_id AND public.is_project_member(b.project_id)));

-- SPRINTS
CREATE POLICY "Sprints viewable by project members"
    ON public.sprints FOR SELECT
    TO authenticated
    USING (public.is_project_member(project_id));

CREATE POLICY "Sprints manageable by project members"
    ON public.sprints FOR ALL
    TO authenticated
    USING (public.is_project_member(project_id))
    WITH CHECK (public.is_project_member(project_id));

-- ISSUES
CREATE POLICY "Issues viewable by project members"
    ON public.issues FOR SELECT
    TO authenticated
    USING (public.is_project_member(project_id));

CREATE POLICY "Issues insertable by project members"
    ON public.issues FOR INSERT
    TO authenticated
    WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Issues updatable by project members"
    ON public.issues FOR UPDATE
    TO authenticated
    USING (public.is_project_member(project_id))
    WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Issues deletable by project admins"
    ON public.issues FOR DELETE
    TO authenticated
    USING (public.is_project_admin(project_id));

-- COMMENTS
CREATE POLICY "Comments viewable by project members"
    ON public.comments FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.issues i WHERE i.id = issue_id AND public.is_project_member(i.project_id)));

CREATE POLICY "Comments insertable by project members"
    ON public.comments FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (SELECT 1 FROM public.issues i WHERE i.id = issue_id AND public.is_project_member(i.project_id))
    );

CREATE POLICY "Comments updatable by author"
    ON public.comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Comments deletable by author or admin"
    ON public.comments FOR DELETE
    TO authenticated
    USING (
        auth.uid() = author_id OR
        EXISTS (
            SELECT 1 FROM public.issues i 
            WHERE i.id = issue_id AND public.is_project_admin(i.project_id)
        )
    );

-- ATTACHMENTS
CREATE POLICY "Attachments viewable by project members"
    ON public.attachments FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.issues i WHERE i.id = issue_id AND public.is_project_member(i.project_id)));

CREATE POLICY "Attachments insertable by project members"
    ON public.attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = uploaded_by AND
        EXISTS (SELECT 1 FROM public.issues i WHERE i.id = issue_id AND public.is_project_member(i.project_id))
    );

-- ACTIVITY EVENTS
CREATE POLICY "Activity events viewable by project members"
    ON public.activity_events FOR SELECT
    TO authenticated
    USING (public.is_project_member(project_id));

CREATE POLICY "Activity events insertable by project members"
    ON public.activity_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = actor_id);

-- NOTIFICATIONS: strictly private to user
CREATE POLICY "Notifications viewable only by recipient"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Notifications updatable only by recipient"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Notifications deletable only by recipient"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- SEED GLOBAL DEFAULT ISSUE TYPES
INSERT INTO public.issue_types (name, icon, color, is_subtask)
VALUES 
    ('Epic', 'zap', '#8b5cf6', false),
    ('Story', 'bookmark', '#10b981', false),
    ('Task', 'check-square', '#3b82f6', false),
    ('Bug', 'alert-circle', '#ef4444', false),
    ('Subtask', 'git-commit', '#64748b', true)
ON CONFLICT DO NOTHING;
