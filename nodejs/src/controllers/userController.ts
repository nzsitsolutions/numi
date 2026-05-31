import { Router } from "express";
import supabase from "../../lib/supabase.js";
const router = Router();

router.get("", async (req, res) => {
    const { data, error } = await supabase.auth.admin.listUsers();

    if(error) return res.status(500).json(error);

    res.status(200).json(data.users);
});

export default router;