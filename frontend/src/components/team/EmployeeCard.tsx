// frontend/src/components/team/EmployeeCard.tsx
import React from 'react';
import { type ApiEmpleado } from '../../types';
import { 
    EditIcon, 
    TrashIcon, 
    KeyIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    ShieldIcon,
    MailIcon,
    PhoneIcon,
    UserIcon
} from '../icons';

interface EmployeeCardProps {
    empleado: ApiEmpleado;
    onEdit: (empleado: ApiEmpleado) => void;
    onDelete: (id: number) => void;
    onActivate: (id: number) => void;
    onResetPassword: (id: number) => Promise<string | null>;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
    empleado,
    onEdit,
    onDelete,
    onActivate,
    onResetPassword
}) => {
    const getStatusColor = (isActive: boolean) => {
        return isActive 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200';
    };

    const getCardBorder = (isActive: boolean) => {
        return isActive 
            ? 'border-l-4 border-l-green-500' 
            : 'border-l-4 border-l-red-500';
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 ${getCardBorder(empleado.is_active)}`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                            {empleado.nombre?.charAt(0) || empleado.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {empleado.nombre || 'Sin nombre'}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {empleado.roles.nombre}
                            </span>
                        </div>
                    </div>

                    {/* Estado */}
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(empleado.is_active)}`}>
                        {empleado.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    {empleado.es_propietario && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <ShieldIcon className="w-3 h-3 mr-1" />
                            Propietario
                        </span>
                    )}
                    {empleado.requiere_login ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Con acceso al sistema
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <XCircleIcon className="w-3 h-3 mr-1" />
                            Sin acceso
                        </span>
                    )}
                    {empleado.debe_cambiar_pass && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Debe cambiar contraseña
                        </span>
                    )}
                </div>
            </div>

            {/* Información de contacto */}
            <div className="p-6 space-y-3">
                <div className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0">
                        <MailIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-900 truncate">{empleado.email}</p>
                    </div>
                </div>

                {empleado.telefono && (
                    <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg flex-shrink-0">
                            <PhoneIcon className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500">Teléfono</p>
                            <p className="text-sm text-gray-900">{empleado.telefono}</p>
                        </div>
                    </div>
                )}

                {empleado.documento_identidad && (
                    <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg flex-shrink-0">
                            <UserIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500">Documento</p>
                            <p className="text-sm text-gray-900">{empleado.documento_identidad}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                <div className="flex justify-end space-x-2">
                    {/* Editar */}
                    <button
                        onClick={() => onEdit(empleado)}
                        disabled={empleado.es_propietario}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                        title="Editar empleado"
                    >
                        <EditIcon className="w-4 h-4" />
                        <span className="text-sm">Editar</span>
                    </button>

                    {/* Resetear Contraseña */}
                    {empleado.requiere_login && (
                        <button
                            onClick={() => onResetPassword(empleado.id)}
                            disabled={empleado.es_propietario}
                            className="p-2 text-amber-600 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            title="Resetear contraseña"
                        >
                            <KeyIcon className="w-4 h-4" />
                        </button>
                    )}

                    {/* Desactivar/Activar */}
                    {empleado.is_active ? (
                        <button
                            onClick={() => onDelete(empleado.id)}
                            disabled={empleado.es_propietario}
                            className="p-2 text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            title="Desactivar empleado"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => onActivate(empleado.id)}
                            className="p-2 text-green-600 bg-white border border-green-200 rounded-xl hover:bg-green-50 transition-all duration-200"
                            title="Reactivar empleado"
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};