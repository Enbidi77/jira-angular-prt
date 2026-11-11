import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';
import { Database } from '@jira-prt/platform/supabase-client';

export type Profile = Database['public']['Tables']['profiles']['Row'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseClientService);
  private router = inject(Router);

  readonly user = this.supabase.currentUser;
  readonly session = this.supabase.currentSession;
  readonly profile = signal<Profile | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isAuthenticated = computed(() => !!this.user());

  constructor() {
    // Watch for user changes and load profile
    this.supabase.instance.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this.profile.set(null);
      }
      this.isLoading.set(false);
    });

    // Check initial user
    const currentUser = this.supabase.currentUser();
    if (currentUser) {
      this.loadProfile(currentUser.id).finally(() => this.isLoading.set(false));
    } else {
      this.isLoading.set(false);
    }
  }

  async loadProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // In local or offline dev if profile isn't yet inserted, return fallback
        const u = this.user();
        if (u) {
          const fallbackProfile: Profile = {
            id: u.id,
            email: u.email ?? 'user@example.com',
            full_name:
              (u.user_metadata?.['full_name'] as string) ??
              u.email?.split('@')[0] ??
              'User',
            avatar_url: (u.user_metadata?.['avatar_url'] as string) ?? null,
            job_title: 'Software Engineer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.profile.set(fallbackProfile);
          return fallbackProfile;
        }
        return null;
      }

      this.profile.set(data);
      return data;
    } catch {
      return null;
    }
  }

  async signUp(email: string, password: string, fullName: string) {
    this.isLoading.set(true);
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    this.isLoading.set(false);
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    this.isLoading.set(true);
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    this.isLoading.set(false);
    if (error) throw error;
    if (data.user) {
      await this.loadProfile(data.user.id);
    }
    return data;
  }

  async signOut() {
    this.isLoading.set(true);
    await this.supabase.auth.signOut();
    this.profile.set(null);
    this.isLoading.set(false);
    await this.router.navigate(['/login']);
  }

  async updateProfile(updates: Partial<Profile>) {
    const user = this.user();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    this.profile.set(data);
    return data;
  }
}
