// src/App.tsx - VERSIÓN CORREGIDA
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';
import { type TipoCategoria } from './types';

// --- Páginas Globales (SaaS) ---
import { Landing } from './pages/Landing'; // ← Ahora es la landing del restobar demo
import RegisterPage from './pages/Register';
import CartDemo from './pages/public/components/CartDemo';

// --- Páginas y Layouts del Tenant ---
import LoginPage from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/Overview';
import MenuManagementPage from './pages/MenuManagement';
import InventoryManagementPage from './pages/InventoryManagement';

import OrdersManagementPage from './pages/OrdersManagement';

// --- Páginas Públicas del Tenant (Restobar) ---
import RestobarLanding from './pages/public/RestobarLanding'; // ← Landing real con datos de BD
import ProductCatalog from './pages/public/ProductCatalog';
import Cart from './pages/public/Cart';
import Checkout from './pages/public/Checkout';

// --- Componentes ---
import ProtectedRoute from './components/ProtectedRoute';
import TenantGuard from './components/TenantGuard';

// --- Lógica de Subdominio ---
const getTenantId = () => {
  const host = window.location.host; 
  const parts = host.split('.');
  const isLocalTenant = parts.length === 2 && parts[1].includes('localhost');
  const isProductionTenant = parts.length === 3 && parts[0] !== 'www';
  if (isLocalTenant || isProductionTenant) {
    return parts[0]; 
  }
  return null; 
};

// --- Rutas Globales (Landing Demo, Registro) ---
const GlobalRoutes = () => (
  <AuthProvider>
    <CartProvider> {/* ← AGREGA CartProvider AQUÍ */}
      <Routes>
        <Route path="/" element={<Landing />} /> {/* ← Landing del restobar DEMO */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<CartDemo />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </CartProvider>
  </AuthProvider>
);

// --- Rutas Públicas del Tenant (Restobar Real) ---
const TenantPublicRoutes = () => (
  <CartProvider>
    <Routes>
      {/* Landing del Restobar REAL - Con datos de BD */}
      <Route path="/" element={<RestobarLanding />} />
      
      {/* Catálogo de productos - Ya incluye Header y Footer */}
      <Route path="/catalog" element={<ProductCatalog />} />
      
      {/* Carrito y Checkout - Ya incluyen Header y Footer */}
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />

      {/* Redirección para rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </CartProvider>
);

// --- Rutas Privadas del Tenant (Dashboard Admin) ---
const TenantPrivateRoutes = () => (
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<TenantGuard />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} /> 
            <Route path="menu" element={<MenuManagementPage tipo="COMIDA" />} />
            <Route path="bebidas" element={<MenuManagementPage tipo="BEBIDA" />} />
            <Route path="inventory" element={<InventoryManagementPage />} />
            <Route path="orders" element={<OrdersManagementPage />} />
            <Route path="tables" element={<div className="p-4">Página de Mesas (Próximamente)</div>} />
          </Route>
        </Route>
      </Route>

      {/* Redirecciones */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  </AuthProvider>
);

// --- Componente Principal ---
export default function App() {
  const tenantId = getTenantId();

  const getRoutesToRender = () => {
    if (!tenantId) {
      return <GlobalRoutes />; // Sin tenant = Landing DEMO del restobar
    }

    const currentPath = window.location.pathname;
    
    // Rutas de administración
    if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/login')) {
      return <TenantPrivateRoutes />;
    }
    
    // Cualquier otra ruta = Landing REAL del restobar + catálogo
    return <TenantPublicRoutes />;
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            fontSize: '14px',
            border: '1px solid #374151',
            maxWidth: '500px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              border: '1px solid #059669',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              border: '1px solid #dc2626',
            },
          },
        }}
      />
      
      <BrowserRouter>
        {getRoutesToRender()}
      </BrowserRouter>
    </>
  );
}