// src/app.ts (VERSIÓN ACTUALIZADA)
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { tenantMiddleware } from './middleware/tenant';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import webRoutes from './routes/web.routes'; // ← NUEVA IMPORTACIÓN

dotenv.config();

// Crea la instancia de la aplicación Express
const app = express();

// --- Configuración de CORS (Dinámica para Subdominios) ---

// 1. Leemos las variables del entorno
const FRONTEND_PORT = (process.env.FRONTEND_URL || 'http://localhost:5174').split(':').pop(); // "5174"
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost'; // "localhost"

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman o apps móviles)
    if (!origin) {
      return callback(null, true);
    }

    try {
      // 2. Parseamos el origen de la petición
      const originUrl = new URL(origin);
      const hostname = originUrl.hostname; // ej: "rb.localhost" o "localhost"
      const port = originUrl.port;     // ej: "5174"

      // 3. Verificamos las condiciones
      
      // Condición 1: El puerto debe coincidir con el de nuestro frontend
      const isPortAllowed = (port === FRONTEND_PORT);

      // Condición 2: El hostname debe ser "localhost" O terminar en ".localhost"
      const isHostnameAllowed = (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`));

      if (isPortAllowed && isHostnameAllowed) {
        // ¡Permitido!
        // console.log(`CORS: Permitido para ${origin}`);
        callback(null, true);
      } else {
        // Bloqueado
        // console.log(`CORS: Bloqueado para ${origin}`);
        callback(new Error('Origen no permitido por CORS'));
      }
    } catch (e) {
      callback(new Error('Origen inválido'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
// --- Fin Configuración de CORS ---

app.use(express.json()); // Habilita el parseo de JSON en el body
app.use(morgan('dev')); // Muestra logs de peticiones en la consola

// --- RUTAS PÚBLICAS (Globales) ---
app.use('/api/auth', authRoutes);

// --- RUTAS PÚBLICAS WEB (Por Tenant) ---
app.use(tenantMiddleware);
app.use('/api/web', webRoutes); // ← NUEVA LÍNEA - RUTAS WEB PÚBLICAS

// --- RUTAS PRIVADAS (Por Tenant) ---
app.use('/api/dashboard', dashboardRoutes);

// Ruta de prueba para verificar que el tenant se identificó
app.get('/api/tenant-check', (req, res) => {
  if ((req as any).tenant) {
    res.json({
      message: 'Middleware funciona',
      tenant: (req as any).tenant,
    });
  } else {
    res.status(404).json({ error: 'Tenant no identificado' });
  }
});

// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Backend Core'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

// Exporta la app para ser usada en server.ts
export default app;