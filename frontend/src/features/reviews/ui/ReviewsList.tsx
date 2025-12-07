import { Star, Quote, CheckCircle } from 'lucide-react';
import { usePublicReviews } from '../model/usePublicReviews';
import type { PublicReview } from '../../../shared/types/reviews.types';

// Componente auxiliar para renderizar estrellas
const renderStars = (rating: number) => {
  return (
    <div className="flex space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={18}
          className={`${star <= rating 
            ? 'text-amber-500 fill-amber-500' 
            : 'text-gray-200 fill-gray-50'
          } transition-colors duration-200`}
        />
      ))}
    </div>
  );
};

export function ReviewsList() {
  const { reviews, loading, error } = usePublicReviews();

  if (loading === 'loading') {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        <span className="ml-3 text-gray-600">Cargando reseñas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
          <div className="text-red-500 text-2xl">!</div>
        </div>
        <p className="text-red-600 font-medium">Error al cargar las reseñas</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6">
          <Star className="w-10 h-10 text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Sé el primero!</h3>
        <p className="text-gray-600 mb-6">Comparte tu experiencia gastronómica con nosotros.</p>
        <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105">
          Escribir reseña
        </button>
      </div>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado mejorado */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-2"></div>
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Experiencias reales de quienes han disfrutado nuestra cocina
          </p>
        </div>

        {/* Grid de reseñas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review: PublicReview) => (
            <div 
              key={review.id} 
              className="group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
            >
              {/* Elemento decorativo superior */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-amber-500 rounded-t-2xl"></div>
              
              {/* Icono de cita */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote size={48} className="text-gray-400" />
              </div>

              {/* Contenido de la reseña */}
              <div className="relative">
                {/* Estrellas */}
                <div className="mb-6">
                  {renderStars(review.calificacion_general)}
                </div>

                {/* Comentario */}
                {review.comentario && (
                  <div className="mb-8 relative">
                    <div className="absolute -top-3 -left-3 text-blue-400 opacity-20">
                      <Quote size={24} />
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed line-clamp-4 pl-4">
                      "{review.comentario}"
                    </p>
                  </div>
                )}

                {/* Información del cliente */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center">
                    {/* Avatar placeholder */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-amber-400 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {review.clientes.nombre.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-lg">
                          {review.clientes.nombre}
                        </h4>
                        <CheckCircle className="w-5 h-5 text-green-500 fill-green-50" />
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500 font-medium">
                          Cliente Verificado
                        </span>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <span className="text-xs text-gray-400">
                          Experiencia Gastronómica
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Efecto hover sutil */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-amber-100 transition-colors duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Footer de la sección */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            <span className="font-semibold text-amber-600">{reviews.length}</span> reseñas verificadas • 
            <span className="mx-2">•</span>
            <span className="font-medium text-gray-900">Promedio: </span>
            <span className="inline-flex items-center text-amber-600 font-bold ml-1">
              {(
                reviews.reduce((acc, r) => acc + r.calificacion_general, 0) / reviews.length
              ).toFixed(1)}
              <Star size={16} className="ml-1 fill-amber-500 text-amber-500" />
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}