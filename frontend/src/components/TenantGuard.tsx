// src/components/TenantGuard.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'; // ✅ AÑADIR ESTA IMPORTACIÓN

export default function TenantGuard() {
  const { user, isLoading, currentTenant, validateTenantAccess, logout } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    console.log('🔍 [TENANT GUARD] Current tenant:', currentTenant);
    console.log('🔍 [TENANT GUARD] User tenant:', user?.tenantSubdomain);
    console.log('🔍 [TENANT GUARD] User:', user);

    if (!isLoading) {
      if (!user) {
        setAccessGranted(true);
        return;
      }

      if (!currentTenant) {
        console.log('ℹ️ [TENANT GUARD] En página principal sin tenant');
        setAccessGranted(true);
        return;
      }

      if (validateTenantAccess()) {
        console.log('✅ [TENANT GUARD] Access granted - Tenant match');
        setAccessGranted(true);
      } else {
        console.log('🚫 [TENANT GUARD] Access denied - Tenant mismatch');
        
        // ✅ MOSTRAR TOAST AL USUARIO
        toast.error(
          `🚫 Acceso Denegado\n\nNo tienes permisos para acceder a: ${currentTenant}.localhost\nTu cuenta pertenece a: ${user.tenantSubdomain}.localhost`,
          {
            duration: 6000,
            position: 'top-right',
          }
        );
        
        setAccessGranted(false);
        setShouldRedirect(true);
        
        setTimeout(() => {
          logout();
        }, 2000);
      }
    }
  }, [user, isLoading, currentTenant, validateTenantAccess, logout]);

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Verificando acceso...</div>
        </div>
      </div>
    );
  }

  if (!accessGranted && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="text-2xl text-red-600 mb-4">🚫 Acceso Denegado</div>
          <p className="text-gray-700 mb-2">
            No tienes permisos para acceder a <strong>{currentTenant}.localhost</strong>
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Tu tenant es: <strong>{user.tenantSubdomain}.localhost</strong>
          </p>
          <p className="text-gray-500 text-sm">Redirigiendo a la página principal...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}