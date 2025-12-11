// src/pages/public/virtual-menu/VirtualMenuPage.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWebApi, type ApiMesa } from '@shared/api/useWebApi';
import { useGlobalConfig } from '@shared/hooks/useGlobalConfig';
import { VirtualMenuCatalog } from '@features/menu/products/ui/VirtualMenuCatalog';
import toast from 'react-hot-toast';
import { BellRing, UtensilsCrossed } from 'lucide-react';

export default function VirtualMenuPage() {
  const [searchParams] = useSearchParams();
  const { getTableDetails, callWaiter } = useWebApi();
  const { nombreNegocio, logoUrl, eslogan } = useGlobalConfig();
  
  const [table, setTable] = useState<ApiMesa | null>(null);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mesaId = searchParams.get('mesa');

  useEffect(() => {
    if (mesaId) {
      const id = parseInt(mesaId);
      if (!isNaN(id)) {
        getTableDetails(id)
          .then(setTable)
          .catch(err => {
            console.error('Error cargando mesa:', err);
            setError('Mesa no identificada');
          });
      }
    }
  }, [mesaId]);

  const handleCallWaiter = async () => {
    if (!table || isCallingWaiter) return;
    
    setIsCallingWaiter(true);
    try {
      await callWaiter(table.id);
      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">¡Personal notificado! 🔔</span>
          <span className="text-xs">En breve se acercarán a tu mesa.</span>
        </div>,
        { duration: 4000 }
      );
    } catch (error) {
      toast.error('Error al llamar al personal. Intenta de nuevo.');
    } finally {
      setTimeout(() => setIsCallingWaiter(false), 30000);
    }
  };

  if (error) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
              <div className="bg-white p-8 rounded-2xl shadow-lg max-w-xs w-full border border-gray-100">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UtensilsCrossed className="text-red-500" size={32} />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace Inválido</h1>
                  <p className="text-gray-500 text-sm">Por favor, escanea nuevamente el código QR de tu mesa.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* --- HEADER RESPONSIVO --- */}
      <div className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Identidad del Negocio */}
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
              <div className="shrink-0">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-lg sm:text-xl">
                    {nombreNegocio?.charAt(0) || 'R'}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="font-bold text-gray-900 text-base sm:text-xl leading-tight truncate">
                  {nombreNegocio || 'Carta Digital'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">
                  {eslogan || '¡Bienvenido! Disfruta nuestra carta.'}
                </p>
                <p className="text-xs text-gray-500 truncate sm:hidden">
                  ¡Bienvenido!
                </p>
              </div>
            </div>

            {/* Indicador de Mesa (Pill) */}
            {table && (
              <div className="flex items-center bg-green-50 border border-green-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm shrink-0 transition-transform hover:scale-105">
                <span className="relative flex h-2.5 w-2.5 mr-2 sm:mr-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] sm:text-xs text-green-600 font-bold uppercase leading-none mb-0.5">Mesa</span>
                  <span className="text-sm sm:text-base font-extrabold text-green-700 leading-none">{table.nombre_o_numero}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CONTENIDO DE LA CARTA (GRID RESPONSIVO) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <VirtualMenuCatalog />
      </div>

      {/* --- BOTÓN FLOTANTE (LLAMAR MOZO) --- */}
      {table && (
        <div className="fixed z-50 pointer-events-none
                    bottom-6 left-0 right-0 flex justify-center px-4       /* Mobile: Centrado, con padding */
                    md:bottom-8 md:right-8 md:left-auto md:justify-end md:w-auto md:px-0 /* Desktop: Esquina inferior derecha */
        ">
          <button
            onClick={handleCallWaiter}
            disabled={isCallingWaiter}
            className={`
              pointer-events-auto
              group relative flex items-center justify-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4
              rounded-full shadow-2xl font-bold text-white transition-all duration-300
              transform active:scale-95 w-full max-w-xs sm:max-w-md md:w-auto /* Ancho adaptable para el botón */
              ${isCallingWaiter 
                ? 'bg-gray-500 cursor-wait' 
                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 hover:shadow-red-500/30'
              }
            `}
          >
            {/* Efecto de onda (Ping) detrás del icono */}
            {!isCallingWaiter && (
              <span className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 flex h-10 w-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-20"></span>
              </span>
            )}

            <BellRing 
              size={20} 
              className={`relative z-10 ${isCallingWaiter ? '' : 'group-hover:rotate-12 transition-transform'}`} 
            />
            
            <span className="relative z-10 text-sm sm:text-base uppercase tracking-wide">
              {isCallingWaiter ? 'Notificando...' : 'Llamar al Mozo'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}