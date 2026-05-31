import { Router } from 'express';
import gastosController from '../controllers/gastos.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
// import { createGastoSchema, updateGastoSchema } from '../validators/gastos.validator'

const router = Router();

router.get('/', gastosController.getList);
router.get('/:id', gastosController.getById);
router.post('/', gastosController.create);
router.patch('/:id', gastosController.update);
router.delete('/:id', gastosController.delete);
router.post('/:id/pagar-cuota', gastosController.pagarCuota);

export default router;