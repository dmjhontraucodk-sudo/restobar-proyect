// frontend/src/pages/TablesManagement.tsx
import React, { useState } from 'react';
import { useMesas } from '../hooks/useMesas';
import { type ApiMesa } from '../types';
import { TableIcon, UsersIcon, PlusIcon, EditIcon, TrashIcon, RefreshIcon, QrcodeIcon } from '../components/icons/index';
import toast from 'react-hot-toast';

// Componente para la tarjeta de mesa - MEJORADO
const MesaCard: React.FC<{ mesa: ApiMesa, onEdit: (mesa: ApiMesa) => void, onDelete: (id: number, nombre: string) => void, isProcessing: boolean }> = ({ mesa, onEdit, onDelete, isProcessing }) => {
    const getStatusConfig = (estado: string) => {
        const configs = {
            'Ocupada': { 
                bg: 'bg-red-50', 
                border: 'border-red-200',
                text: 'text-red-800',
                badge: 'bg-red-100 text-red-800 border-red-300',
                icon: 'text-red-500'
            },
            'Reservada': { 
                bg: 'bg-amber-50', 
                border: 'border-amber-200',
                text: 'text-amber-800',
                badge: 'bg-amber-100 text-amber-800 border-amber-300',
                icon: 'text-amber-500'
            },
            'Libre': { 
                bg: 'bg-green-50', 
                border: 'border-green-200',
                text: 'text-green-800',
                badge: 'bg-green-100 text-green-800 border-green-300',
                icon: 'text-green-500'
            }
        };
        return configs[estado as keyof typeof configs] || { 
            bg: 'bg-gray-50', 
            border: 'border-gray-200',
            text: 'text-gray-800',
            badge: 'bg-gray-100 text-gray-800 border-gray-300',
            icon: 'text-gray-500'
        };
    };

    const statusConfig = getStatusConfig(mesa.estado);

    return (
        <div className={`group relative bg-white rounded-2xl p-6 border-2 ${statusConfig.border} shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full hover:scale-[1.02] ${statusConfig.bg}`}>
            {/* Indicador de estado en borde superior */}
            <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${statusConfig.badge.split(' ')[0]}`}></div>
            
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${statusConfig.bg} border ${statusConfig.border} shadow-sm group-hover:shadow-md transition-shadow`}>
                    <TableIcon className={`w-6 h-6 ${statusConfig.icon}`} />
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.badge} shadow-sm`}>
                    {mesa.estado}
                </span>
            </div>

            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 truncate" title={mesa.nombre_o_numero}>
                    {mesa.nombre_o_numero}
                </h3>
                <div className="space-y-2">
                    <p className="text-gray-600 flex items-center gap-2 text-sm">
                        <UsersIcon className="w-4 h-4 text-gray-400" /> 
                        <span className="font-semibold">{mesa.capacidad} persona{mesa.capacidad !== 1 ? 's' : ''}</span>
                    </p>
                    {mesa.estado === 'Ocupada' && mesa.ordenActiva && (
                        <p className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                            Orden: #{mesa.ordenActiva.id}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                <button
                    onClick={() => {/* Función para QR futuro */}}
                    disabled={isProcessing}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-30"
                    title="Código QR"
                >
                    <QrcodeIcon className="w-5 h-5" />
                </button>
                <div className="flex space-x-1">
                    <button
                        onClick={() => onEdit(mesa)}
                        disabled={isProcessing}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-110"
                        title="Editar mesa"
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDelete(mesa.id, mesa.nombre_o_numero)}
                        disabled={isProcessing || mesa.estado === 'Ocupada' || mesa.estado === 'Reservada'}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-30 hover:scale-110"
                        title={mesa.estado === 'Ocupada' || mesa.estado === 'Reservada' ? 'No se puede eliminar mesa ocupada/reservada' : 'Eliminar mesa'}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente para el modal de Crear/Editar Mesa - MEJORADO
const MesaModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    onSubmit: (data: { nombre_o_numero: string, capacidad: number, estado?: string }) => Promise<boolean>,
    initialData?: ApiMesa | null,
    isSubmitting: boolean
}> = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }) => {
    const [nombre, setNombre] = useState(initialData?.nombre_o_numero || '');
    const [capacidad, setCapacidad] = useState(initialData?.capacidad || 2);
    const [estado, setEstado] = useState(initialData?.estado || 'Libre');
    const isEditing = !!initialData;

    React.useEffect(() => {
        if (isOpen) {
            setNombre(initialData?.nombre_o_numero || '');
            setCapacidad(initialData?.capacidad || 2);
            setEstado(initialData?.estado || 'Libre');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nombre.trim() === "" || capacidad < 1) {
            toast.error("El nombre y la capacidad son obligatorios.");
            return;
        }
        
        const success = await onSubmit({ 
            nombre_o_numero: nombre.trim(), 
            capacidad, 
            estado: isEditing ? estado : undefined 
        });
        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-slideUp">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-gray-50 rounded-t-2xl">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <TableIcon className="w-5 h-5 text-blue-600" />
                            {isEditing ? `Editar Mesa ${initialData?.nombre_o_numero}` : "Añadir Nueva Mesa"}
                        </h3>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Nombre/Número *</label>
                            <div className="relative">
                                <TableIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={nombre} 
                                    onChange={(e) => setNombre(e.target.value)} 
                                    required
                                    disabled={isSubmitting}
                                    className="pl-10 w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Ej: Mesa 1, Barra 5, Terraza B"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Capacidad (Personas) *</label>
                            <div className="relative">
                                <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="number" 
                                    value={capacidad} 
                                    onChange={(e) => setCapacidad(parseInt(e.target.value) || 0)} 
                                    min={1}
                                    max={20}
                                    required
                                    disabled={isSubmitting}
                                    className="pl-10 w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Mínimo: 1 persona, Máximo: 20 personas</p>
                        </div>
                        
                        {/* Selector de Estado - Solo en edición */}
                        {isEditing && (
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Estado de la Mesa</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEstado('Libre')}
                                        disabled={isSubmitting}
                                        className={`p-3.5 border rounded-xl transition-all font-medium ${
                                            estado === 'Libre' 
                                                ? 'bg-green-100 border-green-500 text-green-700 shadow-sm' 
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${estado === 'Libre' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            Libre
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEstado('Ocupada')}
                                        disabled={isSubmitting}
                                        className={`p-3.5 border rounded-xl transition-all font-medium ${
                                            estado === 'Ocupada' 
                                                ? 'bg-red-100 border-red-500 text-red-700 shadow-sm' 
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${estado === 'Ocupada' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                            Ocupada
                                        </div>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Nota: El estado "Reservada" se gestiona automáticamente desde el módulo de reservas.
                                </p>
                            </div>
                        )}

                        {isEditing && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">ID:</span> {initialData?.id}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    El estado "Reservada" se actualiza automáticamente desde las reservas.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow-md"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshIcon className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : isEditing ? 'Guardar Cambios' : 'Crear Mesa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente principal de la página - MEJORADO
export default function TablesManagement() {
    const { 
        mesas, 
        isLoading, 
        error, 
        loadMesas, 
        handleCreateMesa, 
        handleUpdateMesa, 
        handleDeleteMesa 
    } = useMesas();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMesa, setEditingMesa] = useState<ApiMesa | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openCreateModal = () => {
        setEditingMesa(null);
        setIsModalOpen(true);
    };

    const openEditModal = (mesa: ApiMesa) => {
        setEditingMesa(mesa);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: { nombre_o_numero: string, capacidad: number, estado?: string }) => {
        setIsSubmitting(true);
        let success = false;

        const mesaData = {
            nombre_o_numero: data.nombre_o_numero,
            capacidad: data.capacidad,
            estado: data.estado as any
        };

        if (editingMesa) {
            const updated = await handleUpdateMesa(editingMesa.id, mesaData);
            success = !!updated;
        } else {
            success = await handleCreateMesa(mesaData);
        }

        setIsSubmitting(false);
        return success;
    };

    // Estadísticas mejoradas
    const stats = {
        Libre: mesas.filter(m => m.estado === 'Libre').length,
        Ocupada: mesas.filter(m => m.estado === 'Ocupada').length,
        Reservada: mesas.filter(m => m.estado === 'Reservada').length,
        Total: mesas.length
    };

    if (isLoading && mesas.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Cargando mesas...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl" role="alert">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <TableIcon className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Error de Carga</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => loadMesas(true)} 
                        className="mt-3 text-sm font-semibold text-red-600 hover:text-red-800 underline flex items-center gap-2"
                    >
                        <RefreshIcon className="w-4 h-4" />
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header de la Página - MEJORADO */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg">
                                <TableIcon className="w-7 h-7 text-white" />
                            </div>
                            Gestión de Mesas
                        </h1>
                        <p className="text-gray-600 text-lg">Administra y organiza las mesas de tu establecimiento</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={openCreateModal}
                            className="flex items-center px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Añadir Mesa
                        </button>
                        <button 
                            onClick={() => loadMesas(true)} 
                            disabled={isLoading}
                            className="flex items-center px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm disabled:opacity-50"
                        >
                            <RefreshIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Resumen de Mesas - MEJORADO */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.Total, color: 'bg-gray-500' },
                        { label: 'Libres', value: stats.Libre, color: 'bg-green-500' },
                        { label: 'Ocupadas', value: stats.Ocupada, color: 'bg-red-500' },
                        { label: 'Reservadas', value: stats.Reservada, color: 'bg-amber-500' },
                        { label: 'Disponibilidad', value: `${Math.round((stats.Libre / stats.Total) * 100)}%`, color: 'bg-blue-500' }
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${stat.color} shadow-sm`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Listado de Mesas */}
                {mesas.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                        <TableIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-xl font-semibold text-gray-900 mb-2">No hay mesas creadas</p>
                        <p className="text-gray-600 mb-6">Comienza añadiendo la primera mesa para organizar tu salón</p>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg mx-auto"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Crear Primera Mesa
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {mesas.map(mesa => (
                            <MesaCard 
                                key={mesa.id} 
                                mesa={mesa} 
                                onEdit={openEditModal} 
                                onDelete={handleDeleteMesa} 
                                isProcessing={isSubmitting} 
                            />
                        ))}
                    </div>
                )}
                
                {/* Modal de Creación/Edición */}
                <MesaModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleFormSubmit}
                    initialData={editingMesa}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}