// src/pages/public/components/Footer.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MapPin, Clock, Instagram, Facebook } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

interface FooterProps {
  tenantName?: string;
  isDemo?: boolean;
}

export default function Footer({ tenantName = 'RestoBar Premium', isDemo = false }: FooterProps) {
  const navigate = useNavigate();
  const { getTotalItems } = useCart();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Información del Restobar */}
          <div className="md:col-span-2">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900">{tenantName}</h3>
              <p className="text-blue-600 text-xs font-medium mt-1">
                {isDemo ? 'Demo Interactiva' : 'Experiencia Gastronómica'}
              </p>
            </div>
            <p className="text-gray-600 text-sm mb-4 max-w-md">
              {isDemo 
                ? 'Demostración interactiva de RestoBar. Crea tu restaurante en minutos.'
                : 'Experiencia culinaria única con sabores auténticos e ingredientes frescos.'
              }
            </p>
            
            <div className="flex space-x-2">
              <a
                href="#"
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
              >
                <Instagram size={14} />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
              >
                <Facebook size={14} />
              </a>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Contacto</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone size={14} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{isDemo ? '944 429 458' : '987 654 321'}</p>
                  <p className="text-xs text-gray-500">Pedidos y reservas</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin size={14} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Av. Principal 123</p>
                  <p className="text-xs text-gray-500">Lima, Perú</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock size={14} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">8:00 - 23:00</p>
                  <p className="text-xs text-gray-500">Todos los días</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Enlaces</h4>
            <div className="space-y-2">
              <Link
                to="/"
                className="block text-gray-600 hover:text-blue-600 transition-colors text-sm"
              >
                Inicio
              </Link>
              <button
                onClick={() => navigate('/cart')}
                className="block text-gray-600 hover:text-blue-600 transition-colors text-sm text-left"
              >
                Carrito ({getTotalItems()})
              </button>
              
              {isDemo && (
                <Link
                  to="/register"
                  className="block text-green-600 hover:text-green-700 font-semibold transition-colors text-sm"
                >
                  Crear mi RestoBar
                </Link>
              )}
              
              <a
                href="#"
                className="block text-gray-600 hover:text-blue-600 transition-colors text-sm"
              >
                Sobre Nosotros
              </a>
              <a
                href="#"
                className="block text-gray-600 hover:text-blue-600 transition-colors text-sm"
              >
                Políticas
              </a>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-200 mt-6 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} {tenantName}. Todos los derechos reservados.
            </p>
            
            {isDemo && (
              <p className="text-gray-500 text-xs">
                Demostración de <span className="font-medium">RestoBar</span>
              </p>
            )}
            
            <div className="flex space-x-4 text-xs text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">Términos</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}