// frontend/src/hooks/useReservations.ts (NUEVO ARCHIVO)
import { useState, useEffect, useCallback } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import { type ApiReservation, type ApiMesa, type reservas_estado } from '@shared/types';
import toast from 'react-hot-toast';

// Tipo de filtro de estado (para el listado)
export type ReservationFilter = reservas_estado | 'all' | undefined;

export const useReservations = () => {
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [mesas, setMesas] = useState<ApiMesa[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ReservationFilter>('Pendiente');
  const [error, setError] = useState<string | null>(null);

  const { getReservations, updateReservationStatus, getMesasConOrdenes } = useDashboardApi();

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      // 1. Cargar la lista de reservas
      const statusFilter = filterStatus !== 'all' ? filterStatus : undefined;
      const fetchedReservations = await getReservations(statusFilter);
      setReservations(fetchedReservations);

      // 2. Cargar la lista de mesas (para la asignación)
      const fetchedMesas = await getMesasConOrdenes();
      setMesas(fetchedMesas);

    } catch (err: any) {
      console.error("Error al cargar datos de reservas:", err);
      setError(err.message || 'No se pudieron cargar las reservas.');
      toast.error('Error al cargar datos de reservas.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, getReservations, getMesasConOrdenes]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // --- Handlers de acciones ---
  
  /**
  * Confirma una reserva y asigna una mesa.
  */
  const handleConfirmReservation = async (reservationId: number, mesaId: number) => {
    const originalReservations = [...reservations];
    
    try {
      // Optimistic UI Update (opcional, pero mejora la UX)
      setReservations(prev => prev.map(r => 
        r.id === reservationId ? { ...r, estado: 'Confirmada', mesa_id: mesaId } : r
      ));
      
      await updateReservationStatus(reservationId, 'Confirmada', mesaId);
      toast.success('Reserva confirmada y mesa asignada. Se envió notificación al cliente.');
      loadData(false); // Recargar para obtener el estado real y las mesas actualizadas
      
    } catch (err: any) {
      setReservations(originalReservations); // Revertir si hay error
      toast.error(err.message || 'Error al confirmar la reserva.');
    }
  };
  
  /**
  * Cancela una reserva.
  */
  const handleCancelReservation = async (reservationId: number) => {
    const originalReservations = [...reservations];
    
    try {
      setReservations(prev => prev.map(r => 
        r.id === reservationId ? { ...r, estado: 'Cancelada', mesa_id: null } : r
      ));
      
      await updateReservationStatus(reservationId, 'Cancelada');
      toast.success('Reserva cancelada. Se envió notificación al cliente.');
      loadData(false); 
    } catch (err: any) {
      setReservations(originalReservations);
      toast.error(err.message || 'Error al cancelar la reserva.');
    }
  };

  return {
    reservations,
    mesas,
    isLoading,
    error,
    filterStatus,
    setFilterStatus,
    reloadReservations: loadData,
    handleConfirmReservation,
    handleCancelReservation,
  };
};