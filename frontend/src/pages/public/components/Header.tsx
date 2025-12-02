// src/pages/public/components/Header.tsx - CON CONFIGURACIÓN GLOBAL
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Phone, Clock, UserPlus, CalendarCheck, Menu, X } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useGlobalConfig } from '../../../hooks/useGlobalConfig'; // ⭐ NUEVO

interface HeaderProps {
  tenantName?: string; // ⚠️ Ahora opcional, se usa solo como fallback
  isDemo?: boolean; 
}

export default function Header({ 
  tenantName, // Ya no tiene valor por defecto
  isDemo = false,
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ⭐ NUEVO: Usar configuración global
  const { 
    nombreNegocio, 
    logoUrl, 
    telefono, 
    horarios,
    eslogan 
  } = useGlobalConfig();

  // ⭐ Usar nombre configurado o fallback
  const displayName = nombreNegocio || tenantName || 'RestoBar';
  const displayPhone = telefono || (isDemo ? '944 429 458' : '987 654 321');
  const displaySchedule = `${horarios.apertura} - ${horarios.cierre}`;

  const isActive = (path: string) => location.pathname === path;

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      scrollToTop();
    }
    setIsMobileMenuOpen(false);
  };

  const handleInicioClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        scrollToTop();
      }, 100);
    } else {
      scrollToTop();
    }
    setIsMobileMenuOpen(false);
  };

  const handleMenuClick = () => {
    if (location.pathname !== '/') {
      navigate('/menu'); 
    } else {
      scrollToMenu();
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      const headerHeight = 80;
      const elementPosition = menuSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navItems = [
    { label: 'Inicio', onClick: handleInicioClick, active: isActive('/') },
    { label: 'Menú', onClick: handleMenuClick, active: false },
    { 
      label: 'Reservar', 
      onClick: () => handleNavigation('/reservar'), 
      active: isActive('/reservar'),
      icon: <CalendarCheck size={18} />
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* ⭐ Logo y Nombre CON CONFIGURACIÓN */}
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-4 group flex-shrink-0"
            >
              {/* ⭐ NUEVO: Logo si existe */}
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={displayName}
                  className="w-12 h-12 object-cover rounded-lg shadow-md"
                />
              )}
              
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {displayName}
                </h1>
                <p className="text-blue-600 text-sm font-medium">
                  {isDemo ? 'Demo Interactiva' : (eslogan || 'Experiencia Gastronómica')}
                </p>
              </div>
            </button>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    item.active
                      ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Botón CARRITO */}
              <button
                onClick={() => handleNavigation('/cart')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                  isActive('/cart')
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200'
                }`}
              >
                <ShoppingBag size={20} />
                <span>Carrito</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* Botón de registro en DEMO */}
              {isDemo && (
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <UserPlus size={18} />
                  Crear mi RestoBar
                </Link>
              )}
            </nav>

            {/* ⭐ Información de Contacto Desktop CON CONFIGURACIÓN */}
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Phone size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">
                    {displayPhone}
                  </p>
                  <p className="text-blue-600 text-xs">Llámanos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">{displaySchedule}</p>
                  <p className="text-blue-600 text-xs">Todos los días</p>
                </div>
              </div>
            </div>

            {/* Menú Mobile */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Botón Carrito Mobile */}
              <button
                onClick={() => handleNavigation('/cart')}
                className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ShoppingBag size={20} className="text-white" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg animate-pulse">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* Botón Menú Hamburguesa */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X size={20} className="text-white" />
                ) : (
                  <Menu size={20} className="text-white" />
                )}
              </button>
            </div>
          </div>

          {/* ⭐ Menú Mobile Desplegable CON CONFIGURACIÓN */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-blue-100 shadow-xl">
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-base font-semibold transition-all duration-300 ${
                      item.active
                        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
                
                {/* Información de Contacto Mobile CON CONFIGURACIÓN */}
                <div className="pt-4 border-t border-blue-100 space-y-3">
                  <div className="flex items-center space-x-3 bg-blue-50 px-4 py-3 rounded-xl">
                    <Phone size={18} className="text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">
                        {displayPhone}
                      </p>
                      <p className="text-blue-600 text-sm">Llámanos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-blue-50 px-4 py-3 rounded-xl">
                    <Clock size={18} className="text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">{displaySchedule}</p>
                      <p className="text-blue-600 text-sm">Todos los días</p>
                    </div>
                  </div>
                </div>

                {/* Botón de registro en DEMO Mobile */}
                {isDemo && (
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-base font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <UserPlus size={18} />
                    <span>Crear mi RestoBar</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      
      <div className="h-20"></div>
    </>
  );
}