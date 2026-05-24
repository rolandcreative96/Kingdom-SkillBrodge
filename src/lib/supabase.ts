import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== 'undefined';
let cached: SupabaseClient | null = null;

function makeMockClient(): any {
  return new Proxy({} as SupabaseClient, {
    get(_, prop: string) {
      if (prop === 'then') return undefined;
      return (...args: any[]) => {
        const key = args[0];
        if (prop === 'from') {
          return new Proxy({} as any, {
            get(__, subprop: string) {
              return (...subargs: any[]) => {
                if (subprop === 'select') {
                  return new Proxy({} as any, {
                    get(___, p: string) {
                      return (...a: any[]) => {
                        if (p === 'single' || p === 'maybeSingle') return Promise.resolve({ data: null, error: null });
                        if (p === 'order') return Promise.resolve({ data: [], error: null });
                        if (p === 'range') return Promise.resolve({ data: [], error: null, count: 0 });
                        return Promise.resolve({ data: [], error: null });
                      };
                    },
                  });
                }
                return Promise.resolve({ data: null, error: null });
              };
            },
          });
        }
        if (prop === 'auth') {
          return {
            getUser: async () => ({ data: { user: null }, error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            signInWithPassword: async () => ({ data: null, error: { message: 'Not configured' } }),
            signOut: async () => {},
            resetPasswordForEmail: async () => ({ data: null, error: null }),
            verifyOtp: async () => ({ data: null, error: { message: 'Not configured' } }),
            signInWithOtp: async () => ({ data: null, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          };
        }
        if (prop === 'rpc') return async () => ({ data: null, error: null });
        return Promise.resolve({ data: null, error: null });
      };
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your_supabase_url_here') {
    if (!isBrowser) {
      return makeMockClient();
    }
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL in .env.local');
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
