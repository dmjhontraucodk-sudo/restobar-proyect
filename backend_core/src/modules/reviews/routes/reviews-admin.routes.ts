import { Router } from 'express';
import { reviewsController } from '../controllers/reviews.controller';

const reviewsAdminRoutes = Router();

// GET /api/dashboard/reviews/pending - Get all reviews pending approval
reviewsAdminRoutes.get('/pending', reviewsController.getPendingReviews);

// PATCH /api/dashboard/reviews/:id/approve - Approve a review
reviewsAdminRoutes.patch('/:id/approve', reviewsController.approveReview);

// DELETE /api/dashboard/reviews/:id - Reject (delete) a review
reviewsAdminRoutes.delete('/:id', reviewsController.rejectReview);

export default reviewsAdminRoutes;
