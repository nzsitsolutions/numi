import supabase from "../../lib/supabase.js";

export default {
    getListAsync: () => {
        return supabase.from("ingresos").select("*");
    },
    firstOrDefaultAsync: (id: string) => {
        return supabase.from("ingresos").select("*").eq("id", id);
    },
    insertAsync: (data: any) => {
        return supabase.from("ingresos").insert(data).select("*");
    },
    deleteAsync: (id: string) => {
        return supabase.from("ingresos").delete().eq("id", id);
    },
    updateAsync: (id: string, data: any) => {
        return supabase.from("ingresos").update(data).eq("id", id);
    }
}