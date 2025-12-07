import { Router } from 'express';
import { clientsController } from '../controllers/clients.controller';

const publicClientsRoutes = Router();

publicClientsRoutes.get('/for-review/:documento_identidad', clientsController.findClientForReview);

export default publicClientsRoutes;
