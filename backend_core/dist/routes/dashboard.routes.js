"use strict";
// src/routes/dashboard.routes.ts - REFACTORIZADO CON RUTAS DINÁMICAS
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controller/app/dashboard.controller");
const cierreInventario_controller_1 = require("../controller/cierreInventario.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = __importDefault(require("../middleware/upload.middleware"));
const reservations_controller_1 = require("../controller/auth/reservations.controller");
const mesas_controller_1 = require("../controller/app/mesas.controller");
const router = (0, express_1.Router)();
// ========== RUTAS EXISTENTES (SIN CAMBIOS) ==========
// --- Ruta de Subida de Imágenes ---
router.post('/upload-image', auth_middleware_1.validateToken, upload_middleware_1.default.single('image'), dashboard_controller_1.uploadImage);
// --- Ruta de Información General ---
router.get('/info', auth_middleware_1.validateToken, dashboard_controller_1.getDashboardInfo);
// --- Rutas de Productos del Menú (Platos/Bebidas) ---
router.get('/products', auth_middleware_1.validateToken, dashboard_controller_1.getProducts);
router.post('/products', auth_middleware_1.validateToken, dashboard_controller_1.createProduct);
router.get('/products/:id', auth_middleware_1.validateToken, dashboard_controller_1.getProductById);
router.put('/products/:id', auth_middleware_1.validateToken, dashboard_controller_1.updateProductDetails);
router.patch('/products/:id', auth_middleware_1.validateToken, dashboard_controller_1.updateProduct);
// --- Rutas de Categorías del Menú ---
router.post('/categories', auth_middleware_1.validateToken, dashboard_controller_1.createCategory);
router.get('/categories', auth_middleware_1.validateToken, dashboard_controller_1.getCategories);
// --- Rutas de Órdenes (Pedidos) ---
router.get('/ordenes', auth_middleware_1.validateToken, dashboard_controller_1.getOrdenes);
router.post('/ordenes', auth_middleware_1.validateToken, dashboard_controller_1.createOrden);
router.patch('/ordenes/:id/estado', auth_middleware_1.validateToken, dashboard_controller_1.updateOrdenEstado);
// --- Rutas de Mesas ---
router.get('/mesas-con-ordenes', auth_middleware_1.validateToken, dashboard_controller_1.getMesasConOrdenes);
router.get('/mesas', auth_middleware_1.validateToken, mesas_controller_1.mesasController.getAllMesas);
router.post('/mesas', auth_middleware_1.validateToken, mesas_controller_1.mesasController.createMesa);
router.patch('/mesas/:id', auth_middleware_1.validateToken, mesas_controller_1.mesasController.updateMesa);
router.delete('/mesas/:id', auth_middleware_1.validateToken, mesas_controller_1.mesasController.deleteMesa);
// --- Rutas de Reservas ---
router.get('/reservations', auth_middleware_1.validateToken, reservations_controller_1.reservationsController.getReservations);
router.patch('/reservations/:id/status', auth_middleware_1.validateToken, reservations_controller_1.reservationsController.updateReservationStatus);
// ========== ✨ NUEVAS RUTAS - INVENTARIO DINÁMICO ✨ ==========
// --- CATEGORÍAS DE INVENTARIO (Dinámicas) ---
router.get('/categorias-inventario', auth_middleware_1.validateToken, dashboard_controller_1.getCategoriasInventario);
router.post('/categorias-inventario', auth_middleware_1.validateToken, dashboard_controller_1.createCategoriaInventario);
router.put('/categorias-inventario/:id', auth_middleware_1.validateToken, dashboard_controller_1.updateCategoriaInventario);
// --- TIPOS DE GASTO (Dinámicos) ---
router.get('/tipos-gasto', auth_middleware_1.validateToken, dashboard_controller_1.getTiposGasto);
router.post('/tipos-gasto', auth_middleware_1.validateToken, dashboard_controller_1.createTipoGasto);
// --- UNIDADES DE MEDIDA (Dinámicas) ---
router.get('/unidades-medida', auth_middleware_1.validateToken, dashboard_controller_1.getUnidadesMedida);
router.post('/unidades-medida', auth_middleware_1.validateToken, dashboard_controller_1.createUnidadMedida);
// --- PRODUCTOS DE INVENTARIO (Antes "Insumos") ---
router.get('/productos-inventario', auth_middleware_1.validateToken, dashboard_controller_1.getProductosInventario);
router.post('/productos-inventario', auth_middleware_1.validateToken, dashboard_controller_1.createProductoInventario);
router.put('/productos-inventario/:id', auth_middleware_1.validateToken, dashboard_controller_1.updateProductoInventario);
// --- COMPRAS Y GASTOS ---
router.get('/gastos', auth_middleware_1.validateToken, dashboard_controller_1.getGastos);
router.get('/gastos/:id', auth_middleware_1.validateToken, dashboard_controller_1.getCompraById);
router.post('/gastos', auth_middleware_1.validateToken, dashboard_controller_1.createGasto);
router.post('/gastos/:id/recibir', auth_middleware_1.validateToken, dashboard_controller_1.receiveCompra);
// ========== 🗑️ RUTAS DEPRECATED (Mantener por compatibilidad) ==========
// Estas rutas antiguas redirigen a las nuevas funciones
// DEPRECADO: Usar /productos-inventario en su lugar
router.get('/insumos', auth_middleware_1.validateToken, dashboard_controller_1.getProductosInventario);
router.post('/insumos', auth_middleware_1.validateToken, dashboard_controller_1.createProductoInventario);
// DEPRECADO: Usar /gastos/:id/recibir en su lugar
router.post('/compras/:id/recibir', auth_middleware_1.validateToken, dashboard_controller_1.receiveCompra);
// ========== RUTAS DE CIERRE DE INVENTARIO (agregar después de las rutas existentes) ==========
// Listar cierres con filtros
router.get('/cierres-inventario', cierreInventario_controller_1.getCierresInventario);
// Obtener un cierre específico con detalles
router.get('/cierres-inventario/:id', cierreInventario_controller_1.getCierreById);
// Obtener estadísticas de un cierre
router.get('/cierres-inventario/:id/estadisticas', cierreInventario_controller_1.getCierreEstadisticas);
// Crear nuevo cierre (en estado Borrador)
router.post('/cierres-inventario', cierreInventario_controller_1.createCierreInventario);
// Actualizar cierre (solo si está en Borrador)
router.put('/cierres-inventario/:id', cierreInventario_controller_1.updateCierreInventario);
// Finalizar cierre (actualiza stock y cambia estado a Finalizado)
router.post('/cierres-inventario/:id/finalizar', cierreInventario_controller_1.finalizarCierre);
exports.default = router;
