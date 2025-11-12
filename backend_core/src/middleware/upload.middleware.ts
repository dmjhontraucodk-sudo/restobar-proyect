// src/middleware/upload.middleware.ts (verificación)
import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Archivo recibido:', file.originalname, file.mimetype);
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('❌ Tipo de archivo rechazado:', file.mimetype);
      cb(new Error('Formato de archivo no válido. Solo se aceptan imágenes.') as any, false);
    }
  }
});

export default upload;