import supabase from "../config/supabase.js";
export default {
    getListAsync: () => {
        return supabase.from("ingresos").select("*");
    },
    firstOrDefaultAsync: (id) => {
        return supabase.from("ingresos").select("*").eq("id", id);
    },
    insertAsync: (data) => {
        return supabase.from("ingresos").insert(data).select("*");
    },
    deleteAsync: (id) => {
        return supabase.from("ingresos").delete().eq("id", id);
    },
    updateAsync: (id, data) => {
        return supabase.from("ingresos").update(data).eq("id", id);
    }
};
