import express from "express";
import { config } from "dotenv";
import ingresos_routes from "./src/routes/ingresos.routes.js";
import gastos_routes from "./src/routes/gastos.routes.js";
import cors from "cors";
config();

const PORT = process.env.PORT;
const baseUrl = process.env.BASE_URL;
const app = express();

app.listen(PORT, () => {
    console.log(`server initialized at http://localhost:${PORT}`);
})

app.use(cors({
    origin: "http://localhost:4200"
}))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(`${baseUrl}/ingreso`, ingresos_routes);
app.use(`${baseUrl}/gasto`, gastos_routes);
