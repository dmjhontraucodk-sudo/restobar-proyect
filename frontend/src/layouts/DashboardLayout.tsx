import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../hooks/useSidebar';
import { Sidebar } from '../components/dashboard/Sidebar/Sidebar';
import { Header } from '../components/dashboard/Header/Header';
import { MobileMenu } from '../components/dashboard/MobileMenu/MobileMenu';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const {
    isPinned,
    setIsHovering,
    isCollapsed,
    showFlyout,
    sidebarWidthClass,
    mainContentMarginClass,
    togglePin,
  } = useSidebar();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ✅ CORRECCIÓN 1: Manejo de 'user' nulo
  // Si el usuario no ha cargado, TypeScript sabe que no debe seguir.
  // Esto soluciona los errores de "Type 'User | null' is not assignable to type 'User'".
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Lógica del hover
  const handleSidebarEnter = () => {
    if (isCollapsed) {
      setIsHovering(true);
    }
  };

  // ✅ CORRECCIÓN 2: Comprobación de 'relatedTarget' nulo
  const handleSidebarLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as Node;
    const sidebar = event.currentTarget;
    const flyout = document.querySelector('.flyout-container');
    
    // Si el target es null (ratón fuera de la ventana), cerrar.
    // Esto soluciona el "TypeError: Failed to execute 'contains' on 'Node'".
    if (relatedTarget === null) {
      setIsHovering(false);
      return;
    }
    
    if (!sidebar.contains(relatedTarget) && (!flyout || !flyout.contains(relatedTarget))) {
      setIsHovering(false);
    }
  };

  // ✅ CORRECCIÓN 2 (bis): Comprobación de 'relatedTarget' nulo
  const handleFlyoutLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as Node;
    const flyout = event.currentTarget;
    const sidebar = document.querySelector('.sidebar-container');
    
    // Si el target es null (ratón fuera de la ventana), cerrar.
    if (relatedTarget === null) {
      setIsHovering(false);
      return;
    }
    
    if (!flyout.contains(relatedTarget) && (!sidebar || !sidebar.contains(relatedTarget))) {
      setIsHovering(false);
    }
  };

  return (
    // ✅ CORRECCIÓN 3: Actualización de clase Tailwind (sugerencia)
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar Desktop */}
      <Sidebar
        isCollapsed={isCollapsed}
        showFlyout={showFlyout}
        sidebarWidthClass={sidebarWidthClass}
        onSidebarEnter={handleSidebarEnter}
        onSidebarLeave={handleSidebarLeave}
        onFlyoutLeave={handleFlyoutLeave}
        onLinkClick={() => setIsMobileMenuOpen(false)}
        user={user} // Ya no da error de TypeScript
      />

      {/* Área de Contenido Principal */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${mainContentMarginClass}`}
      >
        
        {/* Header */}
        <Header
          isPinned={isPinned}
          onTogglePin={togglePin}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          location={location}
          user={user} // Ya no da error de TypeScript
          logout={logout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}