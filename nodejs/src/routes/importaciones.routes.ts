import { Router } from "express";
import multer from "multer";
import importacionesController from "../controllers/importaciones.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10_000_000 } });

router.get("/pendientes", importacionesController.getPendientes);
router.patch("/:id/confirmar", importacionesController.confirmar);
router.patch("/:id/descartar", importacionesController.descartar);

// NaranjaX (PDF)
router.post("/naranjax/upload", upload.single("archivo"), importacionesController.uploadNaranjaX);
router.post("/naranjax/drive-sync", importacionesController.syncDriveNaranjaX);

// BBVA (CSV)
router.post("/bbva/upload", upload.single("archivo"), importacionesController.uploadBbva);
router.post("/bbva/drive-sync", importacionesController.syncDriveBbva);

export default router;
