import { Router } from "express";
import importacionesController from "../controllers/importaciones.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { confirmarMovimientoSchema } from "../validators/deudas.validator.js";

const router = Router();

// Flujo de revisión de movimientos importados
router.get("/pendientes", importacionesController.getPendientes);
router.patch("/:id/confirmar", validateBody(confirmarMovimientoSchema), importacionesController.confirmar);
router.patch("/:id/descartar", importacionesController.descartar);

// Pendientes de implementar (parser PDF / Drive / MercadoPago)
router.post("/naranjax/upload", importacionesController.uploadNaranjaX);
router.post("/naranjax/drive-sync", importacionesController.syncDriveNaranjaX);
router.post("/mercadopago/sync", importacionesController.syncMercadoPago);

export default router;
