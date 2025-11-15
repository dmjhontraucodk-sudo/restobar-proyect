// frontend/src/pages/ReservationsManagement.tsx

import React, { useState } from 'react';
import { useReservations, type ReservationFilter } from '../hooks/useReservations';
import { type ApiReservation, type ApiMesa } from '../types/index'; 
import { RefreshIcon, XIcon, UserIcon, ClockIcon, CalendarIcon, TableIcon } from './public/components/icons';

// Estados de la reserva para el filtro
const STATUS_OPTIONS: { label: string, value: ReservationFilter }[] = [
    { label: 'Pendientes', value: 'Pendiente' },
    { label: 'Confirmadas', value: 'Confirmada' },
    { label: 'Canceladas', value: 'Cancelada' },
    { label: 'Todas', value: 'all' },
];

// Componente para la tarjeta de reserva mejorada
interface ReservationCardProps {  
    reservation: ApiReservation;
    mesas: ApiMesa[];
    onConfirm: (reservationId: number, mesaId: number) => void;
    onCancel: (reservationId: number) => void;
    isProcessing: boolean;
}

    const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, mesas, onConfirm, onCancel, isProcessing }) => {
    const [selectedMesa, setSelectedMesa] = useState<number | ''>('');
    const availableMesas = mesas.filter(m => m.estado === 'Libre' || (m.estado === 'Reservada' && m.id === reservation.mesa_id));

    const isConfirmable = reservation.estado === 'Pendiente' && selectedMesa !== '' && !isProcessing;
    const isCancelable = reservation.estado !== 'Cancelada' && reservation.estado !== 'Completada' && !isProcessing;

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'Confirmada': return 'bg-green-100 text-green-800 border-green-200';
            case 'Pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cancelada': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200'; // CORREGIDO: "text" no "tesxt"
        }
    };

    const getCardBorder = (estado: string) => {
        switch (estado) {
            case 'Confirmada': return 'border-l-4 border-l-green-500';
            case 'Pendiente': return 'border-l-4 border-l-amber-500';
            case 'Cancelada': return 'border-l-4 border-l-red-500';
            default: return 'border-l-4 border-l-gray-500';
        }
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 ${getCardBorder(reservation.estado)}`}>
            {/* Header de la tarjeta */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Reserva #{reservation.id}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Para el {new Date(reservation.fecha_hora).toLocaleDateString('es-ES')}
                        </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(reservation.estado)}`}>
                        {reservation.estado}
                    </span>
                </div>

                {/* Información del cliente */}
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{reservation.cliente_nombre}</p>
                        <p className="text-sm text-gray-600">{reservation.cliente_telefono || 'Sin teléfono'}</p>
                    </div>
                </div>
            </div>

            {/* Detalles de la reserva */}
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg">
                            <UserIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Personas</p>
                            <p className="font-semibold text-gray-900">{reservation.cantidad_personas}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                            <CalendarIcon className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Fecha y Hora</p>
                            <p className="font-semibold text-gray-900">
                                {new Date(reservation.fecha_hora).toLocaleDateString('es-ES', { 
                                    weekday: 'short', 
                                    day: 'numeric', 
                                    month: 'short' 
                                })}
                            </p>
                            <p className="text-sm text-gray-600">
                                {new Date(reservation.fecha_hora).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mesa asignada */}
                {reservation.mesas && reservation.estado === 'Confirmada' && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                            <TableIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Mesa Asignada</p>
                            <p className="font-semibold text-green-700">{reservation.mesas.nombre_o_numero}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                {reservation.estado === 'Pendiente' && (
                    <div className="space-y-3">
                        <select 
                            value={selectedMesa} 
                            onChange={(e) => setSelectedMesa(Number(e.target.value))}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                            disabled={isProcessing}
                        >
                            <option value="">Seleccionar mesa...</option>
                            {availableMesas
                                .filter(m => m.estado === 'Libre')
                                .map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.nombre_o_numero} - Capacidad: {m.capacidad} personas
                                    </option>
                                ))}
                        </select>

                        <div className="flex space-x-3">
                            <button 
                                onClick={() => onConfirm(reservation.id, Number(selectedMesa))} 
                                disabled={!isConfirmable}
                                className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Confirmar Reserva
                            </button>
                        </div>
                    </div>
                )}
                
                {(reservation.estado === 'Pendiente' || reservation.estado === 'Confirmada') && (
                    <button 
                        onClick={() => onCancel(reservation.id)}
                        disabled={!isCancelable}
                        className="w-full flex items-center justify-center px-4 py-3 bg-white text-red-600 border border-red-300 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium mt-3"
                    >
                        <XIcon className="w-4 h-4 mr-2" />
                        {reservation.estado === 'Pendiente' ? 'Rechazar Reserva' : 'Cancelar Reserva'}
                    </button>
                )}
            </div>
        </div>
    );
};

// Componente de estadísticas
const StatsCard: React.FC<{ title: string; value: number; color: string; icon: React.ReactNode }> = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
        </div>
    </div>
);

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

    // Calcular estadísticas
    const stats = {
        total: reservations.length,
        pendientes: reservations.filter(r => r.estado === 'Pendiente').length,
        confirmadas: reservations.filter(r => r.estado === 'Confirmada').length,
        canceladas: reservations.filter(r => r.estado === 'Cancelada').length,
    };

    // Handlers que gestionan el estado de procesamiento
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

    if (isLoading && reservations.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg text-gray-600">Cargando reservas...</p>
                <p className="text-sm text-gray-500 mt-2">Por favor espere</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Error al cargar las reservas</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => reloadReservations(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
                    <p className="text-gray-600 mt-2">Administra y gestiona todas las reservas del restaurante</p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard 
                        title="Total Reservas" 
                        value={stats.total} 
                        color="bg-blue-100 text-blue-600"
                        icon={<CalendarIcon className="w-6 h-6" />}
                    />
                    <StatsCard 
                        title="Pendientes" 
                        value={stats.pendientes} 
                        color="bg-amber-100 text-amber-600"
                        icon={<ClockIcon className="w-6 h-6" />}
                    />
                    <StatsCard 
                        title="Confirmadas" 
                        value={stats.confirmadas} 
                        color="bg-green-100 text-green-600"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>}
                    />
                    <StatsCard 
                        title="Canceladas" 
                        value={stats.canceladas} 
                        color="bg-red-100 text-red-600"
                        icon={<XIcon className="w-6 h-6" />}
                    />
                </div>

                {/* Barra de Filtros y Recarga */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilterStatus(option.value)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        filterStatus === option.value 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500">
                                {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} encontrada{reservations.length !== 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={() => reloadReservations(true)}
                                disabled={isLoading || isProcessing}
                                className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200"
                            >
                                <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span>Actualizar</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Lista de Reservas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {reservations.length === 0 ? (
                        <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CalendarIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay reservas</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                {filterStatus === 'all' 
                                    ? 'No se encontraron reservas en el sistema.' 
                                    : `No hay reservas ${filterStatus === 'Pendiente' ? 'pendientes' : `con estado "${filterStatus}"`}.`
                                }
                            </p>
                        </div>
                    ) : (
                        reservations.map(r => (
                            <ReservationCard 
                                key={r.id} 
                                reservation={r} 
                                mesas={mesas}
                                onConfirm={onConfirm}
                                onCancel={onCancel}
                                isProcessing={isProcessing}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationsManagementPage;