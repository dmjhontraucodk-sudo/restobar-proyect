// frontend/src/features/reviews/ui/ReviewForm.tsx (VERSIÓN CORREGIDA)

import { useState } from 'react';
import { Star } from 'lucide-react';
// Importamos directamente el cliente API (Ruta relativa más segura)
import { useWebApi } from '@shared/api/useWebApi'; 
// Importamos los tipos consolidados (Ruta relativa más segura)
import type { CreateReviewData } from '../../../shared/types/reviews.types'; 

interface ReviewFormProps {
    clienteId: number;
    ordenId?: number; 
    onReviewSubmitted: (needsApproval: boolean) => void;
}

export function ReviewForm({ clienteId, ordenId, onReviewSubmitted }: ReviewFormProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { createReview, isLoading } = useWebApi();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const data: CreateReviewData = {
            cliente_id: clienteId,
            orden_id: ordenId,
            calificacion_general: rating,
            comentario: comment || null,
        };

        try {
            // response es de tipo ApiResponse<{ needsApproval: boolean }>
            const response = await createReview(data);
            
            // ✅ CORRECCIÓN 2: Leemos el mensaje del nivel superior de la ApiResponse
            const successMessage = response.message || '¡Gracias por tu reseña!';

            setMessage({ 
                type: 'success', 
                text: successMessage
            });
            onReviewSubmitted(response.data?.needsApproval || false);
            setComment('');
            setRating(5);

        } catch (error: any) {
            console.error(error);
            // Si el error viene de axios, el mensaje de error puede estar en error.response.data.error
            const errorMessage = error.response?.data?.error || error.message || 'Error al enviar la reseña.';
            setMessage({ 
                type: 'error', 
                text: errorMessage
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold">Califica tu Experiencia</h3>
            
            {/* Selector de Estrellas */}
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={24}
                        className={`cursor-pointer transition-colors ${
                            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => setRating(star)}
                    />
                ))}
                <span className="ml-3 text-sm text-gray-600">({rating} estrellas)</span>
            </div>

            {/* Comentario */}
            <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Comentario (Opcional)
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    placeholder="Comparte tu opinión..."
                />
            </div>

            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
            
            {/* ✅ CORRECCIÓN 1: Eliminamos la dependencia @shared/ui/Button y usamos un botón HTML estándar */}
            <button 
                type="submit" 
                disabled={isLoading || rating === 0}
                className={`w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm ${
                    (isLoading || rating === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Enviando...
                    </>
                ) : (
                    'Enviar Reseña'
                )}
            </button>
        </form>
    );
}