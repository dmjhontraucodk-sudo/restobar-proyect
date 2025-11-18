// src/routes/web.routes.ts
import { Router } from 'express';
import { webCatalogController } from '../controller/web-catalog.controller';
import { webOrdersController } from '../controller/web-orders.controller';
import { reservationsController } from '../controller/auth/reservations.controller';
import { validateToken } from '../middleware/auth.middleware';

import { pedidosWebFlowController } from '../controller/pedidos-web-flow.controller'; // <-- IMPORTAR NUEVO


const router = Router();

// ==================== RUTAS PÚBLICAS (Sin autenticación) ====================
// Estas rutas son accesibles por cualquier cliente en el subdominio del tenant

// Catálogo y productos
router.get('/catalog', webCatalogController.getCatalog);
router.get('/products/search', webCatalogController.searchProducts);
router.get('/products/:id', webCatalogController.getProduct);
router.post('/check-availability', webCatalogController.checkAvailability);

// Pedidos web (creación desde la web pública)
router.post('/orders', pedidosWebFlowController.createWebOrder); // <-- USAR NUEVO CONTROLLER
router.post('/reservations', reservationsController.createReservation);
// ==================== RUTAS PRIVADAS (Requieren autenticación) ====================
// Estas rutas son para el panel administrativo del tenant

// Gestión de pedidos web (ADMIN)
router.get('/admin/orders', validateToken, webOrdersController.getWebOrders);
router.get('/admin/orders/:id', validateToken, webOrdersController.getWebOrderDetail);
router.patch('/admin/orders/:id/status', validateToken, webOrdersController.updateOrderStatus);
router.post('/admin/orders/:id/convert-to-pos', validateToken, webOrdersController.convertToPosOrder);

// Configuración de pedidos (ADMIN)
router.get('/admin/order-config', validateToken, webOrdersController.getOrderConfig);
router.put('/admin/order-config', validateToken, webOrdersController.updateOrderConfig);

// Reservas
router.get('/mesas/disponibles', reservationsController.getAvailableMesas);


export default router;

