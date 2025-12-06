"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const caja_controller_1 = require("../controllers/caja.controller");
const gastos_controller_1 = require("../controllers/gastos.controller");
const finanzas_controller_1 = require("../controllers/finanzas.controller");
const nomina_controller_1 = require("../controllers/nomina.controller");
const cierre_pos_controller_1 = require("../controllers/cierre-pos.controller");
const auth_middleware_1 = require("@shared/middleware/auth.middleware");
const tenant_middleware_1 = require("@shared/middleware/tenant.middleware");
const verifyTenantAccess_1 = require("@shared/middleware/verifyTenantAccess");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.validateToken, tenant_middleware_1.tenantMiddleware, verifyTenantAccess_1.verifyTenantAccess);
// CAJA
router.get('/caja/estado', caja_controller_1.cajaController.getEstadoCaja);
router.post('/caja/abrir', caja_controller_1.cajaController.abrirCaja);
router.post('/caja/movimiento', caja_controller_1.cajaController.registrarMovimiento);
router.post('/caja/cerrar', caja_controller_1.cajaController.cerrarCaja);
router.get('/caja/historial', caja_controller_1.cajaController.getHistorial);
// GASTOS
router.get('/gastos-operativos', gastos_controller_1.gastosController.getAll);
router.get('/gastos-operativos/:id', gastos_controller_1.gastosController.getById);
router.post('/gastos-operativos', gastos_controller_1.gastosController.create);
router.put('/gastos-operativos/:id', gastos_controller_1.gastosController.update);
router.delete('/gastos-operativos/:id', gastos_controller_1.gastosController.delete);
router.get('/gastos-operativos/estadisticas/resumen', gastos_controller_1.gastosController.getEstadisticas);
// FINANZAS
router.get('/finanzas/resumen', finanzas_controller_1.finanzasController.getResumenFinanciero);
// NÓMINA
router.get('/nomina', nomina_controller_1.nominaController.getNomina);
router.get('/nomina/estadisticas', nomina_controller_1.nominaController.getEstadisticasNomina);
router.get('/nomina/calcular/:id', nomina_controller_1.nominaController.calcularPagoEmpleado);
// CIERRE POS (Aunque es de órdenes, afecta caja)
router.patch('/ordenes/:id/cierre', cierre_pos_controller_1.cierrePosController.closeOrder);
exports.default = router;
