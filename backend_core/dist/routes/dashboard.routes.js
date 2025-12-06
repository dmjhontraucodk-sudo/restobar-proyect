"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/dashboard.routes.ts - VERSIÓN COMPLETA CON CONFIGURACIÓN
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = __importDefault(require("../middleware/upload.middleware"));
const overview_controller_1 = require("../controller/app/overview.controller");
const dashboard_controller_1 = require("../controller/app/dashboard.controller");
const cierreInventario_controller_1 = require("../controller/cierreInventario.controller");
const gastos_controller_1 = require("../controller/gastos.controller");
// ✅ IMPORTACIÓN CORREGIDA: CONTROLADOR DE CAJA (NUEVO SISTEMA)
const caja_controller_1 = require("../controller/app/caja.controller");
const finanzas_controller_1 = require("../controller/app/finanzas.controller");
const reservations_controller_1 = require("@modules/reservations/controllers/reservations.controller");
const mesas_controller_1 = require("@modules/tables/controllers/mesas.controller");
const cocina_controller_1 = require("../controller/app/cocina.controller");
const empleados_controller_1 = require("@modules/employees/controllers/empleados.controller");
const roles_controller_1 = require("@modules/employees/controllers/roles.controller");
const nomina_controller_1 = require("../controller/app/nomina.controller");
const inventory_controller_1 = require("../controller/inventory.controller");
const cron_controller_1 = require("../controller/cron.controller");
const cierre_pos_controller_1 = require("../controller/app/cierre-pos.controller");
// ✅ IMPORTAMOS EL CONTROLADOR CORRECTO (El que tiene la lógica de Inventario y Caja)
const web_orders_controller_1 = require("../controller/web-orders.controller");
// 📊 IMPORTAMOS EL NUEVO CONTROLADOR DE REPORTES
const reports_controller_1 = require("../controller/app/reports.controller");
// ⚙️ IMPORTAMOS EL CONTROLADOR DE CONFIGURACIÓN (NUEVO)
const tenant_config_controller_1 = require("../controller/app/tenant-config.controller");
const router = (0, express_1.Router)();
// ========== 📊 DASHBOARD GENERAL ==========
router.get('/info', auth_middleware_1.validateToken, dashboard_controller_1.getDashboardInfo);
router.get('/overview', auth_middleware_1.validateToken, overview_controller_1.getOverviewData);
// --- Subida de Imágenes ---
router.post('/upload-image', auth_middleware_1.validateToken, upload_middleware_1.default.single('image'), dashboard_controller_1.uploadImage);
// ========== 🍔 MENÚ Y PRODUCTOS ==========
router.get('/products', auth_middleware_1.validateToken, dashboard_controller_1.getProducts);
router.post('/products', auth_middleware_1.validateToken, dashboard_controller_1.createProduct);
router.get('/products/:id', auth_middleware_1.validateToken, dashboard_controller_1.getProductById);
router.put('/products/:id', auth_middleware_1.validateToken, dashboard_controller_1.updateProductDetails);
router.patch('/products/:id', auth_middleware_1.validateToken, dashboard_controller_1.updateProduct);
router.post('/categories', auth_middleware_1.validateToken, dashboard_controller_1.createCategory);
router.get('/categories', auth_middleware_1.validateToken, dashboard_controller_1.getCategories);
// ========== 🍽️ RESTAURANTE (Mesas, Órdenes, Cocina) ==========
router.get('/ordenes', auth_middleware_1.validateToken, dashboard_controller_1.getOrdenes);
router.post('/ordenes', auth_middleware_1.validateToken, dashboard_controller_1.createOrden);
router.patch('/ordenes/:id/estado', auth_middleware_1.validateToken, dashboard_controller_1.updateOrdenEstado);
router.patch('/ordenes/:id/cierre', auth_middleware_1.validateToken, cierre_pos_controller_1.cierrePosController.closeOrder);
router.post('/ordenes/:id/items', auth_middleware_1.validateToken, dashboard_controller_1.addItemsToOrden);
// ========== ✨ PEDIDOS WEB CON AUTO-REGISTRO EN CAJA ✨ ==========
// Estas rutas ahora usan webOrdersController que registra automáticamente en caja
router.get('/web-ready-orders', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.getWebOrders);
router.patch('/web-ready-orders/:id/status', auth_middleware_1.validateToken, web_orders_controller_1.webOrdersController.updateOrderStatus);
// ========== ⚙️ CONFIGURACIÓN GENERAL DEL TENANT (NUEVO) ==========
router.get('/config', auth_middleware_1.validateToken, tenant_config_controller_1.tenantConfigController.getConfig);
router.put('/config', auth_middleware_1.validateToken, tenant_config_controller_1.tenantConfigController.updateConfig);
router.put('/config/:section', auth_middleware_1.validateToken, tenant_config_controller_1.tenantConfigController.updateSection);
router.post('/config/reset', auth_middleware_1.validateToken, tenant_config_controller_1.tenantConfigController.resetConfig);
router.get('/cocina/pedidos', auth_middleware_1.validateToken, cocina_controller_1.cocinaController.getPedidosCocina);
router.patch('/cocina/pedidos/:id/estado', auth_middleware_1.validateToken, cocina_controller_1.cocinaController.updateEstadoPedido);
router.get('/mesas-con-ordenes', auth_middleware_1.validateToken, dashboard_controller_1.getMesasConOrdenes);
router.get('/mesas', auth_middleware_1.validateToken, mesas_controller_1.mesasController.getAllMesas);
router.post('/mesas', auth_middleware_1.validateToken, mesas_controller_1.mesasController.createMesa);
router.patch('/mesas/:id', auth_middleware_1.validateToken, mesas_controller_1.mesasController.updateMesa);
router.delete('/mesas/:id', auth_middleware_1.validateToken, mesas_controller_1.mesasController.deleteMesa);
router.get('/reservations', auth_middleware_1.validateToken, reservations_controller_1.reservationsController.getReservations);
router.patch('/reservations/:id/status', auth_middleware_1.validateToken, reservations_controller_1.reservationsController.updateReservationStatus);
// ========== 📦 INVENTARIO ==========
router.get('/categorias-inventario', auth_middleware_1.validateToken, dashboard_controller_1.getCategoriasInventario);
router.post('/categorias-inventario', auth_middleware_1.validateToken, dashboard_controller_1.createCategoriaInventario);
router.put('/categorias-inventario/:id', auth_middleware_1.validateToken, dashboard_controller_1.updateCategoriaInventario);
router.get('/tipos-gasto', auth_middleware_1.validateToken, dashboard_controller_1.getTiposGasto);
router.post('/tipos-gasto', auth_middleware_1.validateToken, dashboard_controller_1.createTipoGasto);
router.get('/unidades-medida', auth_middleware_1.validateToken, dashboard_controller_1.getUnidadesMedida);
router.post('/unidades-medida', auth_middleware_1.validateToken, dashboard_controller_1.createUnidadMedida);
router.get('/productos-inventario', auth_middleware_1.validateToken, dashboard_controller_1.getProductosInventario);
router.post('/productos-inventario', auth_middleware_1.validateToken, dashboard_controller_1.createProductoInventario);
router.put('/productos-inventario/:id', auth_middleware_1.validateToken, dashboard_controller_1.updateProductoInventario);
router.get('/kardex', auth_middleware_1.validateToken, dashboard_controller_1.getKardexReport);
// ========== 💰 FINANZAS Y CAJA (SISTEMA AUTOMATIZADO) ==========
// ✅ Usando el nuevo cajaController con todas las mejoras
router.post('/caja/abrir', auth_middleware_1.validateToken, caja_controller_1.cajaController.abrirCaja);
router.get('/caja/estado', auth_middleware_1.validateToken, caja_controller_1.cajaController.getEstadoCaja);
router.post('/caja/movimiento', auth_middleware_1.validateToken, caja_controller_1.cajaController.registrarMovimiento);
router.post('/caja/cerrar', auth_middleware_1.validateToken, caja_controller_1.cajaController.cerrarCaja);
router.get('/caja/historial', auth_middleware_1.validateToken, caja_controller_1.cajaController.getHistorial);
router.get('/finanzas/resumen', auth_middleware_1.validateToken, finanzas_controller_1.getResumenFinanciero);
// ========== 🚚 COMPRAS (Entradas Kardex) ==========
router.get('/compras', auth_middleware_1.validateToken, dashboard_controller_1.getGastos);
router.get('/compras/:id', auth_middleware_1.validateToken, dashboard_controller_1.getCompraById);
router.post('/compras', auth_middleware_1.validateToken, dashboard_controller_1.createGasto);
router.post('/compras/:id/recibir', auth_middleware_1.validateToken, dashboard_controller_1.receiveCompra); // Actualiza Kardex y Costo
// ========== 💸 GASTOS OPERATIVOS (Salidas Caja/Banco) ==========
router.get('/gastos-operativos', auth_middleware_1.validateToken, gastos_controller_1.getGastos);
router.get('/gastos-operativos/:id', auth_middleware_1.validateToken, gastos_controller_1.getGastoById);
router.post('/gastos-operativos', auth_middleware_1.validateToken, gastos_controller_1.createGasto);
router.put('/gastos-operativos/:id', auth_middleware_1.validateToken, gastos_controller_1.updateGasto);
router.delete('/gastos-operativos/:id', auth_middleware_1.validateToken, gastos_controller_1.deleteGasto);
router.get('/gastos-operativos/estadisticas/resumen', auth_middleware_1.validateToken, gastos_controller_1.getGastosEstadisticas);
// ========== 📋 CIERRE DE INVENTARIO (Ajustes Stock) ==========
router.get('/cierres-inventario', auth_middleware_1.validateToken, cierreInventario_controller_1.getCierresInventario);
router.get('/cierres-inventario/:id', auth_middleware_1.validateToken, cierreInventario_controller_1.getCierreById);
router.get('/cierres-inventario/:id/estadisticas', auth_middleware_1.validateToken, cierreInventario_controller_1.getCierreEstadisticas);
router.post('/cierres-inventario', auth_middleware_1.validateToken, cierreInventario_controller_1.createCierreInventario);
router.put('/cierres-inventario/:id', auth_middleware_1.validateToken, cierreInventario_controller_1.updateCierreInventario);
router.post('/cierres-inventario/:id/finalizar', auth_middleware_1.validateToken, cierreInventario_controller_1.finalizarCierre);
// ========== 📈 RUTAS DE REPORTES (NUEVO MÓDULO) ==========
router.get('/reports/sales/summary', auth_middleware_1.validateToken, reports_controller_1.reportsController.getSalesSummary);
router.get('/reports/inventory/summary', auth_middleware_1.validateToken, reports_controller_1.reportsController.getInventorySummary);
router.get('/reports/finance/summary', auth_middleware_1.validateToken, reports_controller_1.reportsController.getFinanceSummary);
// ========== 👥 EQUIPO Y RRHH ==========
router.get('/empleados', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.getAllEmpleados);
router.get('/empleados/con-acceso', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.getEmpleadosConAcceso);
router.get('/roles', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.getRoles);
router.get('/empleados/:id', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.getEmpleadoById);
router.post('/empleados', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.createEmpleado);
router.patch('/empleados/:id', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.updateEmpleado);
router.delete('/empleados/:id', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.desactivarEmpleado);
router.post('/empleados/:id/activar', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.activarEmpleado);
router.post('/empleados/:id/resetear-password', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.resetearPassword);
router.post('/empleados/incidencias', auth_middleware_1.validateToken, empleados_controller_1.empleadosController.registrarIncidencia);
// ========== 🛡️ ROLES Y PERMISOS ==========
router.get('/roles/todos', auth_middleware_1.validateToken, roles_controller_1.rolesController.getAllRoles);
router.post('/roles/crear', auth_middleware_1.validateToken, roles_controller_1.rolesController.createRol);
router.patch('/roles/:id', auth_middleware_1.validateToken, roles_controller_1.rolesController.updateRol);
router.delete('/roles/:id', auth_middleware_1.validateToken, roles_controller_1.rolesController.desactivarRol);
router.post('/roles/:id/activar', auth_middleware_1.validateToken, roles_controller_1.rolesController.activarRol);
// ========== 💵 NÓMINA ==========
router.get('/nomina', auth_middleware_1.validateToken, nomina_controller_1.nominaController.getNomina);
router.get('/nomina/estadisticas', auth_middleware_1.validateToken, nomina_controller_1.nominaController.getEstadisticasNomina);
router.get('/nomina/calcular/:id', auth_middleware_1.validateToken, nomina_controller_1.calcularPagoEmpleado);
// ========== 📦 ALERTAS DE INVENTARIO ==========
router.get('/inventory/stock-bajo', auth_middleware_1.validateToken, inventory_controller_1.inventoryController.verificarStockBajo);
router.get('/inventory/stock-critico', auth_middleware_1.validateToken, inventory_controller_1.inventoryController.getProductosStockCritico);
router.post('/inventory/verificar-disponibilidad', auth_middleware_1.validateToken, inventory_controller_1.inventoryController.verificarDisponibilidad);
router.patch('/inventory/:producto_inventario_id/stock', auth_middleware_1.validateToken, inventory_controller_1.inventoryController.actualizarStock);
// ========== 📅 CRON JOBS - TESTING MANUAL ==========
router.post('/cron/resumen-diario', auth_middleware_1.validateToken, cron_controller_1.cronController.ejecutarResumenDiario);
router.post('/cron/verificar-stock', auth_middleware_1.validateToken, cron_controller_1.cronController.verificarStockBajoManual);
router.get('/cron/estado', auth_middleware_1.validateToken, cron_controller_1.cronController.getEstadoCronJobs);
exports.default = router;
