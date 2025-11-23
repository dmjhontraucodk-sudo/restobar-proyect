// src/routes/dashboard.routes.ts - VERSIÓN FINAL CON FINANZAS

import { Router } from 'express';
import { validateToken } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware'; 
  
import { getOverviewData } from '../controller/app/overview.controller';
import { 
  // Funciones existentes
  getDashboardInfo, 
  getProducts, 
  createProduct, 
  createCategory, 
  updateProduct,
  getCategories,
  getProductById,
  updateProductDetails,
  uploadImage,
  getOrdenes,
  createOrden,
  updateOrdenEstado,
  getMesasConOrdenes,
  addItemsToOrden,
  
  // ✨ CATEGORÍAS DE INVENTARIO
  getCategoriasInventario,
  createCategoriaInventario,
  updateCategoriaInventario,
  
  // ✨ TIPOS DE GASTO
  getTiposGasto,
  createTipoGasto,
  
  // ✨ UNIDADES DE MEDIDA
  getUnidadesMedida,
  createUnidadMedida,
  
  // ✨ PRODUCTOS DE INVENTARIO
  getProductosInventario,
  createProductoInventario,
  updateProductoInventario,
  getKardexReport,
  
  // ✨ COMPRAS (Con inventario)
  getGastos,
  createGasto,
  receiveCompra,
  getCompraById,
 
} from '../controller/app/dashboard.controller';

import {
  getCierresInventario, getCierreById, createCierreInventario,
  updateCierreInventario, finalizarCierre, getCierreEstadisticas,
} from '../controller/cierreInventario.controller';

import {
  getGastos as getGastosOperativos,
  getGastoById as getGastoOperativoById,
  createGasto as createGastoOperativo,
  updateGasto as updateGastoOperativo,
  deleteGasto as deleteGastoOperativo,
  getGastosEstadisticas,
} from '../controller/gastos.controller';

// ✨ IMPORTACIÓN NUEVA: CONTROLADOR DE CAJA
import {
  abrirCaja,
  getEstadoCaja,
  registrarMovimientoCaja,
  cerrarCaja,
  getHistorialCajas
} from '../controller/app/caja.controller';

import { getResumenFinanciero } from '../controller/app/finanzas.controller';

import { reservationsController } from '../controller/auth/reservations.controller';
import { mesasController } from '../controller/app/mesas.controller';
import { cocinaController } from '../controller/app/cocina.controller';
import { empleadosController } from '../controller/app/empleados.controller';
import { rolesController } from '../controller/app/roles.controller';
import { nominaController, calcularPagoEmpleado } from '../controller/app/nomina.controller';

import { cierrePosController } from '../controller/app/cierre-pos.controller';
// ✨ NUEVA IMPORTACIÓN: Tu nuevo controlador de Pedidos Web Listos
import { webReadyOrdersController } from '../controller/app/web-ready-orders.controller';
const router = Router();

// ========== 🖼️ IMÁGENES ==========
router.post('/upload-image', validateToken, upload.single('image'), uploadImage);

// ========== 📊 DASHBOARD GENERAL ==========
router.get('/info', validateToken, getDashboardInfo);
// --- Subida de Imágenes ---
router.post('/upload-image',
  validateToken,
  upload.single('image'),
  uploadImage
);

router.get('/overview', validateToken, getOverviewData);

// ========== 🍔 MENÚ Y PRODUCTOS ==========
router.get('/products', validateToken, getProducts);
router.post('/products', validateToken, createProduct);
router.get('/products/:id', validateToken, getProductById);
router.put('/products/:id', validateToken, updateProductDetails);
router.patch('/products/:id', validateToken, updateProduct);
router.post('/categories', validateToken, createCategory);
router.get('/categories', validateToken, getCategories);

// ========== 🍽️ RESTAURANTE (Mesas, Órdenes, Cocina) ==========
router.get('/ordenes', validateToken, getOrdenes);
router.post('/ordenes', validateToken, createOrden);
router.patch('/ordenes/:id/estado', validateToken, updateOrdenEstado);
router.patch('/ordenes/:id/cierre', validateToken, cierrePosController.closeOrder);
router.post('/ordenes/:id/items', validateToken, addItemsToOrden);

// ========== ✨ NUEVA SECCIÓN: PEDIDOS WEB LISTOS ✨ ==========
router.get('/web-ready-orders', validateToken, webReadyOrdersController.getReadyOrders);
router.patch('/web-ready-orders/:id/status', validateToken, webReadyOrdersController.updateStatus);

router.get('/cocina/pedidos', validateToken, cocinaController.getPedidosCocina);
router.patch('/cocina/pedidos/:id/estado', validateToken, cocinaController.updateEstadoPedido);

