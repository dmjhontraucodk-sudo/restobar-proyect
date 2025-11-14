// frontend/src/pages/ReservationsManagement.tsx

import React, { useState } from 'react';
import { useReservations, type ReservationFilter } from '../hooks/useReservations';
import { type ApiReservation, type ApiMesa } from '../types/index'; 
// ✨ ASUMO QUE CHECKICON NO ESTÁ Y LO SUSTITUIMOS POR XICON COMO PLACEHOLDER TEMPORAL
import { RefreshIcon, XIcon, UserIcon, ClockIcon } from '../components/icons'; 


// Estados de la reserva para el filtro (sin cambios)
const STATUS_OPTIONS: { label: string, value: ReservationFilter }[] = [
    { label: 'Pendientes', value: 'Pendiente' },
    { label: 'Confirmadas', value: 'Confirmada' },
    { label: 'Canceladas', value: 'Cancelada' },
    { label: 'Todas', value: 'all' },
];

// Componente para la tarjeta de reserva
interface ReservationCardProps {
    reservation: ApiReservation;
    mesas: ApiMesa[]; // CORRECTO: Es un array de objetos mesa
    onConfirm: (reservationId: number, mesaId: number) => void;
    onCancel: (reservationId: number) => void;
    isProcessing: boolean;
}

const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, mesas, onConfirm, onCancel, isProcessing }) => {
    const [selectedMesa, setSelectedMesa] = useState<number | ''>('');
    // Filtramos las mesas disponibles (Libres o la mesa asignada si la reserva ya está confirmada)
    const availableMesas = mesas.filter(m => m.estado === 'Libre' || (m.estado === 'Reservada' && m.id === reservation.mesa_id));

    const isConfirmable = reservation.estado === 'Pendiente' && selectedMesa !== '' && !isProcessing;
    const isCancelable = reservation.estado !== 'Cancelada' && reservation.estado !== 'Completada' && !isProcessing;

    return (
        <div className={`p-5 rounded-xl shadow-lg border ${
            reservation.estado === 'Confirmada' ? 'bg-green-50 border-green-200' :
            reservation.estado === 'Pendiente' ? 'bg-yellow-50 border-yellow-200' :
            'bg-white border-gray-200'
        }`}>
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">Reserva #{reservation.id}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    reservation.estado === 'Confirmada' ? 'bg-green-200 text-green-800' :
                    reservation.estado === 'Pendiente' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                }`}>
                    {reservation.estado}
                </span>
            </div>

            <div className="space-y-2 text-gray-700">
                <p className="flex items-center text-lg font-semibold"><UserIcon className="w-5 h-5 mr-2 text-blue-600" /> {reservation.cliente_nombre}</p>
                <p className="flex items-center text-sm"><UserIcon className="w-4 h-4 mr-2" /> Personas: {reservation.cantidad_personas}</p> 
                <p className="flex items-center text-sm"><ClockIcon className="w-4 h-4 mr-2" /> Fecha/Hora: {new Date(reservation.fecha_hora).toLocaleString('es-ES')}</p>
                {reservation.mesas && reservation.estado === 'Confirmada' && (
                    <p className="text-sm font-bold text-green-600">Mesa Asignada: {reservation.mesas.nombre_o_numero}</p>
                )}
            </div>

            {/* Acciones */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col md:flex-row gap-2">
                {reservation.estado === 'Pendiente' && (
                    <>
                        <select 
                            value={selectedMesa} 
                            onChange={(e) => setSelectedMesa(Number(e.target.value))}
                            className="p-2 border border-gray-300 rounded-lg flex-1"
                            disabled={isProcessing}
                        >
                            <option value="">Asignar Mesa...</option>
                            {availableMesas
                                .filter(m => m.estado === 'Libre') 
                                .map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre_o_numero} (Cap. {m.capacidad})</option>
                                ))}
                        </select>

                        <button 
                            onClick={() => onConfirm(reservation.id, Number(selectedMesa))} 
                            disabled={!isConfirmable}
                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                        >
                            <XIcon className="w-4 h-4 mr-2" /> Confirmar
                        </button>
                    </>
                )}
                
                {(reservation.estado === 'Pendiente' || reservation.estado === 'Confirmada') && (
                    <button 
                        onClick={() => onCancel(reservation.id)}
                        disabled={!isCancelable}
                        className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200"
                    >
                        <XIcon className="w-4 h-4 mr-2" /> Cancelar
                    </button>
                )}
            </div>
        </div>
    );
};


const ReservationsManagementPage: React.FC = () => {
    const { 
        reservations, 
        mesas,
        isLoading, 
        error, 
        filterStatus, 
        setFilterStatus, 
        reloadReservations,
        handleConfirmReservation,
        handleCancelReservation
    } = useReservations();

    const [isProcessing, setIsProcessing] = useState(false);

    // --- RENDERIZADO DE ESTADOS ---
    if (isLoading && reservations.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-lg text-gray-600">Cargando reservas...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl" role="alert">
                <strong className="font-bold">¡Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    // --- Handlers que gestionan el estado de procesamiento ---
    const onConfirm = async (id: number, mesaId: number) => {
        setIsProcessing(true);
        await handleConfirmReservation(id, mesaId);
        setIsProcessing(false);
    };
    
    const onCancel = async (id: number) => {
        setIsProcessing(true);
        await handleCancelReservation(id);
        setIsProcessing(false);
    };

    return (
        <div className="min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Reservas</h1>
            
            {/* Barra de Filtros y Recarga */}
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex space-x-3">
                    {STATUS_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setFilterStatus(option.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filterStatus === option.value ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => reloadReservations(true)}
                    disabled={isLoading || isProcessing}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                >
                    <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            
            {/* Lista de Reservas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {reservations.length === 0 ? (
                    <div className="lg:col-span-3 bg-white p-12 rounded-xl shadow-sm text-center text-gray-500">
                        No hay reservas {filterStatus === 'Pendiente' ? 'pendientes' : `con el estado "${filterStatus}"`}.
                    </div>
                ) : (
                    reservations.map(r => (
                        <ReservationCard 
                            key={r.id} 
                            reservation={r} 
                            mesas={mesas} // Se le pasa la lista de mesas
                            onConfirm={onConfirm}
                            onCancel={onCancel}
                            isProcessing={isProcessing}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ReservationsManagementPage;