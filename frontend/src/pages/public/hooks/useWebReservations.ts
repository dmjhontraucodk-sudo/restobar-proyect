// frontend/src/hooks/useWebReservations.ts - VERSIÓN CORREGIDA SIN LOOP INFINITO
import { useState, useCallback } from 'react';
import { useWebApi, type ApiMesa } from '../../../hooks/useWebApi';
import { type CreateReservationData } from '../../../types';
import toast from 'react-hot-toast';

export const useWebReservations = () => {
  const { 
    createReservation, 
    getAvailableMesas,
    isLoading: isApiLoading, 
    error: apiError 
  } = useWebApi();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMesas, setAvailableMesas] = useState<ApiMesa[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isWorking = isApiLoading || isSearching || isSubmitting;

  /**
   * ✅ CORREGIDO: Busca mesas disponibles (estado "Libre")
   * Las dependencias ahora son correctas para evitar loop infinito
   */
  const searchAvailableMesas = useCallback(async () => {
    setIsSearching(true);
    setAvailableMesas([]);

    try {
      console.log('🔍 Buscando mesas disponibles...');
      const mesas = await getAvailableMesas();
      console.log('✅ Mesas recibidas del backend:', mesas);
      setAvailableMesas(mesas);
      
      if (mesas.length === 0) {
        console.warn('⚠️ No hay mesas disponibles');
      }
    } catch (err: any) {
      console.error("❌ Error al buscar mesas:", err);
      const errorMsg = err.message || "Error al buscar disponibilidad de mesas.";
      toast.error(errorMsg);
    } finally {
      setIsSearching(false);
    }
  }, [getAvailableMesas]); // ✅ Solo getAvailableMesas, NO apiError

  /**
   * Maneja el envío de la reserva
   */
  const handleSubmitReservation = useCallback(async (data: CreateReservationData) => {
    setIsSubmitting(true);
    
    try {
      // Asegurar que el email no vaya como string vacío
      const dataToSend = {
        ...data,
        cliente_email: data.cliente_email === "" ? undefined : data.cliente_email,
      };

      console.log('📤 Enviando reserva:', dataToSend);
      await createReservation(dataToSend);

      toast.success('¡Reserva enviada! Esperando confirmación del Administrador.');
      
      // Limpiar lista de mesas después del éxito
      setAvailableMesas([]);
      
      return true;
    } catch (err: any) {
      console.error('❌ Error al enviar reserva:', err);
      const errorMessage = err.message || 'Error al procesar la reserva.';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [createReservation]); // ✅ Solo createReservation

  return {
    isSubmitting: isWorking,
    error: apiError,
    availableMesas,
    searchAvailableMesas,
    handleSubmitReservation,
  };
};