import { Router } from "express";
import deudasController from "../controllers/deudas.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createDeudaSchema, updateDeudaSchema } from "../validators/deudas.validator.js";

const router = Router();

router.get("/", deudasController.getList);
router.get("/:id", deudasController.getById);
router.post("/", validateBody(createDeudaSchema), deudasController.create);
router.patch("/:id", validateBody(updateDeudaSchema), deudasController.update);
router.patch("/:id/pagar-cuota", deudasController.pagarCuota);
router.delete("/:id", deudasController.delete);

export default router;
