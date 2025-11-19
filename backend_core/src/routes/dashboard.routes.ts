// src/routes/dashboard.routes.ts - REFACTORIZADO CON RUTAS DINÁMICAS

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
  
  // ✨ NUEVAS FUNCIONES - CATEGORÍAS DE INVENTARIO
  getCategoriasInventario,
  createCategoriaInventario,
  updateCategoriaInventario,
  
  // ✨ NUEVAS FUNCIONES - TIPOS DE GASTO
  getTiposGasto,
  createTipoGasto,
  
  // ✨ NUEVAS FUNCIONES - UNIDADES DE MEDIDA
  getUnidadesMedida,
  createUnidadMedida,
  
  // ✨ NUEVAS FUNCIONES - PRODUCTOS DE INVENTARIO
  getProductosInventario,
  createProductoInventario,
  updateProductoInventario,
  
  // ✨ NUEVAS FUNCIONES - COMPRAS/GASTOS
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

import { validateToken } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';
import { reservationsController } from '../controller/auth/reservations.controller';
import { mesasController } from '../controller/app/mesas.controller';
import { cocinaController } from '../controller/app/cocina.controller';
import { empleadosController } from '../controller/app/empleados.controller';
import { rolesController } from '../controller/app/roles.controller';
import { nominaController } from '../controller/app/nomina.controller';

const router = Router();

// ========== RUTAS EXISTENTES (SIN CAMBIOS) ==========

// --- Ruta de Subida de Imágenes ---
router.post('/upload-image',
  validateToken,
  upload.single('image'),
  uploadImage
);

// --- Ruta de Información General ---
router.get('/info', validateToken, getDashboardInfo);

// --- Rutas de Productos del Menú (Platos/Bebidas) ---
router.get('/products', validateToken, getProducts);
router.post('/products', validateToken, createProduct);
router.get('/products/:id', validateToken, getProductById);
router.put('/products/:id', validateToken, updateProductDetails);
router.patch('/products/:id', validateToken, updateProduct);

// --- Rutas de Categorías del Menú ---
router.post('/categories', validateToken, createCategory);
router.get('/categories', validateToken, getCategories);

// --- Rutas de Órdenes (Pedidos) ---
router.get('/ordenes', validateToken, getOrdenes);
router.post('/ordenes', validateToken, createOrden);
router.patch('/ordenes/:id/estado', validateToken, updateOrdenEstado);

// --- Rutas Cocina (Cocina)---
router.get('/cocina/pedidos', validateToken, cocinaController.getPedidosCocina);
router.patch('/cocina/pedidos/:id/estado', validateToken, cocinaController.updateEstadoPedido);

// --- Rutas de Mesas ---
router.get('/mesas-con-ordenes', validateToken, getMesasConOrdenes);
router.get('/mesas', validateToken, mesasController.getAllMesas); 
router.post('/mesas', validateToken, mesasController.createMesa); 
router.patch('/mesas/:id', validateToken, mesasController.updateMesa); 
router.delete('/mesas/:id', validateToken, mesasController.deleteMesa);

// --- Rutas de Reservas ---
router.get('/reservations', validateToken, reservationsController.getReservations);
router.patch('/reservations/:id/status', validateToken, reservationsController.updateReservationStatus);

// ========== ✨ NUEVAS RUTAS - INVENTARIO DINÁMICO ✨ ==========

// --- CATEGORÍAS DE INVENTARIO (Dinámicas) ---
router.get('/categorias-inventario', validateToken, getCategoriasInventario);
router.post('/categorias-inventario', validateToken, createCategoriaInventario);
router.put('/categorias-inventario/:id', validateToken, updateCategoriaInventario);

// --- TIPOS DE GASTO (Dinámicos) ---
router.get('/tipos-gasto', validateToken, getTiposGasto);
router.post('/tipos-gasto', validateToken, createTipoGasto);

// --- UNIDADES DE MEDIDA (Dinámicas) ---
router.get('/unidades-medida', validateToken, getUnidadesMedida);
router.post('/unidades-medida', validateToken, createUnidadMedida);

// --- PRODUCTOS DE INVENTARIO (Antes "Insumos") ---
router.get('/productos-inventario', validateToken, getProductosInventario);
router.post('/productos-inventario', validateToken, createProductoInventario);
router.put('/productos-inventario/:id', validateToken, updateProductoInventario);

// --- COMPRAS Y GASTOS ---
router.get('/gastos', validateToken, getGastos);
router.get('/gastos/:id', validateToken, getCompraById);
router.post('/gastos', validateToken, createGasto);
router.post('/gastos/:id/recibir', validateToken, receiveCompra);

// ========== 🗑️ RUTAS DEPRECATED (Mantener por compatibilidad) ==========
// Estas rutas antiguas redirigen a las nuevas funciones

// DEPRECADO: Usar /productos-inventario en su lugar
router.get('/insumos', validateToken, getProductosInventario);
router.post('/insumos', validateToken, createProductoInventario);

// DEPRECADO: Usar /gastos/:id/recibir en su lugar
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