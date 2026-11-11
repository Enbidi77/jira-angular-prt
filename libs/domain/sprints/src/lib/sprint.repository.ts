import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';
import { Database } from '@jira-prt/platform/supabase-client';

export type Sprint = Database['public']['Tables']['sprints']['Row'];

@Injectable({
  providedIn: 'root',
})
export class SprintRepository {
  private supabase = inject(SupabaseClientService);

  async getSprintsByProject(projectId: string): Promise<Sprint[]> {
    const { data, error } = await this.supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getActiveSprint(projectId: string): Promise<Sprint | null> {
    const { data, error } = await this.supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async createSprint(
    projectId: string,
    name: string,
    goal?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Sprint> {
    // Get highest sequence number
    const { data: existing } = await this.supabase
      .from('sprints')
      .select('sequence')
      .eq('project_id', projectId)
      .order('sequence', { ascending: false })
      .limit(1);

    const nextSeq = (existing?.[0]?.sequence || 0) + 1;

    const { data, error } = await this.supabase
      .from('sprints')
      .insert({
        project_id: projectId,
        name,
        goal: goal || null,
        start_date: startDate || null,
        end_date: endDate || null,
        sequence: nextSeq,
        status: 'planned',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async startSprint(
    sprintId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('sprints')
      .update({
        status: 'active',
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || null,
      })
      .eq('id', sprintId);

    if (error) throw error;
  }

  async completeSprint(sprintId: string): Promise<void> {
    const { error } = await this.supabase
      .from('sprints')
      .update({
        status: 'completed',
      })
      .eq('id', sprintId);

    if (error) throw error;
  }
}
