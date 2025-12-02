// frontend/src/components/team/CreateEmployeeModal.tsx - VERSIÓN COMPLETA CON ZOD
import React, { useState, useEffect } from 'react';
import { type ApiEmpleado, type ApiRol, type CreateEmpleadoData, type UpdateEmpleadoData } from '../../types';
import { XIcon, UserIcon, MailIcon, PhoneIcon, IdCardIcon, LockIcon, DollarSignIcon, CalendarIcon } from '../icons';
import { createEmployeeSchema } from '../../schemas/empleado.schema';
import type { ZodIssue } from 'zod';

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
    const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

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
            setFormErrors({});
        }
    }, [isOpen, empleado, roles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        let processedValue = value;
        
        // Validación en tiempo real para DNI (solo números, máximo 8)
        if (name === 'documento_identidad') {
            processedValue = value.replace(/\D/g, '').slice(0, 8);
        }
        
        // Validación en tiempo real para teléfono (solo números, máximo 9, debe empezar con 9)
        if (name === 'telefono') {
            let cleanValue = value.replace(/\D/g, '');
            
            // Si el primer dígito no es 9, limpiar el valor
            if (cleanValue.length > 0 && cleanValue[0] !== '9') {
                cleanValue = cleanValue.replace(/^[0-8]/, '');
            }
            
            processedValue = cleanValue.slice(0, 9);
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'rol_id' ? Number(processedValue) : processedValue)
        }));

        // Limpiar error si existe
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Preparar datos para validación (convertir campos vacíos a undefined)
        const dataToValidate = {
            ...formData,
            documento_identidad: formData.documento_identidad || undefined,
            telefono: formData.telefono || undefined,
            salario: formData.salario || undefined,
            fecha_ingreso: formData.fecha_ingreso || undefined,
        };

        const validationResult = createEmployeeSchema.safeParse(dataToValidate);

        if (!validationResult.success) {
            const issues = validationResult.error.issues;
            const newErrors: Record<string, string> = {};
            issues.forEach((issue: ZodIssue) => {
                const path = issue.path[0];
                if (typeof path === 'string') {
                    newErrors[path] = issue.message;
                }
            });
            setFormErrors(newErrors);
            
            // Desplazar al primer error
            const firstErrorField = Object.keys(newErrors)[0];
            if (firstErrorField) {
                const element = document.querySelector(`[name="${firstErrorField}"]`);
                if (element) {
                    (element as HTMLElement).focus();
                }
            }
            
            return;
        }

        setFormErrors({});
        setIsSubmitting(true);

        try {
            let dataToSubmit: CreateEmpleadoData | UpdateEmpleadoData;

            if (isEditMode) {
                dataToSubmit = {
                    nombre: validationResult.data.nombre,
                    email: validationResult.data.email,
                    rol_id: validationResult.data.rol_id,
                    documento_identidad: validationResult.data.documento_identidad || undefined,
                    telefono: validationResult.data.telefono || undefined,
                    salario: validationResult.data.salario || undefined,
                    fecha_ingreso: validationResult.data.fecha_ingreso || undefined,
                };
            } else {
                dataToSubmit = {
                    ...validationResult.data,
                    password: validationResult.data.requiere_login && validationResult.data.password ? validationResult.data.password : undefined,
                    salario: validationResult.data.salario || undefined,
                    fecha_ingreso: validationResult.data.fecha_ingreso || undefined,
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
                                                formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Ej: Juan Pérez"
                                        />
                                    </div>
                                    {formErrors.nombre && <p className="text-red-500 text-sm mt-1">{formErrors.nombre}</p>}
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
                                                formErrors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="empleado@restaurante.com"
                                        />
                                    </div>
                                    {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                                </div>

                                {/* Documento */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Documento de Identidad (DNI)
                                    </label>
                                    <div className="relative">
                                        <IdCardIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="documento_identidad"
                                            value={formData.documento_identidad}
                                            onChange={handleChange}
                                            maxLength={8}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                formErrors.documento_identidad ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="87654321"
                                        />
                                    </div>
                                    {formErrors.documento_identidad && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.documento_identidad}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">8 dígitos numéricos exactos (opcional)</p>
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
                                            maxLength={9}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                formErrors.telefono ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="912345678"
                                        />
                                    </div>
                                    {formErrors.telefono && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.telefono}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">9 dígitos, debe comenzar con 9 (ej: 912345678) (opcional)</p>
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
                                            formErrors.rol_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value={0}>Seleccionar rol...</option>
                                        {roles.map(rol => (
                                            <option key={rol.id} value={rol.id}>
                                                {rol.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.rol_id && <p className="text-red-500 text-sm mt-1">{formErrors.rol_id}</p>}
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
                                                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Mínimo 8 caracteres"
                                            />
                                        </div>
                                        {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
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