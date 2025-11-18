"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
// src/config/cloudinary.config.ts
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Debug detallado
console.log('🔍 VERIFICACIÓN DETALLADA CLOUDINARY:');
console.log('Cloud Name from env:', `"${process.env.CLOUDINARY_CLOUD_NAME}"`);
console.log('API Key from env:', `"${process.env.CLOUDINARY_API_KEY?.substring(0, 10)}..."`);
console.log('API Secret from env:', `"${process.env.CLOUDINARY_API_SECRET?.substring(0, 10)}..."`);
// Configuración manual para forzar los valores
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dwmrsi0uk';
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
console.log('🔧 Configurando con:');
console.log('  cloud_name:', `"${cloudName}"`);
console.log('  api_key:', `"${apiKey?.substring(0, 10)}..."`);
console.log('  api_secret:', `"${apiSecret?.substring(0, 10)}..."`);
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
});
// Test mejorado
console.log('🧪 Probando conexión...');
cloudinary_1.v2.api.ping()
    .then(result => {
    console.log('✅ Cloudinary conectado correctamente:', result);
})
    .catch(error => {
    console.error('❌ Error detallado Cloudinary:');
    console.error('  - Código:', error.http_code);
    console.error('  - Mensaje:', error.message);
    console.error('  - Cloud name usado:', cloudName);
    console.log('💡 SOLUCIÓN: Verifica que el cloud_name sea EXACTAMENTE igual al de tu dashboard');
});
