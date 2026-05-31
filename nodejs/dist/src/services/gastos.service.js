import supabase from "../config/supabase.js";
export default {
    getListAsync: () => {
        return supabase.from("gastos").select("*");
    },
    firstOrDefaultAsync: (id) => {
        return supabase.from("gastos").select("*").eq("id", id);
    },
    insertAsync: (data) => {
        return supabase.from("gastos").insert(data).select("*");
    },
    deleteAsync: (id) => {
        return supabase.from("gastos").delete().eq("id", id);
    },
    updateAsync: (id, data) => {
        return supabase.from("gastos").update(data).eq("id", id);
    }
};
