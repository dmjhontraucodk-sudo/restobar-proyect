// src/app.ts (VERSIÓN COMPLETAMENTE CORREGIDA)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { tenantMiddleware } from './middleware/tenant';
import { validateToken } from './middleware/auth.middleware';
import { verifyTenantAccess } from './middleware/verifyTenantAccess';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import webRoutes from './routes/web.routes';

// Interfaces para TypeScript
interface JwtPayload {
  id: number;
  email: string;
  tenant_id: number;
  rol_id: number;
}

interface TenantInfo {
  id: number;
  subdominio: string;
  nombre_empresa?: string;
  configuracion: any;
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

interface TenantRequest extends Request {
  tenant?: TenantInfo;
}

interface AuthTenantRequest extends AuthRequest, TenantRequest {}

dotenv.config();

// Crea la instancia de la aplicación Express
const app = express();

// --- Configuración de CORS MEJORADA ---
const FRONTEND_PORT = (process.env.FRONTEND_URL || 'http://localhost:5174').split(':').pop();
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman o apps móviles)
    if (!origin) {
      return callback(null, true);
    }

    try {
      const originUrl = new URL(origin);
      const hostname = originUrl.hostname;
      const port = originUrl.port;

      const isPortAllowed = (port === FRONTEND_PORT);
      const isHostnameAllowed = (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`));

      if (isPortAllowed && isHostnameAllowed) {
        callback(null, true);
      } else {
        console.log('❌ CORS BLOCKED - Origin not allowed:', origin);
        callback(new Error('Origen no permitido por CORS'));
      }
    } catch (e) {
      console.log('❌ CORS ERROR - Invalid origin:', origin);
      callback(new Error('Origen inválido'));
    }
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Tenant-Subdomain',
    'X-Requested-With',
    'Accept'
  ],
  exposedHeaders: ['X-Tenant-Subdomain']
};

app.use(cors(corsOptions));

// ✨ MIDDLEWARE ADICIONAL PARA HEADERS CORS ✨
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Subdomain, X-Requested-With, Accept');
  res.header('Access-Control-Expose-Headers', 'X-Tenant-Subdomain');
  next();
});

app.use(express.json());
app.use(morgan('dev'));

// --- RUTAS PÚBLICAS (Globales) ---
app.use('/api/auth', authRoutes);

// --- RUTAS PÚBLICAS WEB (Por Tenant) ---
app.use('/api/web', tenantMiddleware, webRoutes);

// --- RUTAS PRIVADAS DASHBOARD (Con auth + tenant + verificación) ---
app.use('/api/dashboard', [
  validateToken,        // 1º: Verificar JWT y cargar usuario en req.user
  tenantMiddleware,     // 2º: Identificar tenant y cargar en req.tenant
  verifyTenantAccess    // 3º: Verificar que usuario pertenezca al tenant
], dashboardRoutes);

// --- RUTAS DE PRUEBA Y DIAGNÓSTICO ---

// Ruta para probar solo el tenant middleware
app.get('/api/tenant-check', tenantMiddleware, (req: TenantRequest, res: Response) => {
  res.json({
    message: 'Tenant middleware funciona',
    tenant: req.tenant,
    headers_received: {
      'x-tenant-subdomain': req.headers['x-tenant-subdomain'],
      host: req.headers.host
    }
  });
});

// Ruta para probar solo el auth middleware
app.get('/api/auth-check', validateToken, (req: AuthRequest, res: Response) => {
  res.json({
    message: 'Auth middleware funciona',
    user: req.user
  });
});

// Ruta para probar el flujo completo
app.get('/api/full-check', [
  validateToken,
  tenantMiddleware,
  verifyTenantAccess
], (req: AuthTenantRequest, res: Response) => {
  res.json({
    message: 'Flujo completo funciona',
    user: req.user,
    tenant: req.tenant,
    access: 'GRANTED'
  });
});

// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Backend Core',
    environment: process.env.NODE_ENV
  });
});

// Manejo de rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo global de errores - CORREGIDO
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 GLOBAL ERROR HANDLER:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al administrador'
  });
});

export default app;