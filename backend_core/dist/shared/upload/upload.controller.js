"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = void 0;
const upload_service_1 = require("./upload.service");
exports.uploadController = {
    async uploadSingleImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se ha proporcionado ningún archivo.' });
            }
            // Check for file size limit handled by Multer
            if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
                return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido de 10MB.' });
            }
            const secureUrl = await upload_service_1.uploadService.uploadImage(req.file.buffer, req.file.originalname);
            res.status(200).json({ url: secureUrl });
        }
        catch (error) {
            console.error('Error uploading image:', error);
            res.status(500).json({ error: error.message || 'Error interno del servidor al subir la imagen.' });
        }
    },
};
