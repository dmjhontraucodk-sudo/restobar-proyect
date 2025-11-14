// frontend/src/hooks/useWebReservations.ts
import { useState, useCallback } from 'react';
import { useWebApi } from '../../../hooks/useWebApi'; // Reutilizar el hook de API pública
import { type CreateReservationData } from '../../../types';
import toast from 'react-hot-toast';

export const useWebReservations = () => {
  const { createReservation, isLoading, error } = useWebApi();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReservation = useCallback(async (data: CreateReservationData) => {
    setIsSubmitting(true);
    try {
      // Asegurar que el email no vaya como string vacío si no es obligatorio
      if (data.cliente_email === "") {
        data.cliente_email = undefined;
      }

      await createReservation(data);

      toast.success('¡Reserva enviada! Recibirás un correo de confirmación pronto.');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar la reserva.';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [createReservation]);

  return {
    isSubmitting,
    isLoading, // De useWebApi
    error,     // De useWebApi
    handleSubmitReservation,
  };
};