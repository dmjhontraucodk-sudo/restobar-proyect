// frontend/src/app/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";

// --- Páginas Globales (SaaS) ---
import { Landing } from "@pages/public/landing/LandingPage";
import RegisterPage from "@pages/public/auth/RegisterPage";
import { CartDemo } from "@features/cart";
import { ReservationFormDemo } from "@features/reservations";

// --- Páginas y Layouts del Tenant ---
import LoginPage from "@pages/public/auth/LoginPage";
import DashboardLayout from "@shared/layouts/DashboardLayout";

// --- Dashboard Pages ---
import Overview from '@pages/dashboard/overview/OverviewPage';
import MenuManagementPage from "@pages/dashboard/menu/MenuManagementPage";
import OrdersManagementPage from "@pages/dashboard/orders/OrdersManagementPage";
import WebOrdersManagementPage from "@pages/dashboard/orders/WebOrdersManagementPage";
import TablesManagementPage from "@pages/dashboard/tables/TablesManagementPage";
import ReservationsManagementPage from "@pages/dashboard/reservations/ReservationsManagementPage";
import TeamManagement from '@pages/dashboard/TeamManagement';
import ConfigurationPage from '@pages/dashboard/config/ConfigurationPage';
import ReportsPage from '@pages/dashboard/reports/ReportsPage';
import KitchenManagementPage from '@pages/dashboard/KitchenManagement'; // Checking if this exists

// ✨ PÁGINAS DE INVENTARIO (Legacy/To Refactor)
// These files are in src/pages/dashboard/inventario.
// They were NOT moved in this refactor as per plan to focus on structure first.
// They should be imported from their current location.
import InventarioPage from "../../pages/dashboard/inventario/InventarioPage";
import TiposGasto from "../../pages/dashboard/inventario/TiposGasto";
import KardexPage from "../../pages/dashboard/inventario/KardexPage";
import Compras from "../../pages/dashboard/inventario/Compras";
import CierreInventario from "../../pages/dashboard/inventario/CierreInventario";
import NuevoCierreInventario from "../../pages/dashboard/inventario/NuevoCierreInventario";
import DetalleCierreInventario from "../../pages/dashboard/inventario/DetalleCierreInventario";

// ✨ PÁGINAS DE FINANZAS (Legacy/To Refactor)
// These are in src/pages/dashboard/Finanzas.
import Gastos from "../../pages/dashboard/Finanzas/Gastos";
import CajaPage from "../../pages/dashboard/Finanzas/CajaPage";
import HistorialCajasPage from "../../pages/dashboard/Finanzas/HistorialCajasPage";
import FinancialPage from "../../pages/dashboard/Finanzas/FinancialPage";
import NominaPage from "../../pages/dashboard/Finanzas/NominaPage";

// 👤 PÁGINAS DE USUARIO
import { ProfilePage } from '../../pages/dashboard/ProfilePage';

// --- Páginas Públicas del Tenant (Restobar) ---
import RestobarLanding from "@pages/public/tenant-landing/RestobarLandingPage";
import ProductCatalog from "@pages/public/catalog/ProductCatalogPage";
import Cart from "@pages/public/cart/CartPage";
import Checkout from "@pages/public/checkout/CheckoutPage";
import ReservationForm from "@pages/public/reservation/ReservationFormPage";
//--Reseñas--///
import { ReviewsList } from "@features/reviews";

// --- Componentes y Gestión ---
import ProtectedRoute from "./ProtectedRoute";
import TenantGuard from "./TenantGuard";



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
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/cart" element={<CartDemo />} />
    <Route path="/reservar" element={<ReservationFormDemo />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

// --- Rutas Públicas del Tenant (Restobar Real) ---
const TenantPublicRoutes = () => (
  <Routes>
    <Route path="/" element={<RestobarLanding />} />
    <Route path="/catalog" element={<ProductCatalog />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/reservar" element={<ReservationForm />} />
    <Route path="/reviews" element={<ReviewsList />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
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
          <Route path="configuration" element={<ConfigurationPage />} />

          {/* 📦 INVENTARIO */}
          <Route path="inventario" element={<InventarioPage />} />
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

          {/* 📈 REPORTES */}
          <Route path="reports" element={<ReportsPage />} />

          {/* 👤 PERFIL Y CONFIGURACIÓN */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="configuration" element={<ConfigurationPage />} />
        </Route>
      </Route>
    </Route>

    {/* Redirecciones */}
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
);

export const AppRoutes = () => {
  const tenantId = getTenantId();

  const getRoutesToRender = () => {
    if (!tenantId) return <GlobalRoutes />;

    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/dashboard") || currentPath.startsWith("/login")) {
      return <TenantPrivateRoutes />;
    }
    return <TenantPublicRoutes />;
  };

  return getRoutesToRender();
};
