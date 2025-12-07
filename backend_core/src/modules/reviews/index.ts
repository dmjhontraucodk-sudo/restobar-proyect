// backend_core/src/modules/reviews/index.ts
export { default as reviewsRoutes } from './routes/reviews.routes';
export { default as reviewsAdminRoutes } from './routes/reviews-admin.routes';
export { reviewsController } from './controllers/reviews.controller';
export { reviewsService } from './services/reviews.service';