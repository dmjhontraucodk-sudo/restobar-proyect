// src/routes/dashboard.routes.ts - VERSIÓN COMPLETA CORREGIDA

import { Router } from 'express';
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
  
  // ✨ COMPRAS (Con inventario)
  getGastos,
  createGasto,
  receiveCompra,
  getCompraById,
} from '../controller/app/dashboard.controller';

import {
  getCierresInventario,
  getCierreById,
  createCierreInventario,
  updateCierreInventario,
  finalizarCierre,
  getCierreEstadisticas,
} from '../controller/cierreInventario.controller';

// ✨ GASTOS OPERATIVOS (Sin inventario)
import {
  getGastos as getGastosOperativos,
  getGastoById as getGastoOperativoById,
  createGasto as createGastoOperativo,
  updateGasto as updateGastoOperativo,
  deleteGasto as deleteGastoOperativo,
  getGastosEstadisticas,
} from '../controller/gastos.controller';

import { validateToken } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';
import { reservationsController } from '../controller/auth/reservations.controller';
import { mesasController } from '../controller/app/mesas.controller';
import { cocinaController } from '../controller/app/cocina.controller';
import { empleadosController } from '../controller/app/empleados.controller';
import { rolesController } from '../controller/app/roles.controller';
import { nominaController } from '../controller/app/nomina.controller';

const router = Router();

// ========== RUTAS EXISTENTES ==========

// --- Subida de Imágenes ---
router.post('/upload-image',
  validateToken,
  upload.single('image'),
  uploadImage
);

// --- Información General ---
router.get('/info', validateToken, getDashboardInfo);

// --- Productos del Menú (Platos/Bebidas) ---
router.get('/products', validateToken, getProducts);
router.post('/products', validateToken, createProduct);
router.get('/products/:id', validateToken, getProductById);
router.put('/products/:id', validateToken, updateProductDetails);
router.patch('/products/:id', validateToken, updateProduct);

// --- Categorías del Menú ---
router.post('/categories', validateToken, createCategory);
router.get('/categories', validateToken, getCategories);

// --- Órdenes (Pedidos) ---
router.get('/ordenes', validateToken, getOrdenes);
router.post('/ordenes', validateToken, createOrden);
router.patch('/ordenes/:id/estado', validateToken, updateOrdenEstado);

// --- Cocina ---
router.get('/cocina/pedidos', validateToken, cocinaController.getPedidosCocina);
router.patch('/cocina/pedidos/:id/estado', validateToken, cocinaController.updateEstadoPedido);

// --- Mesas ---
router.get('/mesas-con-ordenes', validateToken, getMesasConOrdenes);
router.get('/mesas', validateToken, mesasController.getAllMesas); 
router.post('/mesas', validateToken, mesasController.createMesa); 
router.patch('/mesas/:id', validateToken, mesasController.updateMesa); 
router.delete('/mesas/:id', validateToken, mesasController.deleteMesa);

// --- Reservas ---
router.get('/reservations', validateToken, reservationsController.getReservations);
router.patch('/reservations/:id/status', validateToken, reservationsController.updateReservationStatus);

// ========== ✨ INVENTARIO DINÁMICO ✨ ==========

// --- Categorías de Inventario ---
router.get('/categorias-inventario', validateToken, getCategoriasInventario);
router.post('/categorias-inventario', validateToken, createCategoriaInventario);
router.put('/categorias-inventario/:id', validateToken, updateCategoriaInventario);

// --- Tipos de Gasto ---
router.get('/tipos-gasto', validateToken, getTiposGasto);
router.post('/tipos-gasto', validateToken, createTipoGasto);

// --- Unidades de Medida ---
router.get('/unidades-medida', validateToken, getUnidadesMedida);
router.post('/unidades-medida', validateToken, createUnidadMedida);

// --- Productos de Inventario ---
router.get('/productos-inventario', validateToken, getProductosInventario);
router.post('/productos-inventario', validateToken, createProductoInventario);
router.put('/productos-inventario/:id', validateToken, updateProductoInventario);

// ========== 📦 COMPRAS (Con productos - Afecta Inventario) ==========
router.get('/compras', validateToken, getGastos);                    // ✅ Dashboard Controller
router.get('/compras/:id', validateToken, getCompraById);           // ✅ Dashboard Controller
router.post('/compras', validateToken, createGasto);                // ✅ Dashboard Controller
router.post('/compras/:id/recibir', validateToken, receiveCompra);  // ✅ Dashboard Controller

