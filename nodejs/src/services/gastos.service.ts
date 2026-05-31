import supabase from "../../lib/supabase.js";

export default {
    getListAsync: () => {
        return supabase.from("gastos").select("*");
    },
    firstOrDefaultAsync: (id: string) => {
        return supabase.from("gastos").select("*").eq("id", id);
    },
    insertAsync: (data: any) => {
        return supabase.from("gastos").insert(data).select("*");
    },
    deleteAsync: (id: string) => {
        return supabase.from("gastos").delete().eq("id", id);
    },
    updateAsync: (id: string, data: any) => {
        return supabase.from("gastos").update(data).eq("id", id);
    }
}