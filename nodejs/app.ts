import express from "express";
import { config } from "dotenv";
import cors from "cors";
import router from "./src/routes/index.js";
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
        // Postman, curl, server-side fetch (sin Origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origen no permitido (${origin})`));
    },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", router);

app.get("/health", (_req, res) => { res.json({ ok: true }); });

app.use(errorMiddleware);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`server listening on 0.0.0.0:${PORT} (allowed origins: ${allowedOrigins.join(", ")})`);
});

export default app;
