import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { errorMiddleware } from "./src/middleware/error.middleware.js";

config();

const PORT = Number(process.env.PORT ?? 3000);
const app = express();

const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
    },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (_req, res) => {
    res.json({ ok: true, port: PORT });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[startup] listening on 0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV ?? "unset"})`);
    console.log(`[startup] allowed origins: ${allowedOrigins.join(", ")}`);
});

process.on("uncaughtException", (err) => {
    console.error("[fatal] uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
    console.error("[fatal] unhandledRejection:", reason);
});

import("./src/routes/index.js")
    .then(({ default: router }) => {
        app.use("/api", router);
        app.use(errorMiddleware);
        console.log("[startup] API routes mounted");
    })
    .catch((err) => {
        console.error("[startup] failed to load API routes:", err);
    });

export default app;
