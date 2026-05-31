import { Router } from "express";
import gastos_controller from "../controllers/gastos.controller.js";
const router = Router();
router.get("", gastos_controller.getList);
router.get("/:id", gastos_controller.getById);
router.post("", gastos_controller.create);
router.delete("/:id", gastos_controller.delete);
router.patch("/:id", gastos_controller.update);
export default router;
