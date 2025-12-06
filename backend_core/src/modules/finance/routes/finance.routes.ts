import { Router } from 'express';
import { cajaController } from '../controllers/caja.controller';
import { gastosController } from '../controllers/gastos.controller';
import { finanzasController } from '../controllers/finanzas.controller';
import { nominaController } from '../controllers/nomina.controller';
import { validateToken } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { verifyTenantAccess } from '@shared/middleware/verifyTenantAccess';

const router = Router();

router.use(validateToken, tenantMiddleware, verifyTenantAccess);

// CAJA
router.get('/caja/estado', cajaController.getEstadoCaja);
router.post('/caja/abrir', cajaController.abrirCaja);
router.post('/caja/movimiento', cajaController.registrarMovimiento);
router.post('/caja/cerrar', cajaController.cerrarCaja);
router.get('/caja/historial', cajaController.getHistorial);

// GASTOS
router.get('/gastos-operativos', gastosController.getAll);
router.get('/gastos-operativos/:id', gastosController.getById);
router.post('/gastos-operativos', gastosController.create);
router.put('/gastos-operativos/:id', gastosController.update);
router.delete('/gastos-operativos/:id', gastosController.delete);
router.get('/gastos-operativos/estadisticas/resumen', gastosController.getEstadisticas);

// FINANZAS
router.get('/finanzas/resumen', finanzasController.getResumenFinanciero);

// NÓMINA
router.get('/nomina', nominaController.getNomina);
router.get('/nomina/estadisticas', nominaController.getEstadisticasNomina);
router.get('/nomina/calcular/:id', nominaController.calcularPagoEmpleado);
router.post('/nomina/pagar/:id', nominaController.pagarNomina);

// CIERRE POS (Aunque es de órdenes, afecta caja)


export default router;
