import React, { useState } from 'react';
import { useTeamManagement } from '../../hooks/useTeamManagement';
import { CreateEmployeeModal } from '../../components/team/CreateEmployeeModal';
import { EmployeeTable } from '../../components/team/EmployeeTable';
import { EmployeeCard } from '../../components/team/EmployeeCard';
import { RolesTab } from '../../components/team/RolesTab';
import AddIncidenciaModal from '../../components/team/AddIncidenciaModal';
import { type ApiEmpleado } from '../../types';
import { 
    XCircleIcon,
    UsersIcon, 
    ShieldIcon,
    ViewListIcon,
    ViewGridIcon,
    RefreshIcon,
    PlusIcon,
    CheckCircleIcon
} from '../../components/icons';

// Funciones de validación específicas para Perú
const validarTelefonoPeruano = (telefono: string): boolean => {
  // Validar que tenga 9 dígitos y empiece con 9
  const regex = /^9\d{8}$/;
  return regex.test(telefono);
};

const validarDNI = (dni: string): boolean => {
  // Validar que tenga exactamente 8 dígitos
  const regex = /^\d{8}$/;
  return regex.test(dni);
};

const validarNombreRol = (nombre: string): boolean => {
  // Validar que el rol no sea solo números
  const soloNumeros = /^\d+$/;
  return !soloNumeros.test(nombre);
};

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

type TabType = 'empleados' | 'roles';

