import { useState, useEffect, useCallback } from "react";
import { useDashboardApi } from '@shared/api/useDashboardApi';
import { useAuth } from "@app/providers/AuthProvider";
import toast from "react-hot-toast";
import {
  type ApiEmpleado,
  type ApiRol,
  type CreateEmpleadoData,
  type UpdateEmpleadoData,
  type ResetPasswordResponse,
  type CreateRolData,
  type UpdateRolData,
  type NominaResponse,
  type CalcularPagoResponse,
  type PagarNominaData,
} from '@shared/types';

// Define the structure of a navigation item received from the backend
import { type NavigationItem } from '@shared/constants/navigation.constants';

export const useTeamManagement = () => {
  const [empleados, setEmpleados] = useState<ApiEmpleado[]>([]);
  const [roles, setRoles] = useState<ApiRol[]>([]);
  const [todosRoles, setTodosRoles] = useState<ApiRol[]>([]); // Incluye inactivos
  const [nomina, setNomina] = useState<NominaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allNavigationItems, setAllNavigationItems] = useState<NavigationItem[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Renombrar pagarNomina de useDashboardApi a pagarNominaApi para evitar conflicto
  const { makeRequest, calcularPagoNomina, pagarNomina: pagarNominaApi } = useDashboardApi();
  const { user } = useAuth();

  // Verificar si el usuario puede gestionar roles (solo Administrador)
  const puedeGestionarRoles = user?.role === "Administrador";

  // Verificar si el usuario puede ver salarios (Administrador y Gerente)
  const puedeVerSalarios =
    user?.role === "Administrador" || user?.role === "Gerente";

  // ==================== CARGAR EMPLEADOS ====================

  const loadEmpleados = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await makeRequest<{
        success: boolean;
        empleados: ApiEmpleado[];
      }>("/employees");
      setEmpleados(data.empleados);
    } catch (err: any) {
      console.error("Error al cargar empleados:", err);
      const errorMessage =
        err.message || "No se pudieron cargar los empleados.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest]);

  // ==================== CARGAR ROLES ====================

  const loadRoles = useCallback(async () => {
    try {
      const data = await makeRequest<{ success: boolean; roles: ApiRol[] }>(
        "/employees/roles"
      );
      setRoles(data.roles);
    } catch (err: any) {
      console.error("Error al cargar roles:", err);
      toast.error("No se pudieron cargar los roles disponibles.");
    }
  }, [makeRequest]);

  const loadTodosRoles = useCallback(async () => {
    if (!puedeGestionarRoles) return;

    try {
      const data = await makeRequest<{ success: boolean; roles: ApiRol[] }>(
        "/employees/roles/todos"
      );
      setTodosRoles(data.roles);
    } catch (err: any) {
      console.error("Error al cargar todos los roles:", err);
      toast.error("No se pudieron cargar los roles.");
    }
  }, [makeRequest, puedeGestionarRoles]);

  // ==================== CARGAR NÓMINA ====================

  const loadNomina = useCallback(async () => {
    if (!puedeVerSalarios) return;

    try {
      const data = await makeRequest<NominaResponse>("/finance/nomina");
      setNomina(data);
    } catch (err: any) {
      console.error("Error al cargar nómina:", err);
      toast.error("No se pudo cargar la información de nómina.");
    }
  }, [makeRequest, puedeVerSalarios]);

  // ==================== CARGAR ITEMS DE NAVEGACIÓN (PERMISOS DISPONIBLES) ====================

  const loadAllNavigationItems = useCallback(async () => {
    try {
      const response = await makeRequest<{ success: boolean; navigationItems: NavigationItem[] }>('/rbac/permissions');
      if (response.success) {
        setAllNavigationItems(response.navigationItems);
      } else {
        toast.error('Error al cargar ítems de navegación.');
      }
    } catch (err: any) {
      console.error('Error fetching navigation items:', err);
      toast.error('Error de red al cargar ítems de navegación.');
    }
  }, [makeRequest]);

  // ==================== CARGAR PERMISOS DE UN ROL ESPECÍFICO ====================

  const loadRolePermissions = useCallback(async (roleId: number) => {
    // setIsLoading(true); // Control loading in the component that calls this
    try {
      const response = await makeRequest<{ success: boolean; permissions: string[] }>(`/rbac/roles/${roleId}/permissions`);
      if (response.success) {
        setRolePermissions(response.permissions);
      } else {
        toast.error('Error al cargar permisos del rol.');
      }
    } catch (err: any) {
      console.error(`Error fetching permissions for role ${roleId}:`, err);
      toast.error('Error de red al cargar permisos del rol.');
    } finally {
      // setIsLoading(false);
    }
  }, [makeRequest]);

  // ==================== ACTUALIZAR PERMISOS DE ROL ====================

  const updateRolePermissions = useCallback(
    async (roleId: number, permissions: string[]): Promise<boolean> => {
      if (!puedeGestionarRoles) {
        toast.error("No tienes permisos para actualizar permisos de roles");
        return false;
      }
      try {
        const response = await makeRequest<{ success: boolean; message: string }>(
          `/rbac/roles/${roleId}/permissions`,
          {
            method: 'PUT',
            body: JSON.stringify({ permissions }),
          }
        );
        if (response.success) {
          toast.success(response.message || 'Permisos actualizados exitosamente.');
          // Optionally, reload role specific permissions if needed by the caller
          return true;
        } else {
          toast.error(response.message || 'Error al actualizar permisos.');
          return false;
        }
      } catch (err: any) {
        console.error(`Error saving permissions for role ${roleId}:`, err);
        toast.error('Error de red al guardar permisos.');
        return false;
      }
    },
    [makeRequest, puedeGestionarRoles]
  );

  // ==================== EMPLEADOS ====================

  const createEmpleado = useCallback(
    async (data: CreateEmpleadoData): Promise<boolean> => {
      try {
        const response = await makeRequest<{
          success: boolean;
          empleado: ApiEmpleado;
          message: string;
        }>("/employees", {
          method: "POST",
          body: JSON.stringify(data),
        });

        toast.success(response.message || "Empleado creado exitosamente");
        await loadEmpleados();
        if (puedeVerSalarios) await loadNomina();
        return true;
      } catch (err: any) {
        console.error("Error al crear empleado:", err);
        toast.error(err.message || "Error al crear el empleado");
        return false;
      }
    },
    [makeRequest, loadEmpleados, loadNomina, puedeVerSalarios]
  );

  const updateEmpleado = useCallback(
    async (id: number, data: UpdateEmpleadoData): Promise<boolean> => {
      try {
        const response = await makeRequest<{
          success: boolean;
          empleado: ApiEmpleado;
          message: string;
        }>(`/employees/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });

        toast.success(response.message || "Empleado actualizado exitosamente");
        await loadEmpleados();
        if (puedeVerSalarios) await loadNomina();
        return true;
      } catch (err: any) {
        console.error("Error al actualizar empleado:", err);
        toast.error(err.message || "Error al actualizar el empleado");
        return false;
      }
    },
    [makeRequest, loadEmpleados, loadNomina, puedeVerSalarios]
  );

  const desactivarEmpleado = useCallback(
    async (id: number): Promise<boolean> => {
      if (!confirm("¿Estás seguro de que deseas desactivar este empleado?")) {
        return false;
      }

      try {
        const response = await makeRequest<{
          success: boolean;
          message: string;
        }>(`/employees/${id}`, {
          method: "DELETE",
        });

        toast.success(response.message || "Empleado desactivado exitosamente");
        await loadEmpleados();
        if (puedeVerSalarios) await loadNomina();
        return true;
      } catch (err: any) {
        console.error("Error al desactivar empleado:", err);
        toast.error(err.message || "Error al desactivar el empleado");
        return false;
      }
    },
    [makeRequest, loadEmpleados, loadNomina, puedeVerSalarios]
  );

  const activarEmpleado = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const response = await makeRequest<{
          success: boolean;
          message: string;
        }>(`/employees/${id}/activar`, {
          method: "POST",
        });

        toast.success(response.message || "Empleado reactivado exitosamente");
        await loadEmpleados();
        if (puedeVerSalarios) await loadNomina();
        return true;
      } catch (err: any) {
        console.error("Error al reactivar empleado:", err);
        toast.error(err.message || "Error al reactivar el empleado");
        return false;
      }
    },
    [makeRequest, loadEmpleados, loadNomina, puedeVerSalarios]
  );

  const resetearPassword = useCallback(
    async (id: number): Promise<string | null> => {
      if (
        !confirm(
          "¿Resetear la contraseña de este empleado? Se generará una contraseña temporal."
        )
      ) {
        return null;
      }

      try {
        const response = await makeRequest<ResetPasswordResponse>(
          `/employees/${id}/resetear-password`,
          {
            method: "POST",
          }
        );

        toast.success(response.message || "Contraseña reseteada exitosamente");
        await loadEmpleados();
        return response.password_temporal;
      } catch (err: any) {
        console.error("Error al resetear contraseña:", err);
        toast.error(err.message || "Error al resetear la contraseña");
        return null;
      }
    },
    [makeRequest, loadEmpleados]
  );

  // ==================== ROLES ====================

  const createRol = useCallback(
    async (data: CreateRolData): Promise<boolean> => {
      if (!puedeGestionarRoles) {
        toast.error("No tienes permisos para crear roles");
        return false;
      }

      try {
        const response = await makeRequest<{
          success: boolean;
          rol: ApiRol;
          message: string;
        }>("/employees/roles/crear", {
          method: "POST",
          body: JSON.stringify(data),
        });

        toast.success(response.message || "Rol creado exitosamente");
        await loadTodosRoles();
        await loadRoles();
        return true;
      } catch (err: any) {
        console.error("Error al crear rol:", err);
        toast.error(err.message || "Error al crear el rol");
        return false;
      }
    },
    [makeRequest, loadTodosRoles, loadRoles, puedeGestionarRoles]
  );

  const updateRol = useCallback(
    async (id: number, data: UpdateRolData): Promise<boolean> => {
      if (!puedeGestionarRoles) {
        toast.error("No tienes permisos para modificar roles");
        return false;
      }

      try {
        const response = await makeRequest<{
          success: boolean;
          rol: ApiRol;
          message: string;
        }>(`/employees/roles/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });

        toast.success(response.message || "Rol actualizado exitosamente");
        await loadTodosRoles();
        await loadRoles();
        return true;
      } catch (err: any) {
        console.error("Error al actualizar rol:", err);
        toast.error(err.message || "Error al actualizar el rol");
        return false;
      }
    },
    [makeRequest, loadTodosRoles, loadRoles, puedeGestionarRoles]
  );

  const desactivarRol = useCallback(
    async (id: number): Promise<boolean> => {
      if (!puedeGestionarRoles) {
        toast.error("No tienes permisos para desactivar roles");
        return false;
      }

      if (!confirm("¿Estás seguro de que deseas desactivar este rol?")) {
        return false;
      }

      try {
        const response = await makeRequest<{
          success: boolean;
          message: string;
        }>(`/employees/roles/${id}`, {
          method: "DELETE",
        });

        toast.success(response.message || "Rol desactivado exitosamente");
        await loadTodosRoles();
        await loadRoles();
        return true;
      } catch (err: any) {
        console.error("Error al desactivar rol:", err);
        toast.error(err.message || "Error al desactivar el rol");
        return false;
      }
    },
    [makeRequest, loadTodosRoles, loadRoles, puedeGestionarRoles]
  );

  const activarRol = useCallback(
    async (id: number): Promise<boolean> => {
      if (!puedeGestionarRoles) {
        toast.error("No tienes permisos para activar roles");
        return false;
      }

      try {
        const response = await makeRequest<{
          success: boolean;
          message: string;
        }>(`/employees/roles/${id}/activar`, {
          method: "POST",
        });

        toast.success(response.message || "Rol reactivado exitosamente");
        await loadTodosRoles();
        await loadRoles();
        return true;
      } catch (err: any) {
        console.error("Error al reactivar rol:", err);
        toast.error(err.message || "Error al reactivar el rol");
        return false;
      }
    },
    [makeRequest, loadTodosRoles, loadRoles, puedeGestionarRoles]
  );

  const registrarIncidencia = useCallback(async (data: {
    id: number;
    monto: number;
    motivo: string;
    es_adelanto: boolean;
  }) => {
    try {
      await makeRequest("/employees/incidencias", {
        method: "POST",
        body: JSON.stringify({
          empleado_id: data.id,
          monto: data.monto,
          motivo: data.motivo,
          es_adelanto: data.es_adelanto,
        }),
      });
      toast.success(
        data.es_adelanto
          ? "Adelanto registrado con éxito"
          : "Incidencia registrada"
      );
      return true;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al registrar incidencia");
      return false;
    }
  }, [makeRequest]);

  // ================== UPDATE EMPLOYEE ROLE ==================
  const updateEmployeeRole = useCallback(
    async (id: number, rol_id: number): Promise<boolean> => {
      try {
        const response = await makeRequest<{
          success: boolean;
          empleado: ApiEmpleado;
          message: string;
        }>(`/employees/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ rol_id }),
        });

        toast.success(response.message || "Rol de empleado actualizado exitosamente");
        await loadEmpleados();
        return true;
      } catch (err: any) {
        console.error("Error al actualizar el rol del empleado:", err);
        toast.error(err.message || "Error al actualizar el rol del empleado");
        return false;
      }
    },
    [makeRequest, loadEmpleados]
  );

  // ==================== ACCIONES DE NÓMINA ====================

  const handlePagarNomina = useCallback(async (empleadoId: number, data: PagarNominaData): Promise<boolean> => {
    if (!user?.id) {
        toast.error("Usuario no autenticado.");
        return false;
    }
    if (!puedeVerSalarios) {
        toast.error("No tienes permisos para pagar nómina.");
        return false;
    }
    try {
        const response = await pagarNominaApi(empleadoId, data);
        toast.success(response.message || "Nómina pagada exitosamente.");
        await loadNomina(); // Recargar la nómina para actualizar el estado
        return true;
    } catch (err: any) {
        console.error("Error al pagar nómina:", err);
        toast.error(err.message || "Error al pagar la nómina.");
        return false;
    }
  }, [pagarNominaApi, loadNomina, user?.id, puedeVerSalarios]);

  const getDetallePagoEmpleado = useCallback(async (empleadoId: number): Promise<CalcularPagoResponse | null> => {
    if (!user?.id) {
        toast.error("Usuario no autenticado.");
        return null;
    }
    if (!puedeVerSalarios) {
        toast.error("No tienes permisos para ver detalles de pago.");
        return null;
    }
    try {
        const detalle = await calcularPagoNomina(empleadoId);
        return detalle;
    } catch (err: any) {
        console.error("Error al obtener detalle de pago:", err);
        toast.error(err.message || "Error al obtener el detalle de pago.");
        return null;
    }
  }, [calcularPagoNomina, user?.id, puedeVerSalarios]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    loadEmpleados();
    loadRoles();
    loadAllNavigationItems(); // Load all possible navigation items
    if (puedeGestionarRoles) loadTodosRoles();
    if (puedeVerSalarios) loadNomina();
  }, [
    loadEmpleados,
    loadRoles,
    loadTodosRoles,
    loadNomina,
    loadAllNavigationItems,
    puedeGestionarRoles,
    puedeVerSalarios,
  ]);

  // ==================== ESTADÍSTICAS ====================

  const stats = {
    total: empleados.length,
    activos: empleados.filter((e) => e.is_active).length,
    inactivos: empleados.filter((e) => !e.is_active).length,
    conAcceso: empleados.filter((e) => e.requiere_login).length,
  };

  return {
    // Estado
    empleados,
    roles,
    todosRoles,
    nomina,
    isLoading,
    error,
    stats,
    puedeGestionarRoles,
    puedeVerSalarios,
    allNavigationItems, // New: All possible navigation items
    rolePermissions,    // New: Permissions for the currently selected role

    // Acciones - Empleados
    reloadEmpleados: loadEmpleados,
    createEmpleado,
    updateEmpleado,
    desactivarEmpleado,
    activarEmpleado,
    resetearPassword,

    // Acciones - Roles
    reloadRoles: loadTodosRoles, // This reloads all roles (active/inactive)
    createRol,
    updateRol,
    desactivarRol,
    activarRol,
    updateEmployeeRole,

    // Acciones - RBAC (New)
    loadRolePermissions,    // New: To load permissions for a specific role
    updateRolePermissions,  // New: To update permissions for a specific role

    // Acciones - Nómina
    reloadNomina: loadNomina,
    registrarIncidencia,
    pagarNomina: handlePagarNomina, // NUEVO: Renombrar para exportar
    getDetallePagoEmpleado // NUEVO
  };
};