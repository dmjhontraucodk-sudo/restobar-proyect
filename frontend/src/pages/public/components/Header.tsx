// src/pages/public/components/Header.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Phone, Clock, UserPlus, CalendarCheck} from 'lucide-react';
import { useCart } from '../../../context/CartContext';

interface HeaderProps {
  tenantName?: string;
  isDemo?: boolean; 
}

export default function Header({ 
  tenantName = 'RestoBar Premium', 
  isDemo = false,
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalItems } = useCart();

  const isActive = (path: string) => location.pathname === path;

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      scrollToTop();
    }
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
  };

// La función handleMenuClick ahora solo navega a /menu si no está en raíz
  const handleMenuClick = () => {
    if (location.pathname !== '/') {
      navigate('/menu'); 
    } else {
      // Si ya está en la Landing (raíz), hace scroll al menú
      scrollToMenu();
    }
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

return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo y Nombre */}
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-4 group"
            >
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {tenantName}
                </h1>
                <p className="text-blue-600 text-sm font-medium">
                  {isDemo ? 'Demo Interactiva' : 'Experiencia Gastronómica'}
                </p>
              </div>
            </button>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center space-x-4">
              {/* Botón INICIO (sin cambios) */}
              <button
                onClick={handleInicioClick}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive('/')
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200'
                }`}
              >
                Inicio
              </button>
              
              {/* Botón MENÚ (sin cambios) */}
              <button
                onClick={handleMenuClick}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-300"
              >
                Menú
              </button>
              
              {/* ✨ BOTÓN RESERVAR (NUEVO COMPORTAMIENTO: Navegación de Ruta) */}
              <button
                // Navega a la ruta /reservar, que contendrá el formulario.
                onClick={() => navigate('/reservar')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive('/reservar') // Usa isActive para el estilo
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200'
                }`}
              >
                <CalendarCheck size={20} />
                Reservar
              </button>

              {/* Botón CARRITO (Activo/Inactivo) */}
              <button
                onClick={() => navigate('/cart')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                  isActive('/cart')
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200'
                }`}
              >
                <ShoppingBag size={20} />
                <span>Carrito</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* SOLO mostrar botón de registro en DEMO */}
              {isDemo && (
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <UserPlus size={18} />
                  Crear mi RestoBar
                </Link>
              )}
            </nav>
            {/* Información de Contacto Desktop */}
            <div className="hidden lg:flex items-center space-x-8 text-sm">
              <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Phone size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">
                    {isDemo ? '944 429 458' : '987 654 321'}
                  </p>
                  <p className="text-blue-600 text-xs">Llámanos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">8:00 - 23:00</p>
                  <p className="text-blue-600 text-xs">Todos los días</p>
                </div>
              </div>
            </div>

            {/* Carrito Mobile */}
            <button
              onClick={() => navigate('/cart')}
              className="md:hidden relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ShoppingBag size={22} className="text-white" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      
      <div className="h-20"></div>
    </>
  );
}