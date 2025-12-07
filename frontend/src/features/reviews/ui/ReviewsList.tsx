import React, { useState, useEffect } from 'react';
import { Star, Quote, CheckCircle, User, FileText } from 'lucide-react';
import { usePublicReviews } from '../model/usePublicReviews';
import { useWebApi } from '@shared/api/useWebApi';
import { ReviewForm } from './ReviewForm';
import type { PublicReview } from '../../../shared/types/reviews.types';

// Componente para la lista de reseñas (existente)
const ReviewsDisplay: React.FC<{ reviews: PublicReview[] }> = ({ reviews }) => {
  // ... (código existente para mostrar estrellas y lista)
  const renderStars = (rating: number) => (
    <div className="flex space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={18}
          className={`${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200 fill-gray-50'} transition-colors duration-200`}
        />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {reviews.map((review: PublicReview) => (
        <div key={review.id} className="group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-amber-500 rounded-t-2xl"></div>
          <div className="absolute top-6 right-6 opacity-10"><Quote size={48} className="text-gray-400" /></div>
          <div className="relative">
            <div className="mb-6">{renderStars(review.calificacion_general)}</div>
            {review.comentario && (
              <div className="mb-8 relative">
                <div className="absolute -top-3 -left-3 text-blue-400 opacity-20"><Quote size={24} /></div>
                <p className="text-gray-700 text-lg leading-relaxed line-clamp-4 pl-4">"{review.comentario}"</p>
              </div>
            )}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-amber-400 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  {review.clientes.nombre.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-lg">{review.clientes.nombre}</h4>
                    <CheckCircle className="w-5 h-5 text-green-500 fill-green-50" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500 font-medium">Cliente Verificado</span>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <span className="text-xs text-gray-400">Experiencia Gastronómica</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-amber-100 transition-colors duration-500 pointer-events-none"></div>
        </div>
      ))}
    </div>
  );
};

// Componente para el formulario de verificación
const ClientVerificationForm: React.FC<{ onVerify: (documentId: string) => void, isLoading: boolean, error: string | null }> = ({ onVerify, isLoading, error }) => {
  const [documentId, setDocumentId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(documentId);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <User className="text-blue-600" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verificar Cliente</h1>
        <p className="text-gray-600 text-lg">Ingresa tu número de documento para dejar una reseña.</p>
        <p className="text-xs text-gray-500 mt-1">Solo clientes con pedidos entregados pueden escribir una reseña.</p>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="documentId" className="block text-sm font-medium text-gray-700 mb-2">Número de Documento</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="documentId"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="DNI, RUC, etc."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300 shadow-md">
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Buscando...
              </>
            ) : 'Verificar'}
          </button>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
};

// Componente principal que gestiona el flujo
export function ReviewsList() {
  const { reviews, loading, error: reviewsError, refetchReviews } = usePublicReviews();
  const { findClientForReview } = useWebApi();
  
  const [view, setView] = useState<'list' | 'submit' | 'success'>('list');
  const [verifiedClient, setVerifiedClient] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (documentId: string) => {
    if (!documentId.trim()) {
      setVerificationError('Por favor, ingresa un número de documento.');
      return;
    }
    setIsVerifying(true);
    setVerificationError(null);
    try {
      // Esta función se creará en el backend.
      // Devolverá el cliente si se encuentra y tiene un pedido entregado.
      const response = await findClientForReview(documentId);
      if (response.success && response.client) {
        setVerifiedClient(response.client);
        setView('submit');
      } else {
        setVerificationError(response.error || 'Cliente no encontrado o sin pedidos entregados.');
      }
    } catch (err) {
      setVerificationError('Ocurrió un error al verificar el documento.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReviewSubmitted = () => {
    setView('success');
    refetchReviews(); // Recargar la lista de reseñas
    setTimeout(() => {
      setView('list');
      setVerifiedClient(null);
    }, 5000); // Volver a la lista después de 5 segundos
  };

  if (view === 'submit' && verifiedClient) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-xl mx-auto px-4">
          <ReviewForm 
            clienteId={verifiedClient.id} 
            onReviewSubmitted={() => handleReviewSubmitted()} 
          />
        </div>
      </section>
    );
  }

  if (view === 'success') {
    return (
      <section className="py-16">
        <div className="text-center max-w-xl mx-auto">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-3xl font-bold text-gray-900">¡Gracias por tu reseña!</h2>
          <p className="text-gray-600 mt-2">Tu opinión es muy importante para nosotros.</p>
        </div>
      </section>
    );
  }

  if (view === 'list') {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Experiencias reales de quienes han disfrutado nuestra cocina
            </p>
          </div>

          {loading === 'loading' && <p>Cargando reseñas...</p>}
          {reviewsError && <p className="text-red-500">Error: {reviewsError}</p>}
          {reviews.length > 0 && <ReviewsDisplay reviews={reviews} />}
          
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">¿Disfrutaste tu comida?</h3>
            <button 
              onClick={() => setView('submit')}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Escribir una reseña
            </button>
          </div>
        </div>
      </section>
    );
  }
  
  // Default: show verification form
  return (
    <section className="py-16">
      <ClientVerificationForm onVerify={handleVerify} isLoading={isVerifying} error={verificationError} />
    </section>
  );
}