// src/pages/public/components/Hero.tsx
import { ChevronDown, Star, Clock, MapPin, ArrowRight } from "lucide-react";

interface HeroProps {
  onScrollToMenu: () => void;
}

export function Hero({ onScrollToMenu }: HeroProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden">
      {/* --- COLUMNA IZQUIERDA: CONTENIDO PROFESIONAL --- */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16 z-10 bg-white">
        {/* Encabezado minimalista */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Perú en cada
            <span className="text-blue-600 block">bocado</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-md">
            Sabores que narran nuestra historia, ingredientes que honran nuestra
            tierra. La esencia del Perú servida en cada creación culinaria.
          </p>
        </div>

        {/* Botones compactos */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            onClick={onScrollToMenu}
            className="flex items-center justify-center gap-3 bg-blue-600 text-white font-semibold px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            <span>Ver Menú Completo</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onScrollToMenu}
            className="flex items-center justify-center border border-slate-300 text-slate-700 font-semibold px-8 py-4 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
          >
            Reservar Mesa
          </button>
        </div>

        {/* Stats profesionales */}
        <div className="grid grid-cols-3 gap-8 border-t border-slate-100 pt-8">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Star size={18} className="text-blue-600" fill="currentColor" />
            </div>
            <div>
              <div className="font-bold text-xl text-slate-900">4.9</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Rating
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-100 pl-8">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock size={18} className="text-green-600" />
            </div>
            <div>
              <div className="font-bold text-xl text-slate-900">20'</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Entrega
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-100 pl-8">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MapPin size={18} className="text-purple-600" />
            </div>
            <div>
              <div className="font-bold text-xl text-slate-900">Centro</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Ubicación
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- COLUMNA DERECHA: IMAGEN CON DESVANECIMIENTO EN IZQUIERDA E INFERIOR --- */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative bg-slate-100">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920)",
          }}
        />

        {/* Overlay con desvanecimiento en izquierda e inferior */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent 
                      md:bg-gradient-to-r md:from-white md:via-white/80 md:via-40% md:to-transparent"
        ></div>

        {/* Desvanecimiento adicional en la parte inferior */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent 
                      md:bg-gradient-to-t md:from-white/30 md:via-transparent md:to-transparent"
        ></div>

        {/* Botón scroll down */}
        <div className="absolute bottom-6 right-6">
          <button
            onClick={onScrollToMenu}
            className="bg-white text-slate-700 p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
