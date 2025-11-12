// src/pages/public/components/Footer.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MapPin, Clock, Instagram, Facebook } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

interface FooterProps {
  tenantName?: string;
  isDemo?: boolean; // Agregar esta prop
}

export default function Footer({ tenantName = 'RestoBar Premium', isDemo = false }: FooterProps) {
  const navigate = useNavigate();
  const { getTotalItems } = useCart();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Información del Restobar */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {tenantName}
              </h3>
              <p className="text-blue-600 text-sm font-medium">
                {isDemo ? 'Demo Interactiva' : 'Experiencia Gastronómica'}
              </p>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              {isDemo 
                ? 'Descubre cómo funciona RestoBar con esta demostración interactiva. Crea tu propio restaurante en minutos.'
                : 'Descubre una experiencia culinaria única donde cada plato cuenta una historia. Sabores auténticos, ingredientes frescos y un ambiente inolvidable.'
              }
            </p>
            
            <div className="flex space-x-3">
              <a
                href="#"
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-600">
                <Phone size={16} className="text-blue-600" />
                <div>
                  <p className="font-medium">{isDemo ? '944 429 458' : '987 654 321'}</p>
                  <p className="text-sm text-gray-500">Pedidos y reservas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <MapPin size={16} className="text-blue-600" />
                <div>
                  <p className="font-medium">Av. Principal 123</p>
                  <p className="text-sm text-gray-500">Lima, Perú</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <Clock size={16} className="text-blue-600" />
                <div>
                  <p className="font-medium">8:00 - 23:00</p>
                  <p className="text-sm text-gray-500">Todos los días</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Enlaces</h4>
            <div className="space-y-3">
              <Link
                to="/"
                className="block text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Inicio
              </Link>
              <button
                onClick={() => navigate('/cart')}
                className="block text-gray-600 hover:text-blue-600 transition-colors font-medium text-left"
              >
                Tu Carrito ({getTotalItems()})
              </button>
              
              {/* Solo mostrar enlace de registro en demo */}
              {isDemo && (
                <Link
                  to="/register"
                  className="block text-green-600 hover:text-green-700 font-semibold transition-colors"
                >
                  Crear mi RestoBar
                </Link>
              )}
              
              <a
                href="#"
                className="block text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Sobre Nosotros
              </a>
              <a
                href="#"
                className="block text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Políticas de Delivery
              </a>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} {tenantName}. Todos los derechos reservados.
            </p>
            
            {/* Mensaje especial para demo */}
            {isDemo && (
              <p className="text-gray-500 text-sm">
                Esta es una demostración interactiva de <span className="font-semibold">RestoBar</span>
              </p>
            )}
            
            <div className="flex space-x-6 text-sm text-gray-500">
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