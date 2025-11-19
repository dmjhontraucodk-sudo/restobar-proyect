// frontend/src/components/team/CreateEmployeeModal.tsx - VERSIÓN COMPLETA CON SALARIO
import React, { useState, useEffect } from 'react';
import { type ApiEmpleado, type ApiRol, type CreateEmpleadoData, type UpdateEmpleadoData } from '../../types';
import { XIcon, UserIcon, MailIcon, PhoneIcon, IdCardIcon, LockIcon, DollarSignIcon, CalendarIcon } from '../icons';

interface CreateEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateEmpleadoData | UpdateEmpleadoData) => Promise<boolean>;
    empleado?: ApiEmpleado | null;
    roles: ApiRol[];
    puedeVerSalarios: boolean;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    empleado,
    roles,
    puedeVerSalarios
}) => {
    const [formData, setFormData] = useState<CreateEmpleadoData>({
        nombre: '',
        email: '',
        rol_id: 0,
        documento_identidad: '',
        telefono: '',
        requiere_login: false,
        password: '',
        salario: '',
        fecha_ingreso: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEditMode = !!empleado;

    useEffect(() => {
        if (isOpen) {
            if (empleado) {
                setFormData({
                    nombre: empleado.nombre || '',
                    email: empleado.email,
                    rol_id: empleado.rol_id,
                    documento_identidad: empleado.documento_identidad || '',
                    telefono: empleado.telefono || '',
                    requiere_login: empleado.requiere_login,
                    password: '',
                    salario: empleado.salario || '',
                    fecha_ingreso: empleado.fecha_ingreso 
                        ? new Date(empleado.fecha_ingreso).toISOString().split('T')[0]
                        : ''
                });
            } else {
                setFormData({
                    nombre: '',
                    email: '',
                    rol_id: roles.length > 0 ? roles[0].id : 0,
                    documento_identidad: '',
                    telefono: '',
                    requiere_login: false,
                    password: '',
                    salario: '',
                    fecha_ingreso: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, empleado, roles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'rol_id' ? Number(value) : value)
        }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.rol_id || formData.rol_id === 0) {
            newErrors.rol_id = 'Debes seleccionar un rol';
        }

        if (formData.requiere_login && !isEditMode && !formData.password) {
            newErrors.password = 'La contraseña es requerida para usuarios con acceso al sistema';
        }

        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            let dataToSubmit: CreateEmpleadoData | UpdateEmpleadoData;

            if (isEditMode) {
                dataToSubmit = {
                    nombre: formData.nombre,
                    email: formData.email,
                    rol_id: formData.rol_id,
                    documento_identidad: formData.documento_identidad || undefined,
                    telefono: formData.telefono || undefined,
                    salario: formData.salario || undefined,
                    fecha_ingreso: formData.fecha_ingreso || undefined,
                };
            } else {
                dataToSubmit = {
                    ...formData,
                    password: formData.requiere_login && formData.password ? formData.password : undefined,
                    salario: formData.salario || undefined,
                    fecha_ingreso: formData.fecha_ingreso || undefined,
                };
            }

            const success = await onSubmit(dataToSubmit);
            if (success) {
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isEditMode ? 'Editar Empleado' : 'Nuevo Empleado'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {isEditMode ? 'Modifica los datos del empleado' : 'Completa la información del nuevo empleado'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sección: Información Personal */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">📝 Información Personal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre Completo *
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                errors.nombre ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Ej: Juan Pérez"
                                        />
                                    </div>
                                    {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <div className="relative">
                                        <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="empleado@restaurante.com"
                                        />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>

                                {/* Documento */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Documento de Identidad
                                    </label>
                                    <div className="relative">
                                        <IdCardIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="documento_identidad"
                                            value={formData.documento_identidad}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="DNI o RUC"
                                        />
                                    </div>
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="+51 999 999 999"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sección: Rol y Acceso */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">👤 Rol y Acceso al Sistema</h3>
                            <div className="space-y-4">
                                {/* Rol */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rol *
                                    </label>
                                    <select
                                        name="rol_id"
                                        value={formData.rol_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.rol_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value={0}>Seleccionar rol...</option>
                                        {roles.map(rol => (
                                            <option key={rol.id} value={rol.id}>
                                                {rol.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.rol_id && <p className="text-red-500 text-sm mt-1">{errors.rol_id}</p>}
                                </div>

                                {/* Checkbox Acceso */}
                                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-300">
                                    <input
                                        type="checkbox"
                                        name="requiere_login"
                                        id="requiere_login"
                                        checked={formData.requiere_login}
                                        onChange={handleChange}
                                        disabled={isEditMode}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="requiere_login" className="flex-1 cursor-pointer">
                                        <span className="font-medium text-gray-900">Acceso al Sistema</span>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            Este empleado podrá iniciar sesión en el sistema
                                        </p>
                                    </label>
                                </div>

                                {/* Contraseña */}
                                {formData.requiere_login && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Contraseña {isEditMode ? '(Dejar vacío para mantener actual)' : '*'}
                                        </label>
                                        <div className="relative">
                                            <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                    errors.password ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Mínimo 8 caracteres"
                                            />
                                        </div>
                                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                        {!isEditMode && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Si no defines contraseña, se generará una temporal automáticamente
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sección: Información Laboral (solo si puede ver salarios) */}
                        {puedeVerSalarios && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">💼 Información Laboral</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Salario */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Salario Mensual (S/)
                                        </label>
                                        <div className="relative">
                                            <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                name="salario"
                                                value={formData.salario}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="1500.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Fecha de Ingreso */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fecha de Ingreso
                                        </label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="date"
                                                name="fecha_ingreso"
                                                value={formData.fecha_ingreso}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Empleado')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};