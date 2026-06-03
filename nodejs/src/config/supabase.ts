import { AsyncLocalStorage } from "node:async_hooks";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const requestClient = new AsyncLocalStorage<SupabaseClient>();

/** Cliente con JWT del usuario: respeta RLS en Postgres. */
export function createUserSupabase(accessToken: string): SupabaseClient {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
}

/** Solo para validar tokens (auth.getUser). */
export function createAdminSupabase(): SupabaseClient {
    return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export function runWithSupabase<T>(client: SupabaseClient, fn: () => T): T {
    return requestClient.run(client, fn);
}

export function getSupabase(): SupabaseClient {
    const client = requestClient.getStore();
    if (!client) {
        throw new Error("Cliente Supabase no disponible (falta autenticación)");
    }
    return client;
}
