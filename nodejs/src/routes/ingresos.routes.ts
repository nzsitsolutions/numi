import { Router } from "express";
import ingresos_controller from "../controllers/ingresos.controller.js";
const router = Router();

router.get("", ingresos_controller.getList);
router.get("/:id", ingresos_controller.getById);
router.post("", ingresos_controller.create);
router.delete("/:id", ingresos_controller.delete);
router.patch("/:id", ingresos_controller.update);

export default router;