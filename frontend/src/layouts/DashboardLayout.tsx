import React, { useState, useRef } from 'react';
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
  
  // ✅ Usar useRef para referencias más confiables
  const sidebarRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  const handleSidebarEnter = () => {
    if (isCollapsed) {
      setIsHovering(true);
    }
  };

  // ✅ CORRECCIÓN DEFINITIVA: Manejo seguro de contains
  const handleSidebarLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    
    // Caso 1: relatedTarget es null (ratón salió de la ventana)
    if (relatedTarget === null) {
      setIsHovering(false);
      return;
    }
    
    // Caso 2: relatedTarget no es un elemento DOM válido
    if (!(relatedTarget instanceof HTMLElement)) {
      setIsHovering(false);
      return;
    }
    
    const sidebar = sidebarRef.current;
    const flyout = flyoutRef.current;
    
    // Caso 3: Verificar si el ratón fue a algún elemento fuera del sidebar/flyout
    const isInsideSidebar = sidebar?.contains(relatedTarget);
    const isInsideFlyout = flyout?.contains(relatedTarget);
    
    if (!isInsideSidebar && !isInsideFlyout) {
      setIsHovering(false);
    }
  };

  // ✅ CORRECCIÓN DEFINITIVA: Para flyout también
  const handleFlyoutLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    
    if (relatedTarget === null) {
      setIsHovering(false);
      return;
    }
    
    if (!(relatedTarget instanceof HTMLElement)) {
      setIsHovering(false);
      return;
    }
    
    const sidebar = sidebarRef.current;
    const flyout = flyoutRef.current;
    
    const isInsideSidebar = sidebar?.contains(relatedTarget);
    const isInsideFlyout = flyout?.contains(relatedTarget);
    
    if (!isInsideSidebar && !isInsideFlyout) {
      setIsHovering(false);
    }
  };

  return (
    // ✅ CORRECCIÓN: bg-gradient-to-br (no bg-linear-to-br)
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar Desktop - Agregar ref */}
      <div ref={sidebarRef}>
        <Sidebar
          isCollapsed={isCollapsed}
          showFlyout={showFlyout}
          sidebarWidthClass={sidebarWidthClass}
          onSidebarEnter={handleSidebarEnter}
          onSidebarLeave={handleSidebarLeave}
          onFlyoutLeave={handleFlyoutLeave}
          onLinkClick={() => setIsMobileMenuOpen(false)}
          user={user}
        />
      </div>

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
          user={user}
          logout={logout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0">
          <Outlet /> 
        </main>
      </div>

      {/* Flyout container con ref */}
      <div ref={flyoutRef} className="flyout-container"></div>
    </div>
  );
}