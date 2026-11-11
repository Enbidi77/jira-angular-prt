import { Injectable, inject, signal } from '@angular/core';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Subject, Observable } from 'rxjs';

export interface PresenceUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  onlineAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private supabase = inject(SupabaseClientService);
  private channels = new Map<string, RealtimeChannel>();
  readonly activeCollaborators = signal<PresenceUser[]>([]);

  /**
   * Subscribe to database changes on a specific project's issues
   */
  subscribeToProjectIssues(
    projectId: string,
    onIssueChange: (payload: {
      eventType: string;
      new: unknown;
      old: unknown;
    }) => void,
  ): () => void {
    const channelName = `project-issues:${projectId}`;

    // Clean up existing channel if already registered
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          onIssueChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        },
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Join presence room for a project board or issue view
   */
  joinPresence(
    roomId: string,
    user: { id: string; name: string; avatarUrl?: string },
  ): () => void {
    const channelName = `presence:${roomId}`;
    const channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as unknown as { user: PresenceUser }[];
          if (presences && presences.length > 0 && presences[0].user) {
            users.push(presences[0].user);
          }
        }
        this.activeCollaborators.set(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user: {
              userId: user.id,
              userName: user.name,
              avatarUrl: user.avatarUrl,
              onlineAt: new Date().toISOString(),
            },
          });
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.untrack().then(() => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      });
    };
  }

  unsubscribeAll() {
    for (const [, channel] of this.channels) {
      channel.unsubscribe();
    }
    this.channels.clear();
  }
}
