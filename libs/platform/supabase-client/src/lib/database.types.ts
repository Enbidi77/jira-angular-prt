export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          job_title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          job_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          job_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          avatar_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          avatar_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          avatar_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          key: string;
          description: string | null;
          avatar_url: string | null;
          category: string | null;
          lead_id: string | null;
          issue_counter: number;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          key: string;
          description?: string | null;
          avatar_url?: string | null;
          category?: string | null;
          lead_id?: string | null;
          issue_counter?: number;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          key?: string;
          description?: string | null;
          avatar_url?: string | null;
          category?: string | null;
          lead_id?: string | null;
          issue_counter?: number;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: 'admin' | 'member' | 'viewer';
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role?: 'admin' | 'member' | 'viewer';
          created_at?: string;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          role?: 'admin' | 'member' | 'viewer';
          created_at?: string;
        };
        Relationships: [];
      };
      issue_types: {
        Row: {
          id: string;
          workspace_id: string | null;
          name: string;
          icon: string;
          color: string;
          is_subtask: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          name: string;
          icon: string;
          color: string;
          is_subtask?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          name?: string;
          icon?: string;
          color?: string;
          is_subtask?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      issue_statuses: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          category: 'todo' | 'in_progress' | 'done';
          color: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          category: 'todo' | 'in_progress' | 'done';
          color?: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          category?: 'todo' | 'in_progress' | 'done';
          color?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      issue_transitions: {
        Row: {
          id: string;
          project_id: string;
          from_status_id: string;
          to_status_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          from_status_id: string;
          to_status_id: string;
          name: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          from_status_id?: string;
          to_status_id?: string;
          name?: string;
        };
        Relationships: [];
      };
      sprints: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          goal: string | null;
          status: 'planned' | 'active' | 'completed';
          start_date: string | null;
          end_date: string | null;
          sequence: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          goal?: string | null;
          status?: 'planned' | 'active' | 'completed';
          start_date?: string | null;
          end_date?: string | null;
          sequence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          goal?: string | null;
          status?: 'planned' | 'active' | 'completed';
          start_date?: string | null;
          end_date?: string | null;
          sequence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          type: 'kanban' | 'scrum';
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          type?: 'kanban' | 'scrum';
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          type?: 'kanban' | 'scrum';
          created_at?: string;
        };
        Relationships: [];
      };
      board_columns: {
        Row: {
          id: string;
          board_id: string;
          status_id: string;
          name: string;
          position: number;
          wip_limit: number | null;
        };
        Insert: {
          id?: string;
          board_id: string;
          status_id: string;
          name: string;
          position?: number;
          wip_limit?: number | null;
        };
        Update: {
          id?: string;
          board_id?: string;
          status_id?: string;
          name?: string;
          position?: number;
          wip_limit?: number | null;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          project_id: string;
          issue_number: number;
          issue_key: string;
          type_id: string;
          status_id: string;
          priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
          summary: string;
          description: string | null;
          assignee_id: string | null;
          reporter_id: string;
          parent_id: string | null;
          sprint_id: string | null;
          story_points: number | null;
          rank: string;
          due_date: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          issue_number?: number;
          issue_key?: string;
          type_id: string;
          status_id: string;
          priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
          summary: string;
          description?: string | null;
          assignee_id?: string | null;
          reporter_id: string;
          parent_id?: string | null;
          sprint_id?: string | null;
          story_points?: number | null;
          rank?: string;
          due_date?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          issue_number?: number;
          issue_key?: string;
          type_id?: string;
          status_id?: string;
          priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
          summary?: string;
          description?: string | null;
          assignee_id?: string | null;
          reporter_id?: string;
          parent_id?: string | null;
          sprint_id?: string | null;
          story_points?: number | null;
          rank?: string;
          due_date?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          issue_id: string;
          author_id: string;
          content: string;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          author_id: string;
          content: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          author_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          issue_id: string;
          uploaded_by: string;
          file_name: string;
          file_size: number;
          file_type: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          uploaded_by: string;
          file_name: string;
          file_size: number;
          file_type: string;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          uploaded_by?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          project_id: string;
          issue_id: string | null;
          actor_id: string;
          action: string;
          field_name: string | null;
          old_value: string | null;
          new_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          issue_id?: string | null;
          actor_id: string;
          action: string;
          field_name?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          issue_id?: string | null;
          actor_id?: string;
          action?: string;
          field_name?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          issue_id: string | null;
          type: string;
          title: string;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id?: string | null;
          issue_id?: string | null;
          type: string;
          title: string;
          body: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string | null;
          issue_id?: string | null;
          type?: string;
          title?: string;
          body?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      labels: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          color?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          color?: string;
        };
        Relationships: [];
      };
      issue_labels: {
        Row: {
          issue_id: string;
          label_id: string;
        };
        Insert: {
          issue_id: string;
          label_id: string;
        };
        Update: {
          issue_id?: string;
          label_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_issue_transactional: {
        Args: {
          p_project_id: string;
          p_type_id: string;
          p_summary: string;
          p_description?: string | null;
          p_priority?: string;
          p_assignee_id?: string | null;
          p_parent_id?: string | null;
          p_sprint_id?: string | null;
          p_story_points?: number | null;
        };
        Returns: Database['public']['Tables']['issues']['Row'];
      };
      transition_issue: {
        Args: {
          p_issue_id: string;
          p_new_status_id: string;
        };
        Returns: Database['public']['Tables']['issues']['Row'];
      };
      create_project_with_defaults: {
        Args: {
          p_workspace_id: string;
          p_name: string;
          p_key: string;
          p_description?: string | null;
          p_category?: string;
        };
        Returns: Database['public']['Tables']['projects']['Row'];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
