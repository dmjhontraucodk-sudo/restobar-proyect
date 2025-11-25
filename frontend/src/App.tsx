// src/App.tsx - VERSIÓN FINAL ORDENADA
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Toaster } from "react-hot-toast";

// --- Páginas Globales (SaaS) ---
import { Landing } from "./pages/Landing";
import RegisterPage from "./pages/Register";
import CartDemo from "./pages/public/components/CartDemo";

// --- Páginas y Layouts del Tenant ---
import LoginPage from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import Overview from './pages/Overview';
import MenuManagementPage from "./pages/MenuManagement";
import InventoryManagementPage from "./pages/InventoryManagement";
import OrdersManagementPage from "./pages/OrdersManagement";
import KitchenManagementPage from './pages/dashboard/KitchenManagement';
import WebOrdersManagementPage from "./pages/WebOrdersManagement";

// ✨ PÁGINAS DE INVENTARIO
import InventarioPage from "./pages/dashboard/inventario/InventarioPage"; // ⭐ NUEVO WRAPPER
import TiposGasto from "./pages/dashboard/inventario/TiposGasto";
import KardexPage from "./pages/dashboard/inventario/KardexPage";
import Compras from "./pages/dashboard/inventario/Compras";

// ✨ CIERRE DE INVENTARIO
import CierreInventario from "./pages/dashboard/inventario/CierreInventario";
import NuevoCierreInventario from "./pages/dashboard/inventario/NuevoCierreInventario";
import DetalleCierreInventario from "./pages/dashboard/inventario/DetalleCierreInventario";

// ✨ PÁGINAS DE FINANZAS
import Gastos from "./pages/dashboard/Finanzas/Gastos";
import CajaPage from "./pages/dashboard/Finanzas/CajaPage";
import HistorialCajasPage from "./pages/dashboard/Finanzas/HistorialCajasPage";
import FinancialPage from "./pages/dashboard/Finanzas/FinancialPage";
import NominaPage from "./pages/dashboard/Finanzas/NominaPage";
// 📈 PÁGINA DE REPORTES (NUEVA RUTA)
import ReportsPage from './pages/ReportsPage'; 

// --- Páginas Públicas del Tenant (Restobar) ---
import RestobarLanding from "./pages/public/RestobarLanding";
import ProductCatalog from "./pages/public/ProductCatalog";
import Cart from "./pages/public/Cart";
import Checkout from "./pages/public/Checkout";
import ReservationForm from "./pages/public/ReservationForm";

// --- Componentes y Gestión ---
import ProtectedRoute from "./components/ProtectedRoute";
import TenantGuard from "./components/TenantGuard";
import ReservationsManagementPage from "./pages/ReservationsManagement";
import TablesManagementPage from "./pages/TablesManagement";
import TeamManagement from './pages/dashboard/TeamManagement';

// --- Lógica de Subdominio ---
const getTenantId = () => {
  const host = window.location.host;
  const parts = host.split(".");
  const isLocalTenant = parts.length === 2 && parts[1].includes("localhost");
  const isProductionTenant = parts.length === 3 && parts[0] !== "www";
  if (isLocalTenant || isProductionTenant) {
    return parts[0];
  }
  return null;
};

// --- Rutas Globales (Landing Demo, Registro) ---
const GlobalRoutes = () => (
  <CartProvider>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cart" element={<CartDemo />} />
      <Route path="/reservar" element={<ReservationForm />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </CartProvider>
);

// --- Rutas Públicas del Tenant (Restobar Real) ---
const TenantPublicRoutes = () => (
  <CartProvider>
    <Routes>
      <Route path="/" element={<RestobarLanding />} />
      <Route path="/catalog" element={<ProductCatalog />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/reservar" element={<ReservationForm />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </CartProvider>
);

// --- Rutas Privadas del Tenant (Dashboard Admin) ---
const TenantPrivateRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    {/* Rutas protegidas */}
    <Route element={<ProtectedRoute />}>
      <Route element={<TenantGuard />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          
          {/* 📊 DASHBOARD PRINCIPAL */}
          <Route index element={<Overview />} />

          {/* 🍔 MENÚ & COCINA */}
          <Route path="menu" element={<MenuManagementPage tipo="COMIDA" />} />
          <Route path="bebidas" element={<MenuManagementPage tipo="BEBIDA" />} />
          <Route path="kitchen" element={<KitchenManagementPage />} />

          {/* ⚡ OPERACIONES */}
          <Route path="orders" element={<OrdersManagementPage />} />
          <Route path="web-orders" element={<WebOrdersManagementPage />} />
          <Route path="tables" element={<TablesManagementPage />} />
          <Route path="reservas" element={<ReservationsManagementPage />} />
          <Route path="team" element={<TeamManagement />} />

          {/* 📦 INVENTARIO */}
          <Route path="inventario" element={<InventarioPage />} /> {/* ⭐ NUEVA RUTA UNIFICADA CON TABS */}
          <Route path="kardex" element={<KardexPage />} />
          <Route path="compras" element={<Compras />} />
          
          {/* Cierre de Inventario */}
          <Route path="cierre-inventario" element={<CierreInventario />} />
          <Route path="cierre-inventario/nuevo" element={<NuevoCierreInventario />} />
          <Route path="cierre-inventario/:id" element={<DetalleCierreInventario />} />
          
          {/* Configuración de Inventario */}
          <Route path="tipos-gasto" element={<TiposGasto />} />

          {/* 💰 FINANZAS */}
          <Route path="caja" element={<CajaPage />} />
          <Route path="caja/historial" element={<HistorialCajasPage />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="finances" element={<FinancialPage />} />
          <Route path="nomina" element={<NominaPage />} />

          {/* Ruta legacy (por compatibilidad) */}
          <Route path="inventory" element={<InventoryManagementPage />} />

          {/* 📈 RUTA DE REPORTES */}
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>
    </Route>

    {/* Redirecciones */}
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
);

// --- Componente Principal ---
export default function App() {
  const tenantId = getTenantId();

  const getRoutesToRender = () => {
    if (!tenantId) return <GlobalRoutes />;
    
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/dashboard") || currentPath.startsWith("/login")) {
      return <TenantPrivateRoutes />;
    }
    return <TenantPublicRoutes />;
  };

  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            fontSize: "14px",
            border: "1px solid #374151",
            maxWidth: "500px",
          },
          success: {
            duration: 3000,
            style: {
              background: "#10b981",
              border: "1px solid #059669",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#ef4444",
              border: "1px solid #dc2626",
            },
          },
        }}
      />
      <BrowserRouter>{getRoutesToRender()}</BrowserRouter>
    </AuthProvider>
  );
}