// src/App.tsx - CON RUTAS DE INVENTARIO
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
import OverviewPage from "./pages/Overview";
import MenuManagementPage from "./pages/MenuManagement";
import InventoryManagementPage from "./pages/InventoryManagement";
import OrdersManagementPage from "./pages/OrdersManagement";

// ✨ NUEVAS PÁGINAS DE INVENTARIO
import CategoriasInventario from "./pages/dashboard/inventario/CategoriasInventario";
import TiposGasto from "./pages/dashboard/inventario/TiposGasto";
import UnidadesMedida from "./pages/dashboard/inventario/UnidadesMedida";
import ProductosInventario from "./pages/dashboard/inventario/ProductosInventario";
import Compras from "./pages/dashboard/inventario/Compras";

// --- Páginas Públicas del Tenant (Restobar) ---
import RestobarLanding from "./pages/public/RestobarLanding";
import ProductCatalog from "./pages/public/ProductCatalog";
import Cart from "./pages/public/Cart";
import Checkout from "./pages/public/Checkout";

// --- Componentes ---
import ProtectedRoute from "./components/ProtectedRoute";
import TenantGuard from "./components/TenantGuard";

// --- Reservas ---
import ReservationForm from "./pages/public/ReservationForm";
import ReservationsManagementPage from "./pages/ReservationsManagement";

// --- Mesas---
import TablesManagementPage from "./pages/TablesManagement";

// ========== IMPORTS (agregar al inicio) ==========
import CierreInventario from "./pages/dashboard/inventario/CierreInventario";
import NuevoCierreInventario from "./pages/dashboard/inventario/NuevoCierreInventario";
import DetalleCierreInventario from "./pages/dashboard/inventario/DetalleCierreInventario";

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
          <Route index element={<OverviewPage />} />

          {/* Rutas Existentes */}
          <Route path="menu" element={<MenuManagementPage tipo="COMIDA" />} />
          <Route
            path="bebidas"
            element={<MenuManagementPage tipo="BEBIDA" />}
          />
          <Route path="inventory" element={<InventoryManagementPage />} />
          <Route path="orders" element={<OrdersManagementPage />} />
          <Route path="tables" element={<TablesManagementPage />} />
          <Route path="reservas" element={<ReservationsManagementPage />} />

          {/* ✨ NUEVAS RUTAS DE INVENTARIO DINÁMICO ✨ */}
          <Route
            path="categorias-inventario"
            element={<CategoriasInventario />}
          />
          <Route path="tipos-gasto" element={<TiposGasto />} />
          <Route path="unidades-medida" element={<UnidadesMedida />} />
          <Route
            path="productos-inventario"
            element={<ProductosInventario />}
          />
          <Route path="compras" element={<Compras />} />

          <Route path="cierre-inventario" element={<CierreInventario />} />
          <Route
            path="cierre-inventario/nuevo"
            element={<NuevoCierreInventario />}
          />
          <Route
            path="cierre-inventario/:id"
            element={<DetalleCierreInventario />}
          />
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
    if (!tenantId) {
      return <GlobalRoutes />;
    }

    const currentPath = window.location.pathname;

    // Rutas de administración
    if (
      currentPath.startsWith("/dashboard") ||
      currentPath.startsWith("/login")
    ) {
      return <TenantPrivateRoutes />;
    }

    // Cualquier otra ruta = Landing REAL del restobar + catálogo
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
