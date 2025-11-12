// src/layouts/DashboardLayout.tsx
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
  
  // Lógica del hover mejorada
  const handleSidebarEnter = () => {
    if (isCollapsed) {
      setIsHovering(true);
    }
  };

  const handleSidebarLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as Node;
    const sidebar = event.currentTarget;
    const flyout = document.querySelector('.flyout-container');
    
    if (!sidebar.contains(relatedTarget) && (!flyout || !flyout.contains(relatedTarget))) {
      setIsHovering(false);
    }
  };

  const handleFlyoutLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as Node;
    const flyout = event.currentTarget;
    const sidebar = document.querySelector('.sidebar-container');
    
    if (!flyout.contains(relatedTarget) && (!sidebar || !sidebar.contains(relatedTarget))) {
      setIsHovering(false);
    }
  };

  return (
    // ✅ CAMBIO PRINCIPAL: Quita overflow-hidden y usa min-h-screen
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      
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
        user={user}
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
          user={user}
          logout={logout}
        />

        {/* ✅ Añade min-h-0 para permitir scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}