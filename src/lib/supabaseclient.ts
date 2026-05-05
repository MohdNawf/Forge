import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";

export function useSupabase() {
  const { getToken } = useAuth();
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ?? "https://zwladcsskgiplaqmyzpu.supabase.co";
  const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_nAPwud79j_MtMsBcDneZvQ_A47txl38";

  const supabase = useMemo(
    () =>
      createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options: RequestInit = {}) => {
          let token: string | null = null;
          try {
            token = await getToken({ template: "supabase" });
          } catch {
            token = null;
          }
          const headers = new Headers(options.headers ?? {});
          headers.set("apikey", supabaseAnonKey);

          // Only attach Clerk JWT when template is configured and returns a JWT.
          if (token && token.split(".").length === 3) {
            headers.set("Authorization", `Bearer ${token}`);
          }

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }),
    [getToken, supabaseAnonKey, supabaseUrl]
  );

  return supabase;
}