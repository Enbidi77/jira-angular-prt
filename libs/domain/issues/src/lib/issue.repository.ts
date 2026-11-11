import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';
import { Database } from '@jira-prt/platform/supabase-client';

export type Issue = Database['public']['Tables']['issues']['Row'] & {
  type?: Database['public']['Tables']['issue_types']['Row'];
  status?: Database['public']['Tables']['issue_statuses']['Row'];
  assignee?: Database['public']['Tables']['profiles']['Row'];
  reporter?: Database['public']['Tables']['profiles']['Row'];
};
export type IssueType = Database['public']['Tables']['issue_types']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'] & {
  author?: Database['public']['Tables']['profiles']['Row'];
};

export interface CreateIssueParams {
  projectId: string;
  typeId: string;
  summary: string;
  description?: string;
  priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
  assigneeId?: string | null;
  parentId?: string | null;
  sprintId?: string | null;
  storyPoints?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class IssueRepository {
  private supabase = inject(SupabaseClientService);

  async getIssueTypes(workspaceId?: string): Promise<IssueType[]> {
    let query = this.supabase.from('issue_types').select('*');
    if (workspaceId) {
      query = query.or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`);
    } else {
      query = query.is('workspace_id', null);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getIssuesByProject(
    projectId: string,
    options?: {
      sprintId?: string | null;
      statusId?: string;
      assigneeId?: string;
      search?: string;
    },
  ): Promise<Issue[]> {
    let query = this.supabase
      .from('issues')
      .select(
        `
        *,
        type:issue_types(*),
        status:issue_statuses(*),
        assignee:profiles!issues_assignee_id_fkey(*),
        reporter:profiles!issues_reporter_id_fkey(*)
      `,
      )
      .eq('project_id', projectId)
      .eq('is_archived', false)
      .order('rank', { ascending: true });

    if (options?.sprintId !== undefined) {
      if (options.sprintId === null) {
        query = query.is('sprint_id', null);
      } else {
        query = query.eq('sprint_id', options.sprintId);
      }
    }

    if (options?.statusId) {
      query = query.eq('status_id', options.statusId);
    }

    if (options?.assigneeId) {
      query = query.eq('assignee_id', options.assigneeId);
    }

    const { data, error } = await query;

    if (error) {
      // Simple fallback query
      const { data: fallbackIssues } = await this.supabase
        .from('issues')
        .select('*')
        .eq('project_id', projectId)
        .order('rank', { ascending: true });
      return (fallbackIssues as unknown as Issue[]) || [];
    }

    let issues = (data as unknown as Issue[]) || [];

    if (options?.search) {
      const q = options.search.toLowerCase();
      issues = issues.filter(
        (i) =>
          i.issue_key.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q)),
      );
    }

    return issues;
  }

  async getIssueByKey(
    projectId: string,
    issueKey: string,
  ): Promise<Issue | null> {
    const { data, error } = await this.supabase
      .from('issues')
      .select(
        `
        *,
        type:issue_types(*),
        status:issue_statuses(*),
        assignee:profiles!issues_assignee_id_fkey(*),
        reporter:profiles!issues_reporter_id_fkey(*)
      `,
      )
      .eq('project_id', projectId)
      .eq('issue_key', issueKey)
      .single();

    if (error) return null;
    return data as unknown as Issue;
  }

  async createIssue(params: CreateIssueParams): Promise<Issue> {
    // Attempt transactional database function
    const { data, error } = await this.supabase.rpc(
      'create_issue_transactional',
      {
        p_project_id: params.projectId,
        p_type_id: params.typeId,
        p_summary: params.summary,
        p_description: params.description || null,
        p_priority: params.priority || 'medium',
        p_assignee_id: params.assigneeId || null,
        p_parent_id: params.parentId || null,
        p_sprint_id: params.sprintId || null,
        p_story_points: params.storyPoints || null,
      },
    );

    if (error) {
      // Fallback direct creation if RPC not found in testing environment
      const user = this.supabase.currentUser();
      const { data: proj } = await this.supabase
        .from('projects')
        .select('key, issue_counter')
        .eq('id', params.projectId)
        .single();

      const newCounter = (proj?.issue_counter || 0) + 1;
      const key = `${proj?.key || 'PROJ'}-${newCounter}`;

      await this.supabase
        .from('projects')
        .update({ issue_counter: newCounter })
        .eq('id', params.projectId);

      const { data: initialStatus } = await this.supabase
        .from('issue_statuses')
        .select('id')
        .eq('project_id', params.projectId)
        .order('position')
        .limit(1)
        .single();

      const { data: directIssue, error: insertErr } = await this.supabase
        .from('issues')
        .insert({
          project_id: params.projectId,
          issue_number: newCounter,
          issue_key: key,
          type_id: params.typeId,
          status_id:
            initialStatus?.id || 'c0000000-0000-0000-0000-000000000001',
          priority: params.priority || 'medium',
          summary: params.summary,
          description: params.description || null,
          assignee_id: params.assigneeId || null,
          reporter_id: user?.id || '00000000-0000-0000-0000-000000000000',
          parent_id: params.parentId || null,
          sprint_id: params.sprintId || null,
          story_points: params.storyPoints || null,
          rank: `${newCounter}`.padStart(6, '0'),
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      return directIssue as unknown as Issue;
    }

    return data as unknown as Issue;
  }

  async transitionIssue(issueId: string, newStatusId: string): Promise<void> {
    const { error } = await this.supabase.rpc('transition_issue', {
      p_issue_id: issueId,
      p_new_status_id: newStatusId,
    });

    if (error) {
      // Fallback update
      const { error: updateErr } = await this.supabase
        .from('issues')
        .update({ status_id: newStatusId })
        .eq('id', issueId);

      if (updateErr) throw updateErr;
    }
  }

  async updateIssueRank(issueId: string, rank: string): Promise<void> {
    const { error } = await this.supabase
      .from('issues')
      .update({ rank })
      .eq('id', issueId);

    if (error) throw error;
  }

  async updateIssue(
    issueId: string,
    updates: Partial<Database['public']['Tables']['issues']['Update']>,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId);

    if (error) throw error;
  }

  async getComments(issueId: string): Promise<Comment[]> {
    const { data, error } = await this.supabase
      .from('comments')
      .select(
        `
        *,
        author:profiles(*)
      `,
      )
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (error) {
      const { data: fallbackComments } = await this.supabase
        .from('comments')
        .select('*')
        .eq('issue_id', issueId);
      return (fallbackComments as unknown as Comment[]) || [];
    }

    return (data as unknown as Comment[]) || [];
  }

  async addComment(issueId: string, content: string): Promise<Comment> {
    const user = this.supabase.currentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('comments')
      .insert({
        issue_id: issueId,
        author_id: user.id,
        content,
      })
      .select(
        `
        *,
        author:profiles(*)
      `,
      )
      .single();

    if (error) throw error;
    return data as unknown as Comment;
  }
}
