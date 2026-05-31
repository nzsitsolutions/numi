import { Router } from 'express';
import gastosRouter from './gastos.routes.js';
import ingresosRouter from './ingresos.routes.js';
import tarjetasRouter from './tarjetas.routes.js';
import periodosRouter from './periodos.routes.js';
import deudasRouter from './deudas.routes.js';
import importacionesRouter from './importaciones.routes.js';

const router = Router();

router.use('/gastos', gastosRouter);
router.use('/ingresos', ingresosRouter);
router.use('/tarjetas', tarjetasRouter);
router.use('/periodos', periodosRouter);
router.use('/deudas', deudasRouter);
router.use('/importaciones', importacionesRouter);

export default router;