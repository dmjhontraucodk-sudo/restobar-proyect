import { Router } from 'express';
import upload from '@shared/middleware/upload.middleware';
import { uploadController } from './upload.controller';

const router = Router();

router.post('/upload-image', upload.single('image'), uploadController.uploadSingleImage);

export default router;
