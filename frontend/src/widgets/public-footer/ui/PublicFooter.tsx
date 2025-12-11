// src/pages/public/components/Footer.tsx - CON CONFIGURACIÓN GLOBAL
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MapPin, Clock, Instagram, Facebook, Mail } from 'lucide-react';
import { useCart } from '@app/providers/CartProvider';
import { useGlobalConfig } from '@shared/hooks/useGlobalConfig'; // ⭐ NUEVO

interface FooterProps {
  tenantName?: string; // ⚠️ Ahora opcional
  isDemo?: boolean;
}

export default function Footer({ tenantName, isDemo = false }: FooterProps) {
  const navigate = useNavigate();
  const { getTotalItems } = useCart();

  // ⭐ NUEVO: Usar configuración global
  const { 
    nombreNegocio,
    logoUrl,
    eslogan,
    telefono,
    email,
    direccion,
    horarios,
    facebook,
    instagram
  } = useGlobalConfig();

  // ⭐ Usar valores configurados o fallbacks
  const displayName = nombreNegocio || tenantName || 'RestoBar';
  const displayPhone = telefono || (isDemo ? '944 429 458' : '987 654 321');
  const displayEmail = email || 'contacto@restobar.com';
  const displayAddress = direccion || 'Av. Principal 123, Lima, Perú';
  const displaySchedule = `${horarios.apertura} - ${horarios.cierre}`;

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* ⭐ Información del Restobar CON LOGO */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              {/* ⭐ NUEVO: Logo si existe */}
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={displayName}
                  className="w-10 h-10 object-cover rounded-lg shadow-sm"
                />
              )}
              
              <div>
                <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
                <p className="text-blue-600 text-xs font-medium">
                  {isDemo ? 'Demo Interactiva' : (eslogan || 'Experiencia Gastronómica')}
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 max-w-md">
              {isDemo 
                ? 'Demostración interactiva de RestoBar. Crea tu restaurante en minutos.'
                : 'Experiencia culinaria única con sabores auténticos e ingredientes frescos.'
              }
            </p>
            
            {/* ⭐ Redes Sociales CON CONFIGURACIÓN */}
            <div className="flex space-x-2">
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all duration-300"
                >
                  <Instagram size={14} />
                </a>
              )}
              
              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  <Facebook size={14} />
                </a>
              )}
              
              {/* Si no hay redes configuradas, mostrar placeholders */}
              {!instagram && !facebook && (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* ⭐ Contacto CON CONFIGURACIÓN */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Contacto</h4>
            <div className="space-y-2">
              {/* Teléfono */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone size={14} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{displayPhone}</p>
                  <p className="text-xs text-gray-500">Pedidos y reservas</p>
                </div>
              </div>
              
              {/* Email */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail size={14} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{displayEmail}</p>
                  <p className="text-xs text-gray-500">Escríbenos</p>
                </div>
              </div>
              
              {/* Dirección */}
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin size={14} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{displayAddress}</p>
                  <p className="text-xs text-gray-500">Visítanos</p>
                </div>
              </div>
              
              {/* Horario */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock size={14} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{displaySchedule}</p>
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
              © {new Date().getFullYear()} {displayName}. Todos los derechos reservados.
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