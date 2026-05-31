import { Router } from "express";
import supabase from "../../lib/supabase.js";

const router = Router();

router.get("", async (req, res) => {
    try {
        const { data, error } = await supabase.from('auth.users').select("*");
        console.log("data", data);
        console.error("error", error);
        res.json(data);
    } catch (e) {
        res.status(500).send('not working');
    }
});

export default router;