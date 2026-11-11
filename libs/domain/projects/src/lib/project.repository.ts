import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';
import { Database } from '@jira-prt/platform/supabase-client';

export type Project = Database['public']['Tables']['projects']['Row'];
export type IssueStatus = Database['public']['Tables']['issue_statuses']['Row'];
export type Board = Database['public']['Tables']['boards']['Row'];
export type BoardColumn =
  Database['public']['Tables']['board_columns']['Row'] & {
    status?: IssueStatus;
  };

@Injectable({
  providedIn: 'root',
})
export class ProjectRepository {
  private supabase = inject(SupabaseClientService);

  async getProjectsByWorkspace(workspaceId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_archived', false)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) return null;
    return data;
  }

  async getProjectByKey(
    workspaceId: string,
    key: string,
  ): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('key', key.toUpperCase())
      .single();

    if (error) return null;
    return data;
  }

  async createProject(
    workspaceId: string,
    name: string,
    key: string,
    description?: string,
    category: string = 'software',
  ): Promise<Project> {
    // Call transactional database function create_project_with_defaults
    const { data, error } = await this.supabase.rpc(
      'create_project_with_defaults',
      {
        p_workspace_id: workspaceId,
        p_name: name,
        p_key: key.toUpperCase(),
        p_description: description || null,
        p_category: category,
      },
    );

    if (error) {
      // Fallback direct insert if RPC not registered in current environment
      const user = this.supabase.currentUser();
      const { data: directProject, error: insertError } = await this.supabase
        .from('projects')
        .insert({
          workspace_id: workspaceId,
          name,
          key: key.toUpperCase(),
          description: description || null,
          category,
          lead_id: user?.id || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add default statuses
      const { data: sTodo } = await this.supabase
        .from('issue_statuses')
        .insert({
          project_id: directProject.id,
          name: 'To Do',
          category: 'todo',
          color: '#94a3b8',
          position: 0,
        })
        .select()
        .single();
      const { data: sProgress } = await this.supabase
        .from('issue_statuses')
        .insert({
          project_id: directProject.id,
          name: 'In Progress',
          category: 'in_progress',
          color: '#3b82f6',
          position: 1,
        })
        .select()
        .single();
      const { data: sDone } = await this.supabase
        .from('issue_statuses')
        .insert({
          project_id: directProject.id,
          name: 'Done',
          category: 'done',
          color: '#10b981',
          position: 2,
        })
        .select()
        .single();

      // Add default board
      const { data: board } = await this.supabase
        .from('boards')
        .insert({
          project_id: directProject.id,
          name: `${name} Board`,
          type: 'kanban',
        })
        .select()
        .single();

      if (board && sTodo && sProgress && sDone) {
        await this.supabase.from('board_columns').insert([
          {
            board_id: board.id,
            status_id: sTodo.id,
            name: 'To Do',
            position: 0,
          },
          {
            board_id: board.id,
            status_id: sProgress.id,
            name: 'In Progress',
            position: 1,
          },
          {
            board_id: board.id,
            status_id: sDone.id,
            name: 'Done',
            position: 2,
          },
        ]);
      }

      return directProject;
    }

    return data;
  }

  async getProjectStatuses(projectId: string): Promise<IssueStatus[]> {
    const { data, error } = await this.supabase
      .from('issue_statuses')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getProjectBoards(projectId: string): Promise<Board[]> {
    const { data, error } = await this.supabase
      .from('boards')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    return data || [];
  }

  async getBoardColumns(boardId: string): Promise<BoardColumn[]> {
    const { data, error } = await this.supabase
      .from('board_columns')
      .select(
        `
        *,
        status:issue_statuses(*)
      `,
      )
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) {
      const { data: fallbackCols } = await this.supabase
        .from('board_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });
      return (fallbackCols as BoardColumn[]) || [];
    }

    return (data as unknown as BoardColumn[]) || [];
  }
}
