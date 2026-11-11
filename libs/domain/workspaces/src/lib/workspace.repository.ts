import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';
import { Database } from '@jira-prt/platform/supabase-client';

export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type WorkspaceMember =
  Database['public']['Tables']['workspace_members']['Row'] & {
    profile?: Database['public']['Tables']['profiles']['Row'];
  };

@Injectable({
  providedIn: 'root',
})
export class WorkspaceRepository {
  private supabase = inject(SupabaseClientService);

  async getMyWorkspaces(): Promise<Workspace[]> {
    const user = this.supabase.currentUser();
    if (!user) return [];

    const { data: memberRows, error: memberError } = await this.supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id);

    if (memberError || !memberRows || memberRows.length === 0) {
      // In local dev/fallback check if there are public workspaces or demo
      const { data } = await this.supabase.from('workspaces').select('*');
      return data || [];
    }

    const wsIds = memberRows.map((m) => m.workspace_id);
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .in('id', wsIds);

    if (error) throw error;
    return data || [];
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  async createWorkspace(name: string, slug: string): Promise<Workspace> {
    const user = this.supabase.currentUser();
    if (!user) throw new Error('Not authenticated');

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const { data: ws, error: wsError } = await this.supabase
      .from('workspaces')
      .insert({
        name,
        slug: cleanSlug,
        created_by: user.id,
      })
      .select()
      .single();

    if (wsError) throw wsError;

    // Add creator as owner
    await this.supabase.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: 'owner',
    });

    return ws;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select(
        `
        workspace_id,
        user_id,
        role,
        created_at,
        profiles (*)
      `,
      )
      .eq('workspace_id', workspaceId);

    if (error) {
      // Fallback simple query
      const { data: members } = await this.supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);
      return (members as WorkspaceMember[]) || [];
    }

    return (data as unknown as WorkspaceMember[]) || [];
  }
}
