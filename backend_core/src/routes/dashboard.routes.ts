// src/routes/dashboard.routes.ts
import { Router } from 'express';
import { getDashboardInfo, 
              getProducts, 
              getInsumos, 
              createInsumo, 
              createProduct, 
              createCategory, 
              updateProduct,
              getCategories,
              getProductById,
              updateProductWithRecipe,
              uploadImage,
              getOrdenes,
              createOrden,
              updateOrdenEstado,
              getMesasConOrdenes
              } from '../controller/app/dashboard.controller';
import { validateToken } from '../middleware/auth.middleware'; // El guardia que creamos
import upload from '../middleware/upload.middleware';
import { reservationsController } from '../controller/auth/reservations.controller';


const router = Router();

// --- Ruta de Subida de Imágenes ---
router.post('/upload-image',
  validateToken, // 1. Proteger la ruta
  upload.single('image'), // 2. "Portero": procesar el archivo llamado 'image'
  uploadImage // 3. Controlador: subir a Cloudinary
);

// --- Ruta de Información General ---
router.get('/info', validateToken, getDashboardInfo);

// --- Rutas de Productos (Platos/Bebidas) ---
router.get('/products', validateToken, getProducts);
router.post('/products', validateToken, createProduct);
router.get('/products/:id', validateToken, getProductById);
router.put('/products/:id', validateToken, updateProductWithRecipe);
router.patch('/products/:id', validateToken, updateProduct);

// --- Rutas de Insumos (Inventario) ---
router.get('/insumos', validateToken, getInsumos);
router.post('/insumos', validateToken, createInsumo);

// --- Rutas de Categorías ---
router.post('/categories', validateToken, createCategory);
router.get('/categories', validateToken, getCategories);

// --- Rutas de Órdenes (Pedidos) ---
router.get('/ordenes', validateToken, getOrdenes);
router.post('/ordenes', validateToken, createOrden);
router.patch('/ordenes/:id/estado', validateToken, updateOrdenEstado);

// --- Rutas de Mesas ---
router.get('/mesas-con-ordenes', validateToken, getMesasConOrdenes);

// --- Rutas de Reservas ---
router.get('/reservations', validateToken, reservationsController.getReservations);
router.patch('/reservations/:id/status', validateToken, reservationsController.updateReservationStatus);

export default router;