const TeamManagementPage: React.FC = () => {
    const {
        empleados,
        roles,
        todosRoles,
        isLoading,
        error,
        stats,
        puedeGestionarRoles,
        puedeVerSalarios, // Se mantiene para el modal de creación
        
        // Funciones
        reloadEmpleados,
        createEmpleado,
        updateEmpleado,
        desactivarEmpleado,
        activarEmpleado,
        resetearPassword,
        createRol,
        updateRol,
        desactivarRol,
        activarRol,
        registrarIncidencia 
    } = useTeamManagement();

    const [activeTab, setActiveTab] = useState<TabType>('empleados');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmpleado, setEditingEmpleado] = useState<ApiEmpleado | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const [showIncidenciaModal, setShowIncidenciaModal] = useState(false);
    // ✅ NOMBRE CORRECTO DE LA VARIABLE DE ESTADO
    const [selectedEmployeeIncidencia, setSelectedEmployeeIncidencia] = useState<ApiEmpleado | null>(null);

    // Handlers
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
        // Validaciones antes de enviar
        const errores: string[] = [];
        
        // Validar teléfono
        if (data.telefono && !validarTelefonoPeruano(data.telefono)) {
            errores.push('El teléfono debe tener 9 dígitos y comenzar con 9');
        }
        
        // Validar DNI si está presente
        if (data.dni && !validarDNI(data.dni)) {
            errores.push('El DNI debe tener 8 dígitos numéricos');
        }
        
        if (errores.length > 0) {
            alert(errores.join('\n'));
            return false;
        }
        
        if (editingEmpleado) {
            return await updateEmpleado(editingEmpleado.id, data);
        } else {
            return await createEmpleado(data);
        }
    };

    const handleOpenIncidencia = (empleado: ApiEmpleado) => {
        setSelectedEmployeeIncidencia(empleado);
        setShowIncidenciaModal(true);
    };

    const handleConfirmIncidencia = async (data: { id: number, monto: number, motivo: string, es_adelanto: boolean }) => {
        return await registrarIncidencia(data);
    };

    const handleResetPassword = async (id: number) => {
        return await resetearPassword(id);
    };

    const handleCreateRol = async (data: any) => {
        // Validar que el nombre del rol no sea solo números
        if (!validarNombreRol(data.nombre)) {
            alert('El nombre del rol no puede ser solo números');
            return false;
        }
        
        return await createRol(data);
    };

    const handleUpdateRol = async (id: number, data: any) => {
        // Validar que el nombre del rol no sea solo números
        if (!validarNombreRol(data.nombre)) {
            alert('El nombre del rol no puede ser solo números');
            return false;
        }
        
        return await updateRol(id, data);
    };

    if (isLoading && empleados.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg text-gray-600">Cargando equipo...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
                    <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Error al cargar</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button onClick={() => reloadEmpleados()} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
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
                    <p className="text-gray-600 mt-2">Administra empleados y roles de tu restaurante.</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
                    <div className="border-b border-gray-200 px-6">
                        <nav className="flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('empleados')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                                    activeTab === 'empleados' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <UsersIcon className="w-5 h-5" /> Empleados
                                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">{stats.total}</span>
                            </button>

                            {puedeGestionarRoles && (
                                <button
                                    onClick={() => setActiveTab('roles')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                                        activeTab === 'roles' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <ShieldIcon className="w-5 h-5" /> Roles
                                </button>
                            )}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* --- TAB EMPLEADOS --- */}
                        {activeTab === 'empleados' && (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatsCard title="Total Empleados" value={stats.total} color="bg-blue-100 text-blue-600" icon={<UsersIcon className="w-6 h-6" />} />
                                    <StatsCard title="Activos" value={stats.activos} color="bg-green-100 text-green-600" icon={<CheckCircleIcon className="w-6 h-6" />} />
                                    <StatsCard title="Con Acceso" value={stats.conAcceso} color="bg-purple-100 text-purple-600" icon={<ShieldIcon className="w-6 h-6" />} />
                                    <StatsCard title="Inactivos" value={stats.inactivos} color="bg-red-100 text-red-600" icon={<XCircleIcon className="w-6 h-6" />} />
                                </div>

                                {/* Toolbar */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col lg:flex-row justify-between items-center gap-4">
                                    <span className="text-sm text-gray-500">{empleados.length} miembros en total</span>
                                    <div className="flex gap-3">
                                        <div className="bg-white rounded-lg p-1 border flex">
                                            <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode === 'table' ? 'bg-gray-100' : ''}`}><ViewListIcon className="w-4 h-4" /></button>
                                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}><ViewGridIcon className="w-4 h-4" /></button>
                                        </div>
                                        <button onClick={() => reloadEmpleados()} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-gray-50 text-gray-700">
                                            <RefreshIcon className="w-4 h-4" /> Actualizar
                                        </button>
                                        <button onClick={handleOpenCreateModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm">
                                            <PlusIcon className="w-4 h-4" /> Nuevo Empleado
                                        </button>
                                    </div>
                                </div>

                                {/* Tabla / Grid */}
                                {viewMode === 'table' ? (
                                    <EmployeeTable
                                        empleados={empleados}
                                        onEdit={handleOpenEditModal}
                                        onDelete={desactivarEmpleado}
                                        onActivate={activarEmpleado}
                                        onResetPassword={handleResetPassword}
                                        onAddIncidencia={handleOpenIncidencia} 
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {empleados.map(emp => (
                                            <EmployeeCard 
                                                key={emp.id} 
                                                empleado={emp} 
                                                onEdit={handleOpenEditModal} 
                                                onDelete={desactivarEmpleado} 
                                                onActivate={activarEmpleado} 
                                                onResetPassword={handleResetPassword}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- TAB ROLES --- */}
                        {activeTab === 'roles' && (
                            <RolesTab 
                                roles={todosRoles} 
                                onCreateRol={handleCreateRol} // Usar el handler con validación
                                onUpdateRol={handleUpdateRol} // Usar el handler con validación
                                onDesactivarRol={desactivarRol} 
                                onActivarRol={activarRol} 
                                puedeGestionarRoles={puedeGestionarRoles} 
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modales */}
            <CreateEmployeeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                empleado={editingEmpleado}
                roles={roles}
                puedeVerSalarios={puedeVerSalarios}
            />

            <AddIncidenciaModal 
                isOpen={showIncidenciaModal}
                onClose={() => setShowIncidenciaModal(false)}
                // ✅ CORREGIDO: Usar la variable de estado correcta
                empleado={selectedEmployeeIncidencia} 
                onConfirm={handleConfirmIncidencia}
            />
        </div>
    );
};

export default TeamManagementPage;