router.get('/mesas-con-ordenes', validateToken, getMesasConOrdenes);
router.get('/mesas', validateToken, mesasController.getAllMesas); 
router.post('/mesas', validateToken, mesasController.createMesa); 
router.patch('/mesas/:id', validateToken, mesasController.updateMesa); 
router.delete('/mesas/:id', validateToken, mesasController.deleteMesa);

router.get('/reservations', validateToken, reservationsController.getReservations);
router.patch('/reservations/:id/status', validateToken, reservationsController.updateReservationStatus);

// ========== 📦 INVENTARIO ==========
router.get('/categorias-inventario', validateToken, getCategoriasInventario);
router.post('/categorias-inventario', validateToken, createCategoriaInventario);
router.put('/categorias-inventario/:id', validateToken, updateCategoriaInventario);

router.get('/tipos-gasto', validateToken, getTiposGasto);
router.post('/tipos-gasto', validateToken, createTipoGasto);

router.get('/unidades-medida', validateToken, getUnidadesMedida);
router.post('/unidades-medida', validateToken, createUnidadMedida);

router.get('/productos-inventario', validateToken, getProductosInventario);
router.post('/productos-inventario', validateToken, createProductoInventario);
router.put('/productos-inventario/:id', validateToken, updateProductoInventario);

router.get('/kardex', validateToken, getKardexReport);

// ========== 💰 FINANZAS Y CAJA (NUEVO) ==========
router.post('/caja/abrir', validateToken, abrirCaja);
router.get('/caja/estado', validateToken, getEstadoCaja);
router.post('/caja/movimiento', validateToken, registrarMovimientoCaja);
router.post('/caja/cerrar', validateToken, cerrarCaja);
router.get('/caja/historial', validateToken, getHistorialCajas);
router.get('/finanzas/resumen', validateToken, getResumenFinanciero);

// ========== 🚚 COMPRAS (Entradas Kardex) ==========
router.get('/compras', validateToken, getGastos);
router.get('/compras/:id', validateToken, getCompraById);
router.post('/compras', validateToken, createGasto);
router.post('/compras/:id/recibir', validateToken, receiveCompra); // Actualiza Kardex y Costo

// ========== 💸 GASTOS OPERATIVOS (Salidas Caja/Banco) ==========
router.get('/gastos-operativos', validateToken, getGastosOperativos);
router.get('/gastos-operativos/:id', validateToken, getGastoOperativoById);
router.post('/gastos-operativos', validateToken, createGastoOperativo);
router.put('/gastos-operativos/:id', validateToken, updateGastoOperativo);
router.delete('/gastos-operativos/:id', validateToken, deleteGastoOperativo);
router.get('/gastos-operativos/estadisticas/resumen', validateToken, getGastosEstadisticas);

// ========== 📋 CIERRE DE INVENTARIO (Ajustes Stock) ==========
router.get('/cierres-inventario', validateToken, getCierresInventario);
router.get('/cierres-inventario/:id', validateToken, getCierreById);
router.get('/cierres-inventario/:id/estadisticas', validateToken, getCierreEstadisticas);
router.post('/cierres-inventario', validateToken, createCierreInventario);
router.put('/cierres-inventario/:id', validateToken, updateCierreInventario);
router.post('/cierres-inventario/:id/finalizar', validateToken, finalizarCierre);

// ========== 👥 EQUIPO Y RRHH ==========
router.get('/empleados', validateToken, empleadosController.getAllEmpleados);
router.get('/empleados/con-acceso', validateToken, empleadosController.getEmpleadosConAcceso);
router.get('/roles', validateToken, empleadosController.getRoles);
router.get('/empleados/:id', validateToken, empleadosController.getEmpleadoById);
router.post('/empleados', validateToken, empleadosController.createEmpleado);
router.patch('/empleados/:id', validateToken, empleadosController.updateEmpleado);
router.delete('/empleados/:id', validateToken, empleadosController.desactivarEmpleado);
router.post('/empleados/:id/activar', validateToken, empleadosController.activarEmpleado);
router.post('/empleados/:id/resetear-password', validateToken, empleadosController.resetearPassword);
router.post('/empleados/incidencias', validateToken, empleadosController.registrarIncidencia);

// ========== 🛡️ ROLES Y PERMISOS ==========
router.get('/roles/todos', validateToken, rolesController.getAllRoles);
router.post('/roles/crear', validateToken, rolesController.createRol);
router.patch('/roles/:id', validateToken, rolesController.updateRol);
router.delete('/roles/:id', validateToken, rolesController.desactivarRol);
router.post('/roles/:id/activar', validateToken, rolesController.activarRol);

// ========== 💵 NÓMINA ==========
router.get('/nomina', validateToken, nominaController.getNomina);
router.get('/nomina/estadisticas', validateToken, nominaController.getEstadisticasNomina);
router.get('/nomina/calcular/:id', validateToken, calcularPagoEmpleado);


export default router;