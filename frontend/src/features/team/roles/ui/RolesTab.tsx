// frontend/src/features/team/roles/ui/RolesTab.tsx
import React, { useState } from 'react';
import { type ApiRol, type CreateRolData, type UpdateRolData } from '@shared/types';
import { 
    PlusIcon, 
    EditIcon, 
    TrashIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    XIcon,
    ShieldIcon
} from '@shared/ui/Icons';

interface RolesTabProps {
    roles: ApiRol[];
    onCreateRol: (data: CreateRolData) => Promise<boolean>;
    onUpdateRol: (id: number, data: UpdateRolData) => Promise<boolean>;
    onDesactivarRol: (id: number) => Promise<boolean>;
    onActivarRol: (id: number) => Promise<boolean>;
    puedeGestionarRoles: boolean;
}

export const RolesTab: React.FC<RolesTabProps> = ({
    roles,
    onCreateRol,
    onUpdateRol,
    onDesactivarRol,
    onActivarRol,
    puedeGestionarRoles
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRol, setEditingRol] = useState<ApiRol | null>(null);
    const [formData, setFormData] = useState<CreateRolData>({ nombre: '', descripcion: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenCreateModal = () => {
        setEditingRol(null);
        setFormData({ nombre: '', descripcion: '' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (rol: ApiRol) => {
        setEditingRol(rol);
        setFormData({
            nombre: rol.nombre,
            descripcion: rol.descripcion || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let success = false;
            if (editingRol) {
                success = await onUpdateRol(editingRol.id, formData);
            } else {
                success = await onCreateRol(formData);
            }

            if (success) {
                setIsModalOpen(false);
                setFormData({ nombre: '', descripcion: '' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!puedeGestionarRoles) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircleIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
                <p className="text-gray-600">
                    Solo el Administrador puede gestionar los roles del sistema.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Roles</h2>
                    <p className="text-gray-600 mt-1">
                        Crea y administra los roles disponibles para tu equipo
                    </p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Nuevo Rol</span>
                </button>
            </div>

            {/* Tabla de Roles */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {roles.map((rol) => (
                                <tr key={rol.id} className="hover:bg-gray-50 transition-colors">
                                    {/* Rol */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            {rol.nombre === 'Administrador' && (
                                                <ShieldIcon className="w-5 h-5 text-purple-600" />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {rol.nombre}
                                                </div>
                                                {rol.nombre === 'Administrador' && (
                                                    <span className="text-xs text-purple-600">
                                                        Rol del sistema
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Descripción */}
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600">
                                            {rol.descripcion || 'Sin descripción'}
                                        </p>
                                    </td>

                                    {/* Estado */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {rol.activo ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <XCircleIcon className="w-3 h-3 mr-1" />
                                                Inactivo
                                            </span>
                                        )}
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            {/* Editar */}
                                            <button
                                                onClick={() => handleOpenEditModal(rol)}
                                                disabled={rol.nombre === 'Administrador'}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Editar rol"
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>

                                            {/* Desactivar/Activar */}
                                            {rol.activo ? (
                                                <button
                                                    onClick={() => onDesactivarRol(rol.id)}
                                                    disabled={rol.nombre === 'Administrador'}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Desactivar rol"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onActivarRol(rol.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Reactivar rol"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {roles.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No hay roles registrados</p>
                    </div>
                )}
            </div>

            {/* Modal Crear/Editar Rol */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingRol ? 'Editar Rol' : 'Nuevo Rol'}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XIcon className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del Rol *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: Gerente, Cajero, etc."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Breve descripción del rol..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isSubmitting ? 'Guardando...' : (editingRol ? 'Actualizar' : 'Crear Rol')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