// ========== 💸 GASTOS OPERATIVOS (Sin productos - NO afecta inventario) ==========
router.get('/gastos-operativos', validateToken, getGastosOperativos);           // ✅ Gastos Controller
router.get('/gastos-operativos/:id', validateToken, getGastoOperativoById);     // ✅ Gastos Controller
router.post('/gastos-operativos', validateToken, createGastoOperativo);         // ✅ Gastos Controller
router.put('/gastos-operativos/:id', validateToken, updateGastoOperativo);      // ✅ Gastos Controller
router.delete('/gastos-operativos/:id', validateToken, deleteGastoOperativo);   // ✅ Gastos Controller
router.get('/gastos-operativos/estadisticas/resumen', validateToken, getGastosEstadisticas); // ✅ Gastos Controller

// ========== 📋 CIERRE DE INVENTARIO ==========
router.get('/cierres-inventario', validateToken, getCierresInventario);
router.get('/cierres-inventario/:id', validateToken, getCierreById);
router.get('/cierres-inventario/:id/estadisticas', validateToken, getCierreEstadisticas);
router.post('/cierres-inventario', validateToken, createCierreInventario);
router.put('/cierres-inventario/:id', validateToken, updateCierreInventario);
router.post('/cierres-inventario/:id/finalizar', validateToken, finalizarCierre);

// ========== 🗑️ RUTAS DEPRECATED (Compatibilidad) ==========
// DEPRECADO: Usar /productos-inventario
router.get('/insumos', validateToken, getProductosInventario);
router.post('/insumos', validateToken, createProductoInventario);

// DEPRECADO: Usar /compras/:id/recibir
router.post('/compras/:id/recibir', validateToken, receiveCompra);

// ========== RUTAS DE CIERRE DE INVENTARIO (agregar después de las rutas existentes) ==========

// Listar cierres con filtros
router.get('/cierres-inventario', getCierresInventario);

// Obtener un cierre específico con detalles
router.get('/cierres-inventario/:id', getCierreById);

// Obtener estadísticas de un cierre
router.get('/cierres-inventario/:id/estadisticas', getCierreEstadisticas);

// Crear nuevo cierre (en estado Borrador)
router.post('/cierres-inventario', createCierreInventario);

// Actualizar cierre (solo si está en Borrador)
router.put('/cierres-inventario/:id', updateCierreInventario);

// Finalizar cierre (actualiza stock y cambia estado a Finalizado)
router.post('/cierres-inventario/:id/finalizar', finalizarCierre);


// ========== RUTAS DE GESTIÓN DE EMPLEADOS (EQUIPO) ==========
// Obtener todos los empleados
router.get('/empleados', validateToken, empleadosController.getAllEmpleados);

// Obtener empleados con acceso al sistema
router.get('/empleados/con-acceso', validateToken, empleadosController.getEmpleadosConAcceso);

// Obtener roles disponibles
router.get('/roles', validateToken, empleadosController.getRoles);

// Obtener un empleado específico
router.get('/empleados/:id', validateToken, empleadosController.getEmpleadoById);

// Crear nuevo empleado
router.post('/empleados', validateToken, empleadosController.createEmpleado);

// Actualizar empleado
router.patch('/empleados/:id', validateToken, empleadosController.updateEmpleado);

// Desactivar empleado
router.delete('/empleados/:id', validateToken, empleadosController.desactivarEmpleado);

// Reactivar empleado
router.post('/empleados/:id/activar', validateToken, empleadosController.activarEmpleado);

// Resetear contraseña de empleado
router.post('/empleados/:id/resetear-password', validateToken, empleadosController.resetearPassword);

// ========== RUTAS DE GESTIÓN DE ROLES  ==========
// Obtener todos los roles (incluye inactivos) - Solo Administrador
router.get('/roles/todos', validateToken, rolesController.getAllRoles);

// Crear nuevo rol - Solo Administrador
router.post('/roles/crear', validateToken, rolesController.createRol);

// Actualizar rol - Solo Administrador
router.patch('/roles/:id', validateToken, rolesController.updateRol);

// Desactivar rol - Solo Administrador
router.delete('/roles/:id', validateToken, rolesController.desactivarRol);

// Reactivar rol - Solo Administrador
router.post('/roles/:id/activar', validateToken, rolesController.activarRol);

// Obtener nómina completa - Administrador y Gerente
router.get('/nomina', validateToken, nominaController.getNomina);

// Obtener estadísticas de nómina - Administrador y Gerente
router.get('/nomina/estadisticas', validateToken, nominaController.getEstadisticasNomina);

export default router;