// src/pages/public/components/Hero.tsx
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  onScrollToMenu: () => void;
}

export function Hero({ onScrollToMenu }: HeroProps) {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/40"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
          Sabores que Inspiran,
          <br />
          <span className="text-blue-600">Momentos que Perduran</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-700 mb-12 font-light">
          Experiencia gastronómica premium con delivery y take away
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={onScrollToMenu}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-full text-lg transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/30"
          >
            Ver Menú Completo
          </button>
          <button
            onClick={onScrollToMenu}
            className="bg-white/90 hover:bg-white text-gray-900 font-semibold px-10 py-4 rounded-full text-lg transition-all backdrop-blur-md border border-gray-300 shadow-lg"
          >
            Pedir Delivery
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-2xl">★</span>
            <span className="font-medium">4.8/5 · 250+ reseñas</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚚</span>
            <span className="font-medium">Delivery en 35 min</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <span className="font-medium">Av. Principal 123, Lima</span>
          </div>
        </div>
      </div>

      <button
        onClick={onScrollToMenu}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 hover:text-blue-600 transition-colors animate-bounce"
      >
        <ChevronDown size={40} />
      </button>
    </div>
  );
}