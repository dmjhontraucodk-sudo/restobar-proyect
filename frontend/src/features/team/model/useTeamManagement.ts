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
  type PagarNominaResponse,
} from '@shared/types';

export const useTeamManagement = () => {
  const [empleados, setEmpleados] = useState<ApiEmpleado[]>([]);
  const [roles, setRoles] = useState<ApiRol[]>([]);
  const [todosRoles, setTodosRoles] = useState<ApiRol[]>([]); // Incluye inactivos
  const [nomina, setNomina] = useState<NominaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (puedeGestionarRoles) loadTodosRoles();
    if (puedeVerSalarios) loadNomina();
  }, [
    loadEmpleados,
    loadRoles,
    loadTodosRoles,
    loadNomina,
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

    // Acciones - Empleados
    reloadEmpleados: loadEmpleados,
    createEmpleado,
    updateEmpleado,
    desactivarEmpleado,
    activarEmpleado,
    resetearPassword,

    // Acciones - Roles
    reloadRoles: loadTodosRoles,
    createRol,
    updateRol,
    desactivarRol,
    activarRol,

    // Acciones - Nómina
    reloadNomina: loadNomina,
    registrarIncidencia,
    pagarNomina: handlePagarNomina, // NUEVO: Renombrar para exportar
    getDetallePagoEmpleado // NUEVO
  };
};