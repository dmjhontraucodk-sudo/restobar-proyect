// frontend/src/hooks/useGlobalConfig.ts - CON VALIDACIÓN COMPLETA DE HORARIO

import { useState, useEffect } from "react";
import { useAuth } from "@app/providers/AuthProvider";
import type { TenantConfig } from "../types/tenant-config.types";

/**
 * 🌍 Hook Global para Configuración del Tenant
 */
export const useGlobalConfig = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [publicConfig, setPublicConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Cargar configuración pública
  // ✅ Cargar configuración pública
  useEffect(() => {
    const loadPublicConfig = async () => {
      try {
        const hostname = window.location.hostname;

        // ✅ VALIDAR SI HAY SUBDOMINIO
        // Si es solo "localhost" sin subdominio, no cargar config
        if (hostname === "localhost") {
          console.log("🏠 Landing page - sin tenant, no cargar config");
          setPublicConfig({
            pedidos_activos: false,
            horario: { inicio: "08:00", fin: "22:00" },
            dentro_de_horario: false,
            monto_minimo: 0,
            costo_delivery: 0,
            tiempo_preparacion: 30,
          });
          return;
        }

        // Extraer subdominio
        const subdomain = hostname.split(".")[0];

        // Si el subdominio es "localhost" también ignorar
        if (subdomain === "localhost" || !subdomain) {
          console.log("🏠 Sin subdominio válido");
          setPublicConfig({
            pedidos_activos: false,
            horario: { inicio: "08:00", fin: "22:00" },
            dentro_de_horario: false,
            monto_minimo: 0,
            costo_delivery: 0,
            tiempo_preparacion: 30,
          });
          return;
        }

        console.log(`🔍 Cargando config para tenant: ${subdomain}`);

        const response = await fetch(`http://localhost:3000/api/web/config`, {
          headers: {
            "X-Tenant-Subdomain": subdomain,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPublicConfig(data.configuracion || {});
          console.log("✅ Configuración pública cargada:", data);
        } else {
          console.log("⚠️ No se pudo cargar configuración pública");
          // Configuración por defecto si falla
          setPublicConfig({
            pedidos_activos: true,
            horario: { inicio: "08:00", fin: "22:00" },
            dentro_de_horario: true,
            monto_minimo: 0,
            costo_delivery: 0,
            tiempo_preparacion: 30,
          });
        }
      } catch (err) {
        console.error("❌ Error cargando configuración pública:", err);
        // Configuración por defecto en caso de error
        setPublicConfig({
          pedidos_activos: true,
          horario: { inicio: "08:00", fin: "22:00" },
          dentro_de_horario: true,
          monto_minimo: 0,
          costo_delivery: 0,
          tiempo_preparacion: 30,
        });
      }
    };

    loadPublicConfig();
  }, []);
  // ✅ Cargar configuración completa (para dashboard)
  useEffect(() => {
    const loadConfig = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const token = localStorage.getItem("authToken");
        if (!token) {
          console.log("⚠️ [useGlobalConfig] No hay authToken en localStorage");
          setIsLoading(false);
          return;
        }

        const subdomain = window.location.hostname.split(".")[0];

        const response = await fetch(
          "http://localhost:3000/api/dashboard/config",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-Subdomain": subdomain,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setConfig(data.config);
        setError(null);
      } catch (err: any) {
        console.error("❌ [useGlobalConfig] Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [user]);

  // ========== HELPERS ==========

  // ✅ Validar si está dentro del horario de atención
  const verificarHorarioAtencion = () => {
    // Si tenemos configuración pública, usarla
    if (publicConfig) {
      return {
        dentroDeHorario: publicConfig.dentro_de_horario ?? true,
        horario: publicConfig.horario || { inicio: "08:00", fin: "22:00" },
        horaActual: new Date().toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };
    }

    // Si no hay configuración pública, calcular manualmente
    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const horarioInicio = config?.pedidos_web_inicio || "08:00";
    const horarioFin = config?.pedidos_web_fin || "22:00";

    const dentroDeHorario =
      horaActual >= horarioInicio && horaActual <= horarioFin;

    return {
      dentroDeHorario,
      horario: {
        inicio: horarioInicio,
        fin: horarioFin,
      },
      horaActual,
    };
  };

  // ✅ Obtener configuración para pedidos web (con validación de horario)
  const getPedidosWebConfig = () => {
    const horarioCheck = verificarHorarioAtencion();

    return {
      // Configuración básica
      activos:
        publicConfig?.pedidos_activos ?? config?.pedidos_online_activos ?? true,
      dentroDeHorario: horarioCheck.dentroDeHorario,
      horario: horarioCheck.horario,
      horaActual: horarioCheck.horaActual,

      // Costos y montos
      costoDelivery:
        publicConfig?.costo_delivery ?? config?.costo_delivery ?? 0,
      montoMinimo:
        publicConfig?.monto_minimo ?? config?.monto_minimo_pedido ?? 0,
      tiempoPrep:
        publicConfig?.tiempo_preparacion ?? config?.tiempo_prep_web ?? 30,

      // Información adicional
      mensajeBienvenida:
        publicConfig?.mensaje_bienvenida ?? config?.mensaje_bienvenida_web,
      reservasActivas:
        publicConfig?.reservas_activas ?? config?.reservas_activas ?? false,
      diasLimiteReserva:
        publicConfig?.dias_limite_reserva ?? config?.dias_limite_reserva ?? 7,
    };
  };

  // ✅ Validación completa para pedidos
  const validarPedidoDisponible = () => {
    const pedidosConfig = getPedidosWebConfig();

    if (!pedidosConfig.activos) {
      return {
        disponible: false,
        mensaje: "Los pedidos online están temporalmente desactivados",
        error: "PEDIDOS_WEB_DESACTIVADOS",
      };
    }

    if (!pedidosConfig.dentroDeHorario) {
      return {
        disponible: false,
        mensaje: `Fuera de horario de atención. Horario: ${pedidosConfig.horario.inicio} - ${pedidosConfig.horario.fin}`,
        error: "FUERA_DE_HORARIO",
      };
    }

    return {
      disponible: true,
      mensaje: "Pedidos disponibles",
    };
  };

  return {
    // Estado
    config,
    publicConfig,
    isLoading,
    error,

    // 🏢 Información del Negocio
    nombreNegocio: config?.nombre_negocio || user?.tenantName || "RestBar",
    tipoNegocio: config?.tipo_negocio || "Restaurante",
    logoUrl: config?.logo_url,
    eslogan: config?.eslogan,
    ruc: config?.ruc,
    direccion: config?.direccion,

    // 📞 Contacto
    telefono: config?.telefono_principal,
    telefonoSecundario: config?.telefono_secundario,
    email: config?.email_negocio,
    whatsapp: config?.whatsapp_business,

    // 🌐 Redes Sociales
    facebook: config?.facebook_url,
    instagram: config?.instagram_url,

    // 🕐 Horarios
    horarios: {
      apertura: config?.horario_apertura || "08:00",
      cierre: config?.horario_cierre || "22:00",
      webInicio: config?.pedidos_web_inicio || "08:00",
      webFin: config?.pedidos_web_fin || "22:00",
    },

    // 💳 Métodos de Pago
    metodosPago: {
      efectivo: config?.acepta_efectivo ?? true,
      tarjeta: config?.acepta_tarjeta ?? true,
      yape: {
        activo: config?.acepta_yape ?? false,
        numero: config?.yape_numero,
        qrUrl: config?.yape_qr_url,
      },
      plin: {
        activo: config?.acepta_plin ?? false,
        numero: config?.plin_numero,
        qrUrl: config?.plin_qr_url,
      },
      transferencia: {
        activo: config?.acepta_transferencia ?? false,
        banco: config?.banco_nombre,
        cuenta: config?.banco_cuenta,
        cci: config?.banco_cci,
        titular: config?.banco_titular,
      },
    },

    // 🖨️ Tickets
    ticket: {
      formato: config?.ticket_formato || "80mm",
      mostrarLogo: config?.ticket_mostrar_logo ?? true,
      pieMensaje: config?.ticket_pie_mensaje,
      copias: config?.ticket_copias || 1,
      incluirQr: config?.ticket_incluir_qr ?? false,
      mostrarMetodo: config?.ticket_mostrar_metodo ?? true,
    },

    // ⚙️ Operaciones
    operaciones: {
      tiempoPreparacion: config?.tiempo_preparacion || 30,
      alertarAgotados: config?.alertar_agotados ?? true,
    },

    // 🌐 Pedidos Web (CON VALIDACIÓN COMPLETA)
    pedidosWeb: getPedidosWebConfig(),

    // 📅 Reservas
    reservas: {
      activas: config?.reservas_activas ?? false,
      diasLimite: config?.dias_limite_reserva || 7,
    },

    // 📦 Inventario
    inventario: {
      alertasStockBajo: config?.alertas_stock_bajo ?? true,
      nivelAlerta: config?.nivel_alerta_stock || 10,
    },

    // 💰 Caja
    caja: {
      fondoInicial: config?.fondo_caja_inicial || 100,
      alertaDiferenciaMonto: config?.alerta_diferencia_monto || 50,
      alertaDiferenciaPct: config?.alerta_diferencia_pct || 5,
      requiereObsCierre: config?.requiere_obs_cierre ?? false,
    },

    // 🔔 Notificaciones
    notificaciones: {
      emailNuevosPedidos: config?.email_nuevos_pedidos,
      whatsappPedidosListos: config?.whatsapp_pedidos_listos,
      stockCritico: {
        activo: config?.notif_stock_critico ?? false,
        email: config?.email_stock_critico,
      },
      resumenDiario: {
        activo: config?.resumen_diario_activo ?? false,
        hora: config?.resumen_diario_hora || "20:00",
      },
    },

    // ✅ VALIDACIONES COMPLETAS
    validaciones: {
      // Validación completa de disponibilidad
      pedidoDisponible: validarPedidoDisponible,

      // Validación individual
      pedidosActivos: () => getPedidosWebConfig().activos,
      dentroDeHorario: () => getPedidosWebConfig().dentroDeHorario,

      // Validación con monto
      pedidoValido: (montoActual: number) => {
        const pedidosConfig = getPedidosWebConfig();
        const validacionBase = validarPedidoDisponible();

        if (!validacionBase.disponible) {
          return validacionBase;
        }

        if (montoActual < pedidosConfig.montoMinimo) {
          return {
            disponible: false,
            mensaje: `El monto mínimo de pedido es S/ ${pedidosConfig.montoMinimo.toFixed(
              2
            )}`,
            error: "MONTO_MINIMO_NO_ALCANZADO",
          };
        }

        return {
          disponible: true,
          mensaje: "Pedido válido",
        };
      },
    },
  };
};
