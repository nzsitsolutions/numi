import express from "express";
import { config } from "dotenv";
import cors from "cors";
config();

const PORT = process.env.PORT;
const app = express();

app.listen(PORT, () => {
    console.log(`server initialized at http://localhost:${PORT}`);
})

app.use(cors({
    origin: "http://localhost:4200"
}))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    res.send("hello world!");
})