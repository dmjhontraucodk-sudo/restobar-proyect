
import { Router } from 'express';
import { clientsController } from '../controllers/clients.controller';

const clientsRoutes = Router();

// No public routes are defined for now, as client creation is handled internally.
clientsRoutes.get('/by-phone/:telefono', clientsController.findClientByPhone);
clientsRoutes.get('/by-document/:documento_identidad', clientsController.findClientByDocument);
clientsRoutes.get('/for-review/:documento_identidad', clientsController.findClientForReview);


export default clientsRoutes;
