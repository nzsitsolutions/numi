import { Router } from "express";
import ingresos_controller from "../controllers/ingresos.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createIngresoSchema, updateIngresoSchema } from "../validators/ingresos.validator.js";

const router = Router();

router.get("/", ingresos_controller.getList);
router.get("/:id", ingresos_controller.getById);
router.post("/", validateBody(createIngresoSchema), ingresos_controller.create);
router.patch("/:id", validateBody(updateIngresoSchema), ingresos_controller.update);
router.delete("/:id", ingresos_controller.delete);

export default router;
