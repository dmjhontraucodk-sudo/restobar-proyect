// frontend/src/features/team/ui/AssignRolesTab.tsx
import React, { useState, useEffect } from 'react';
import { type ApiEmpleado, type ApiRol } from '@shared/types';
// import toast from 'react-hot-toast'; // Removed as toast calls are now in the hook

interface AssignFunctionsTabProps {
    empleados: ApiEmpleado[];
    roles: ApiRol[];
    onUpdateRole: (employeeId: number, roleId: number) => Promise<boolean>;
}

export const AssignRolesTab: React.FC<AssignFunctionsTabProps> = ({
    empleados: initialEmpleados,
    roles,
    onUpdateRole,
}) => {
    // Use local state to manage UI changes before saving
    const [empleados, setEmpleados] = useState<ApiEmpleado[]>([]);
    
    useEffect(() => {
        setEmpleados(initialEmpleados);
    }, [initialEmpleados]);

    const handleRoleChange = (employeeId: number, newRoleId: number) => {
        setEmpleados(prev =>
            prev.map(emp =>
                emp.id === employeeId ? { ...emp, rol_id: newRoleId } : emp
            )
        );
    };

    const handleSaveChanges = async (employeeId: number) => {
        const employee = empleados.find(emp => emp.id === employeeId);
        if (!employee || !employee.rol_id) return;

        const success = await onUpdateRole(employeeId, employee.rol_id);
        
        if (success) {
            // Optionally, you can show a success message here, but the hook already does.
            // The parent component will trigger a re-render with the updated employee list.
        } else {
            // If the update fails, revert the change in the local state
            setEmpleados(initialEmpleados);
        }
    };

    if (empleados.length === 0) {
        return <div className="p-4 text-center text-gray-500">No hay empleados para mostrar.</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Asignar Roles a Empleados</h1>
            <p className="text-gray-600 mb-6">
                Cambia el rol de un empleado y haz clic en "Guardar" para aplicar el cambio. La lista se actualizará automáticamente.
            </p>
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                            <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol Actual</th>
                            <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nuevo Rol</th>
                            <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {empleados.map(empleado => (
                            <tr key={empleado.id}>
                                <td className="py-4 px-6 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{empleado.nombre}</div>
                                    <div className="text-sm text-gray-500">{empleado.email}</div>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">{empleado.roles?.nombre || 'No asignado'}</td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                    <select
                                        value={empleado.rol_id ?? ''}
                                        onChange={e => handleRoleChange(empleado.id, parseInt(e.target.value, 10))}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                                    >
                                        <option value="" disabled>Selecciona un rol</option>
                                        {roles.map(rol => (
                                            <option key={rol.id} value={rol.id}>
                                                {rol.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => handleSaveChanges(empleado.id)}
                                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-400"
                                        disabled={empleado.rol_id === initialEmpleados.find(e => e.id === empleado.id)?.rol_id}
                                    >
                                        Guardar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};