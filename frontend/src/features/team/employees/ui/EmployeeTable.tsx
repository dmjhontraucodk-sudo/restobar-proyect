// frontend/src/features/team/employees/ui/EmployeeTable.tsx
import React, { useState } from "react";
import { type ApiEmpleado } from '@shared/types';
import {
  EditIcon,
  TrashIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldIcon,
  MailIcon,
  PhoneIcon,
  ExclamationIcon
} from "@shared/ui/Icons";

interface EmployeeTableProps {
  empleados: ApiEmpleado[];
  onEdit: (empleado: ApiEmpleado) => void;
  onDelete: (id: number) => void;
  onActivate: (id: number) => void;
  onResetPassword: (id: number) => Promise<string | null>;
  onAddIncidencia: (empleado: ApiEmpleado) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  empleados,
  onEdit,
  onDelete,
  onActivate,
  onResetPassword,
  onAddIncidencia,
}) => {
  const [passwordModal, setPasswordModal] = useState<{
    show: boolean;
    password: string;
  }>({
    show: false,
    password: "",
  });

  const handleResetPassword = async (id: number) => {
    const password = await onResetPassword(id);
    if (password !== null) {
      setPasswordModal({ show: true, password });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Contraseña copiada al portapapeles");
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acceso
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
              {empleados.map((empleado) => (
                <tr
                  key={empleado.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Empleado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                          {empleado.nombre?.charAt(0) ||
                            empleado.email.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">
                            {empleado.nombre || "Sin nombre"}
                          </div>
                          {empleado.es_propietario && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <ShieldIcon className="w-3 h-3 mr-1" />
                              Propietario
                            </span>
                          )}
                        </div>
                        {empleado.documento_identidad && (
                          <div className="text-xs text-gray-500">
                            DNI: {empleado.documento_identidad}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contacto */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <MailIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {empleado.email}
                      </div>
                      {empleado.telefono && (
                        <div className="flex items-center text-sm text-gray-500">
                          <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                          {empleado.telefono}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {empleado.roles.nombre}
                    </span>
                  </td>

                  {/* Acceso */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {empleado.requiere_login ? (
                        <>
                          <div className="flex items-center text-sm text-green-600">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Con acceso
                          </div>
                          {empleado.debe_cambiar_pass && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Debe cambiar contraseña
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center text-sm text-gray-400">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Sin acceso
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {empleado.is_active ? (
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
                        onClick={() => onEdit(empleado)}
                        disabled={empleado.es_propietario}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Editar empleado"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>

                      {/* ✅ BOTÓN DE INCIDENCIA */}
                      {empleado.is_active && (
                        <button
                          onClick={() => onAddIncidencia(empleado)}
                          className="p-1.5 text-orange-400 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Registrar Incidencia / Adelanto"
                        >
                          <ExclamationIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* Resetear Contraseña */}
                      {empleado.requiere_login && (
                        <button
                          onClick={() => handleResetPassword(empleado.id)}
                          disabled={empleado.es_propietario}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Desactivar empleado"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onActivate(empleado.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Reactivar empleado"
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

        {empleados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay empleados registrados</p>
          </div>
        )}
      </div>

      {/* Modal de Contraseña Temporal */}
      {passwordModal.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setPasswordModal({ show: false, password: "" })}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Contraseña Temporal Generada
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Comparte esta contraseña con el empleado:
                </p>
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-300">
                  <code className="text-lg font-mono text-gray-900">
                    {passwordModal.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(passwordModal.password)}
                    className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <p className="text-xs text-amber-600 mb-4">
                ⚠️ Esta contraseña es temporal. El empleado deberá cambiarla en
                su primer inicio de sesión.
              </p>
              <button
                onClick={() => setPasswordModal({ show: false, password: "" })}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
