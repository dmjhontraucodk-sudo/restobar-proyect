"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/middleware/upload.middleware.ts (verificación)
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        console.log('📁 Archivo recibido:', file.originalname, file.mimetype);
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            console.log('❌ Tipo de archivo rechazado:', file.mimetype);
            cb(new Error('Formato de archivo no válido. Solo se aceptan imágenes.'), false);
        }
    }
});
exports.default = upload;
