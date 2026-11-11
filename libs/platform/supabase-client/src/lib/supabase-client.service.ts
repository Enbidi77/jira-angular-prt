import { Injectable, signal } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  Session,
  User,
} from '@supabase/supabase-js';
import { Database } from './database.types';

@Injectable({
  providedIn: 'root',
})
export class SupabaseClientService {
  private client: SupabaseClient<Database>;
  readonly currentSession = signal<Session | null>(null);
  readonly currentUser = signal<User | null>(null);

  constructor() {
    const url =
      (typeof window !== 'undefined' &&
        (window as unknown as { env?: { SUPABASE_URL?: string } }).env
          ?.SUPABASE_URL) ||
      (typeof process !== 'undefined' && process.env?.['SUPABASE_URL']) ||
      'http://127.0.0.1:54321';

    const anonKey =
      (typeof window !== 'undefined' &&
        (window as unknown as { env?: { SUPABASE_ANON_KEY?: string } }).env
          ?.SUPABASE_ANON_KEY) ||
      (typeof process !== 'undefined' && process.env?.['SUPABASE_ANON_KEY']) ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM0NjYzMjN9.M1YxMDk1MjM4MA==';

    this.client = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    this.client.auth.getSession().then(({ data: { session } }) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });

    this.client.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  get instance(): SupabaseClient<Database> {
    return this.client;
  }

  get auth() {
    return this.client.auth;
  }

  get storage() {
    return this.client.storage;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel(name: string, opts?: any) {
    return this.client.channel(name, opts);
  }

  from<T extends keyof Database['public']['Tables']>(table: T) {
    return this.client.from(table);
  }

  rpc<T extends keyof Database['public']['Functions']>(
    fn: T,
    args?: Database['public']['Functions'][T]['Args'],
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.rpc(fn, args as any);
  }
}
