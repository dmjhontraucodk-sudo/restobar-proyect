// frontend/src/features/reviews/ui/ReviewsList.tsx


import { Star } from 'lucide-react';
// Importamos el hook desde la capa model del feature
import { usePublicReviews } from '../model/usePublicReviews';
// Asumimos que formatDate está disponible en la capa compartida 
// Importamos los tipos consolidados (aunque usePublicReviews ya los tiene, es buena práctica)
import type { PublicReview } from '../../../shared/types/reviews.types'; 

// Componente auxiliar para renderizar estrellas
const renderStars = (rating: number) => {
    return (
        <div className="flex space-x-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={16}
                    className={`${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );
};

export function ReviewsList() {
    const { reviews, loading, error } = usePublicReviews();

    if (loading === 'loading') {
        return <div className="text-center py-10">Cargando reseñas...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-600">Error al cargar las reseñas: {error}</div>;
    }

    if (reviews.length === 0) {
        return <div className="text-center py-10 text-gray-500">Sé el primero en dejar una reseña.</div>;
    }

    return (
        <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
                    Lo que dicen nuestros clientes
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((review: PublicReview) => (
                        <div key={review.id} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
                            <div className="flex justify-between items-center mb-4">
                                {renderStars(review.calificacion_general)}
                                <span className="text-xs text-gray-500">
                                </span>
                            </div>
                            
                            {review.comentario && (
                                <p className="text-gray-700 italic mb-4 line-clamp-4">
                                    "{review.comentario}"
                                </p>
                            )}

                            <div className="font-semibold text-gray-900">
                                {review.clientes.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                                Cliente Verificado
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}