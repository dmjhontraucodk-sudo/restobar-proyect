// frontend/src/hooks/useMesas.ts
import { useState, useEffect, useCallback } from 'react';
import { useDashboardApi } from './useDashboardApi';
import { type ApiMesa, type mesas_estado } from '../types';
import toast from 'react-hot-toast';

// Tipos de entrada para el hook de formulario
type MesaFormInput = { nombre_o_numero: string, capacidad: number, estado?: mesas_estado };

export const useMesas = () => {
    const [mesas, setMesas] = useState<ApiMesa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Asumimos que has añadido las funciones CRUD a useDashboardApi
    const { getMesas, createMesa, updateMesa, deleteMesa } = useDashboardApi(); 

    const loadMesas = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError(null);
        try {
            // Llama a la ruta GET /dashboard/mesas
            // Nota: La ruta /mesas devuelve el CRUD básico, no la info extra de órdenes.
            const fetchedMesas = await getMesas(); 
            setMesas(fetchedMesas);
        } catch (err: any) {
            console.error("Error loading mesas:", err);
            setError(err.message || 'No se pudieron cargar las mesas.');
        } finally {
            setIsLoading(false);
        }
    }, [getMesas]);

    useEffect(() => {
        loadMesas();
    }, [loadMesas]);

    // Lógica para añadir una nueva mesa
    const handleCreateMesa = async (data: MesaFormInput) => {
        try {
            // Usamos un tipo de entrada más ligero que el tipo de la API
            const nuevaMesa = await createMesa(data); 
            setMesas(prev => [...prev, nuevaMesa].sort((a, b) => a.nombre_o_numero.localeCompare(b.nombre_o_numero)));
            toast.success(`Mesa "${data.nombre_o_numero}" creada.`);
            return true;
        } catch (err: any) {
            toast.error(err.message || 'Fallo al crear la mesa.');
            return false;
        }
    };

    // Lógica para actualizar la mesa
    const handleUpdateMesa = async (mesaId: number, data: Partial<MesaFormInput>) => {
        try {
            const updatedMesa = await updateMesa(mesaId, data);
            setMesas(prev => prev.map(m => (m.id === mesaId ? updatedMesa : m)));
            toast.success(`Mesa ${updatedMesa.nombre_o_numero} actualizada.`);
            return updatedMesa;
        } catch (err: any) {
            toast.error(err.message || 'Fallo al actualizar la mesa.');
            return null;
        }
    };
    
    // Lógica para eliminar una mesa
    const handleDeleteMesa = async (mesaId: number, nombre: string) => {
        // En un sistema real, usaríamos un modal personalizado, no window.confirm
        if (!window.confirm(`¿Está seguro de que desea eliminar la Mesa ${nombre}?`)) return false;
        try {
            await deleteMesa(mesaId);
            setMesas(prev => prev.filter(m => m.id !== mesaId));
            toast.success(`Mesa ${nombre} eliminada.`);
            return true;
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar la mesa.');
            return false;
        }
    };


    return {
        mesas,
        isLoading,
        error,
        loadMesas,
        handleCreateMesa,
        handleUpdateMesa,
        handleDeleteMesa
    };
};