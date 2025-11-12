// src/config/cloudinary.config.ts
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

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

cloudinary.config({ 
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

// Test mejorado
console.log('🧪 Probando conexión...');
cloudinary.api.ping()
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

export { cloudinary };