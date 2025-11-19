// frontend/src/pages/dashboard/TeamManagement.tsx - VERSIÓN COMPLETA CON 3 TABS
import React, { useState } from 'react';
import { useTeamManagement } from '../../hooks/useTeamManagement';
import { CreateEmployeeModal } from '../../components/team/CreateEmployeeModal';
import { EmployeeTable } from '../../components/team/EmployeeTable';
import { EmployeeCard } from '../../components/team/EmployeeCard';
import { RolesTab } from '../../components/team/RolesTab';
import { NominaTab } from '../../components/team/NominaTab';
import { type ApiEmpleado } from '../../types';
import { 
    RefreshIcon, 
    PlusIcon, 
    UsersIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    ViewListIcon,
    ViewGridIcon,
    ShieldIcon,
    DollarSignIcon
} from '../../components/icons';

// Componente de estadísticas
const StatsCard: React.FC<{ 
    title: string; 
    value: number; 
    color: string; 
    icon: React.ReactNode 
}> = ({ title, value, color, icon }) => (
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

// Tipo para los tabs
type TabType = 'empleados' | 'roles' | 'nomina';

const TeamManagementPage: React.FC = () => {
    const {
        empleados,
        roles,
        todosRoles,
        nomina,
        isLoading,
        error,
        stats,
        puedeGestionarRoles,
        puedeVerSalarios,
        
        // Empleados
        reloadEmpleados,
        createEmpleado,
        updateEmpleado,
        desactivarEmpleado,
        activarEmpleado,
        resetearPassword,
        
        // Roles
        createRol,
        updateRol,
        desactivarRol,
        activarRol,
        
        // Nómina
    } = useTeamManagement();

    const [activeTab, setActiveTab] = useState<TabType>('empleados');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmpleado, setEditingEmpleado] = useState<ApiEmpleado | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    // Handlers de empleados
    const handleOpenCreateModal = () => {
        setEditingEmpleado(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (empleado: ApiEmpleado) => {
        setEditingEmpleado(empleado);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmpleado(null);
    };

    const handleSubmit = async (data: any) => {
        if (editingEmpleado) {
            return await updateEmpleado(editingEmpleado.id, data);
        } else {
            return await createEmpleado(data);
        }
    };

    const handleResetPassword = async (id: number) => {
        return await resetearPassword(id);
    };

    // Estados de carga y error
    if (isLoading && empleados.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg text-gray-600">Cargando datos del equipo...</p>
                <p className="text-sm text-gray-500 mt-2">Por favor espere</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Error al cargar los datos</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => reloadEmpleados()}
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
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Equipo</h1>
                    <p className="text-gray-600 mt-2">Administra empleados, roles y nómina de tu restaurante</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('empleados')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'empleados'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <UsersIcon className="w-5 h-5" />
                                    <span>Empleados</span>
                                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                        {stats.total}
                                    </span>
                                </div>
                            </button>

                            {puedeGestionarRoles && (
                                <button
                                    onClick={() => setActiveTab('roles')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === 'roles'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <ShieldIcon className="w-5 h-5" />
                                        <span>Roles</span>
                                        <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                            {todosRoles.length}
                                        </span>
                                    </div>
                                </button>
                            )}

                            {puedeVerSalarios && (
                                <button
                                    onClick={() => setActiveTab('nomina')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === 'nomina'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <DollarSignIcon className="w-5 h-5" />
                                        <span>Nómina</span>
                                    </div>
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Contenido del Tab */}
                    <div className="p-6">
                        {/* TAB EMPLEADOS */}
                        {activeTab === 'empleados' && (
                            <div className="space-y-6">
                                {/* Estadísticas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatsCard 
                                        title="Total Empleados" 
                                        value={stats.total} 
                                        color="bg-blue-100 text-blue-600"
                                        icon={<UsersIcon className="w-6 h-6" />}
                                    />
                                    <StatsCard 
                                        title="Empleados Activos" 
                                        value={stats.activos} 
                                        color="bg-green-100 text-green-600"
                                        icon={<CheckCircleIcon className="w-6 h-6" />}
                                    />
                                    <StatsCard 
                                        title="Con Acceso al Sistema" 
                                        value={stats.conAcceso} 
                                        color="bg-purple-100 text-purple-600"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>}
                                    />
                                    <StatsCard 
                                        title="Inactivos" 
                                        value={stats.inactivos} 
                                        color="bg-red-100 text-red-600"
                                        icon={<XCircleIcon className="w-6 h-6" />}
                                    />
                                </div>

                                {/* Barra de acciones */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm text-gray-500">
                                                {empleados.length} empleado{empleados.length !== 1 ? 's' : ''} en total
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            {/* Toggle Vista */}
                                            <div className="flex items-center bg-gray-200 rounded-xl p-1">
                                                <button
                                                    onClick={() => setViewMode('table')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        viewMode === 'table' 
                                                            ? 'bg-white text-gray-900 shadow-sm' 
                                                            : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <ViewListIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('grid')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        viewMode === 'grid' 
                                                            ? 'bg-white text-gray-900 shadow-sm' 
                                                            : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <ViewGridIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Botón Recargar */}
                                            <button
                                                onClick={reloadEmpleados}
                                                disabled={isLoading}
                                                className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                                            >
                                                <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                                <span>Actualizar</span>
                                            </button>

                                            {/* Botón Crear */}
                                            <button
                                                onClick={handleOpenCreateModal}
                                                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                <span>Nuevo Empleado</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Vista de Tabla o Tarjetas */}
                                {viewMode === 'table' ? (
                                    <EmployeeTable
                                        empleados={empleados}
                                        onEdit={handleOpenEditModal}
                                        onDelete={desactivarEmpleado}
                                        onActivate={activarEmpleado}
                                        onResetPassword={handleResetPassword}
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {empleados.length === 0 ? (
                                            <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <UsersIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay empleados</h3>
                                                <p className="text-gray-500 max-w-sm mx-auto">
                                                    Comienza agregando tu primer empleado al equipo.
                                                </p>
                                            </div>
                                        ) : (
                                            empleados.map(empleado => (
                                                <EmployeeCard
                                                    key={empleado.id}
                                                    empleado={empleado}
                                                    onEdit={handleOpenEditModal}
                                                    onDelete={desactivarEmpleado}
                                                    onActivate={activarEmpleado}
                                                    onResetPassword={handleResetPassword}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB ROLES */}
                        {activeTab === 'roles' && (
                            <RolesTab
                                roles={todosRoles}
                                onCreateRol={createRol}
                                onUpdateRol={updateRol}
                                onDesactivarRol={desactivarRol}
                                onActivarRol={activarRol}
                                puedeGestionarRoles={puedeGestionarRoles}
                            />
                        )}

                        {/* TAB NÓMINA */}
                        {activeTab === 'nomina' && (
                            <NominaTab
                                nomina={nomina}
                                puedeVerSalarios={puedeVerSalarios}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Crear/Editar */}
            <CreateEmployeeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                empleado={editingEmpleado}
                roles={roles}
                puedeVerSalarios={puedeVerSalarios}
            />
        </div>
    );
};

export default TeamManagementPage;