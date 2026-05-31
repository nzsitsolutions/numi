import express from "express";
import { config } from "dotenv";
config();

const PORT = process.env.PORT;
const app = express();

app.listen(PORT, () => {
    console.log(`server initialized at port ${PORT}`);
})