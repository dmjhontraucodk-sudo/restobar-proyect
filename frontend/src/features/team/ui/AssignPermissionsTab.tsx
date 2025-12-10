// frontend/src/features/team/ui/AssignPermissionsTab.tsx
import React, { useState, useEffect } from 'react';
import { type ApiRol } from '@shared/types';
import toast from 'react-hot-toast';

// Define the structure of a navigation item received from the backend
interface NavigationItem {
    id: string; // e.g., 'operaciones.panel_principal'
    label: string;
    group: string;
    path: string;
}

interface AssignPermissionsTabProps {
    roles: ApiRol[];
    allNavigationItems: NavigationItem[];
    // Permissions for the currently selected role, managed by the parent via useTeamManagement
    currentRolePermissions: string[]; 
    loadRolePermissions: (roleId: number) => Promise<void>;
    updateRolePermissions: (roleId: number, permissions: string[]) => Promise<boolean>;
    isLoading: boolean; // General loading state from parent
    error: string | null; // General error state from parent
}

export const AssignPermissionsTab: React.FC<AssignPermissionsTabProps> = ({
    roles,
    allNavigationItems,
    currentRolePermissions,
    loadRolePermissions,
    updateRolePermissions,
    isLoading,
    error,
}) => {
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    // Local state for permissions, allowing changes before saving
    const [stagedPermissions, setStagedPermissions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // When the selectedRoleId or currentRolePermissions change from parent, update stagedPermissions
    useEffect(() => {
        if (selectedRoleId) {
            setStagedPermissions(currentRolePermissions);
        } else {
            setStagedPermissions([]);
        }
    }, [selectedRoleId, currentRolePermissions]);

    // --- Handlers ---
    const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value, 10);
        setSelectedRoleId(id === 0 ? null : id);
        // If a role is selected, trigger parent to load its permissions
        if (id !== 0) {
            await loadRolePermissions(id);
        }
    };

    const handlePermissionToggle = (permissionId: string) => {
        setStagedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleId) {
            toast.error('Por favor, selecciona un rol primero.');
            return;
        }
        setIsSaving(true);
        const success = await updateRolePermissions(selectedRoleId, stagedPermissions);
        if (success) {
            // Permissions are already reloaded by the parent on success,
            // so currentRolePermissions will update and flow down to stagedPermissions
        }
        setIsSaving(false);
    };

    // Group navigation items by group name
    const groupedNavigationItems = allNavigationItems.reduce((acc, item) => {
        (acc[item.group] = acc[item.group] || []).push(item);
        return acc;
    }, {} as Record<string, NavigationItem[]>);

    // If there's a global error from useTeamManagement, display it
    if (error) {
        return <div className="text-red-500 p-4">{error}</div>;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Asignar Permisos por Rol</h2>
            <p className="text-gray-600 mb-6">Selecciona un rol y define a qué secciones del sistema tendrá acceso.</p>

            <div className="mb-6">
                <label htmlFor="select-role" className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Rol:</label>
                <select
                    id="select-role"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={selectedRoleId || 0}
                    onChange={handleRoleChange}
                    disabled={!roles.length || isSaving}
                >
                    <option value={0}>-- Selecciona un Rol --</option>
                    {roles.map(rol => (
                        <option key={rol.id} value={rol.id}>
                            {rol.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {selectedRoleId && (
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-semibold mb-4">Permisos para "{roles.find(r => r.id === selectedRoleId)?.nombre}"</h3>

                    {isLoading ? (
                        <div className="text-blue-500">Cargando permisos...</div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedNavigationItems).map(([groupName, items]) => (
                                <div key={groupName} className="border border-gray-200 rounded-md p-4">
                                    <h4 className="text-lg font-medium mb-3 text-gray-800">{groupName}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {items.map(item => (
                                            <div key={item.id} className="flex items-center">
                                                <input
                                                    id={`perm-${item.id}`}
                                                    type="checkbox"
                                                    checked={stagedPermissions.includes(item.id)}
                                                    onChange={() => handlePermissionToggle(item.id)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    disabled={isSaving}
                                                />
                                                <label htmlFor={`perm-${item.id}`} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                                                    {item.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSavePermissions}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={isSaving || isLoading || !selectedRoleId}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Permisos'}
                        </button>
                    </div>
                </div>
            )}
            {!selectedRoleId && (
                <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-md mt-6">
                    Por favor, selecciona un rol para ver y asignar sus permisos.
                </div>
            )}
        </div>
    );
};