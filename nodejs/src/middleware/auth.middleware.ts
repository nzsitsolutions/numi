import { Request, Response, NextFunction } from "express";
import { createAdminSupabase, createUserSupabase, runWithSupabase } from "../config/supabase.js";

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Iniciá sesión para continuar" });
    }

    const token = header.slice(7).trim();
    if (!token) {
        return res.status(401).json({ message: "Token inválido" });
    }

    const admin = createAdminSupabase();
    const { data: { user }, error } = await admin.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ message: "Sesión expirada o inválida" });
    }

    req.userId = user.id;
    req.userEmail = user.email ?? undefined;

    const userDb = createUserSupabase(token);

    runWithSupabase(userDb, () => {
        next();
    });
}
