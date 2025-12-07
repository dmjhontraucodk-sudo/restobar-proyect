import React, { useState, useEffect, useCallback } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, RefreshCw, MessageSquare, Star, User, Calendar } from 'lucide-react';

// Define the shape of a pending review object
interface PendingReview {
  id: number;
  calificacion_general: number;
  comentario: string | null;
  fecha_reseña: string;
  clientes: {
    nombre: string;
  };
}

const ReviewCard: React.FC<{
  review: PendingReview;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isProcessing: boolean;
}> = ({ review, onApprove, onReject, isProcessing }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-800">{review.clientes.nombre}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(review.fecha_reseña).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="w-5 h-5 fill-current" />
          <span className="font-bold text-lg">{review.calificacion_general}</span>
        </div>
      </div>
      
      {review.comentario && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-700 italic">"{review.comentario}"</p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => onApprove(review.id)}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          Aprobar
        </button>
        <button
          onClick={() => onReject(review.id)}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          Eliminar
        </button>
      </div>
    </div>
  );
};

const ReviewsManagementPage: React.FC = () => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getPendingReviews, approveReview, rejectReview } = useDashboardApi();

  const loadPendingReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPendingReviews();
      setPendingReviews(response.data);
    } catch (err: any) {
      setError('No se pudieron cargar las reseñas pendientes.');
      toast.error('Error al cargar reseñas.');
    } finally {
      setIsLoading(false);
    }
  }, [getPendingReviews]);

  useEffect(() => {
    loadPendingReviews();
  }, [loadPendingReviews]);

  const handleApprove = async (id: number) => {
    setIsProcessing(true);
    try {
      await approveReview(id);
      toast.success('Reseña aprobada y publicada.');
      setPendingReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error('Error al aprobar la reseña.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer.')) {
      setIsProcessing(true);
      try {
        await rejectReview(id);
        toast.success('Reseña eliminada correctamente.');
        setPendingReviews(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        toast.error('Error al eliminar la reseña.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Moderación de Reseñas
          </h1>
          <p className="text-gray-600 mt-1">
            Aprueba o rechaza las reseñas que requieren revisión manual.
          </p>
        </div>
        <button
          onClick={() => loadPendingReviews()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Cargando reseñas pendientes...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      ) : pendingReviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">¡Todo al día!</h3>
          <p className="text-gray-600">No hay reseñas pendientes de moderación.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingReviews.map(review => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              onApprove={handleApprove} 
              onReject={handleReject}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsManagementPage;
