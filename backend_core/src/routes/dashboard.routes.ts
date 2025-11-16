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

import { validateToken } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';
import { reservationsController } from '../controller/auth/reservations.controller';
import { mesasController } from '../controller/app/mesas.controller';

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

export default router;