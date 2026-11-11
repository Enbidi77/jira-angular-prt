import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';
import { AuthService } from '@jira-prt/platform/authentication';
import { Database } from '@jira-prt/platform/supabase-client';

export type NotificationItem =
  Database['public']['Tables']['notifications']['Row'];

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private supabase = inject(SupabaseClientService);
  private auth = inject(AuthService);

  readonly notifications = signal<NotificationItem[]>([]);
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.is_read).length,
  );
  readonly isLoading = signal<boolean>(false);

  private unsubscribeRealtime?: () => void;

  constructor() {
    // When user changes, refresh notifications
    const user = this.auth.user();
    if (user) {
      this.initUser(user.id);
    }
  }

  async initUser(userId: string) {
    await this.fetchNotifications(userId);
    this.setupRealtime(userId);
  }

  async fetchNotifications(userId: string) {
    this.isLoading.set(true);
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    this.isLoading.set(false);
    if (!error && data) {
      this.notifications.set(data);
    }
  }

  private setupRealtime(userId: string) {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
    }

    const channel = this.supabase
      .channel(`user-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newItem = payload.new as NotificationItem;
          this.notifications.update((list) => [newItem, ...list]);
        },
      )
      .subscribe();

    this.unsubscribeRealtime = () => channel.unsubscribe();
  }

  async markAsRead(id: string) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      this.notifications.update((list) =>
        list.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    }
  }

  async markAllAsRead() {
    const user = this.auth.user();
    if (!user) return;

    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      this.notifications.update((list) =>
        list.map((n) => ({ ...n, is_read: true })),
      );
    }
  }
}
