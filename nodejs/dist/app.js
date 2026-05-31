import express from "express";
import { config } from "dotenv";
import cors from "cors";
import router from "./src/routes/index.js";
import { errorMiddleware } from "./src/middleware/error.middleware.js";
config();
const PORT = process.env.PORT ?? 3000;
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:4200",
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api", router);
app.get("/health", (_req, res) => { res.json({ ok: true }); });
app.use(errorMiddleware);
app.listen(PORT, () => {
    console.log(`server initialized at http://localhost:${PORT}`);
});
export default app;
