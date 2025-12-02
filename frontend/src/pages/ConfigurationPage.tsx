// frontend/src/pages/ConfigurationPage.tsx - VERSIÓN SIMPLIFICADA

import React, { useState, useEffect } from "react";
import { useTenantConfig } from "../hooks/useTenantConfig";
import { useDashboardApi } from "../hooks/useDashboardApi";
import toast from "react-hot-toast";
import {
  BuildingIcon,
  CreditCardIcon,
  PrinterIcon,
  CogIcon,
  GlobeIcon,
  PackageIcon,
  WalletIcon,
  BellIcon,
  RefreshIcon,
  CheckIcon,
  AlertIcon,
  ResetIcon,
} from "../components/icons/ConfigIcons";

// Funciones de validación específicas para Perú
const validarTelefonoPeruano = (telefono: string): boolean => {
  if (!telefono) return true; // Campo opcional en configuración
  // Validar que tenga 9 dígitos y empiece con 9, o formato +51
  const regex = /^(9\d{8}|\+51\s?\d{9})$/;
  return regex.test(telefono);
};

const validarRUC = (ruc: string): boolean => {
  if (!ruc) return true; // Campo opcional
  // Validar RUC peruano: 11 dígitos numéricos
  const regex = /^\d{11}$/;
  return regex.test(ruc);
};

const validarEmail = (email: string): boolean => {
  if (!email) return true; // Campo opcional
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

const validarWhatsApp = (whatsapp: string): boolean => {
  if (!whatsapp) return true; // Campo opcional
  // Validar número de WhatsApp peruano: 9 dígitos que empieza con 9, o formato +51
  const regex = /^(9\d{8}|\+51\s?\d{9})$/;
  return regex.test(whatsapp);
};

const ConfigurationPage: React.FC = () => {
  const { config, isLoading, updateConfig, resetConfig, reloadConfig } =
    useTenantConfig();

  const { uploadImage, isLoading: isUploading } = useDashboardApi();

  const [activeTab, setActiveTab] = useState("negocio");
  const [formData, setFormData] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [yapeQrFile, setYapeQrFile] = useState<File | null>(null);
  const [yapeQrPreview, setYapeQrPreview] = useState<string | null>(null);
  const [plinQrFile, setPlinQrFile] = useState<File | null>(null);
  const [plinQrPreview, setPlinQrPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Tabs de configuración (SIMPLIFICADO)
  const tabs = [
    { id: "negocio", label: "Negocio", icon: BuildingIcon },
    { id: "pagos", label: "Pagos", icon: CreditCardIcon },
    { id: "tickets", label: "Tickets", icon: PrinterIcon },
    { id: "operaciones", label: "Operaciones", icon: CogIcon },
    { id: "web", label: "Web", icon: GlobeIcon },
    { id: "inventario", label: "Inventario", icon: PackageIcon },
    { id: "caja", label: "Caja", icon: WalletIcon },
    { id: "notificaciones", label: "Notificaciones", icon: BellIcon },
  ];

  // Cargar configuración al montar
  useEffect(() => {
    reloadConfig();
  }, [reloadConfig]);

  // Sincronizar formData con config
  useEffect(() => {
    if (config) {
      setFormData(config);
      setHasChanges(false);
      setFieldErrors({});

      if (config.logo_url) {
        setLogoPreview(config.logo_url);
      }
      if (config.yape_qr_url) {
        setYapeQrPreview(config.yape_qr_url);
      }
      if (config.plin_qr_url) {
        setPlinQrPreview(config.plin_qr_url);
      }
    }
  }, [config]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Validar en tiempo real según el campo
    let error = "";
    
    if (field === "ruc" && value && !validarRUC(value)) {
      error = "El RUC debe tener 11 dígitos numéricos";
    } else if ((field === "telefono_principal" || field === "telefono_secundario") && 
               value && !validarTelefonoPeruano(value)) {
      error = "El teléfono debe tener 9 dígitos y comenzar con 9 (ej: 912345678)";
    } else if (field === "email_negocio" && value && !validarEmail(value)) {
      error = "Por favor ingrese un correo electrónico válido";
    } else if (field === "whatsapp_business" && value && !validarWhatsApp(value)) {
      error = "El WhatsApp debe tener 9 dígitos y comenzar con 9 (ej: 912345678)";
    } else if (field === "yape_numero" && value && !validarTelefonoPeruano(value)) {
      error = "El número de Yape debe tener 9 dígitos y comenzar con 9";
    } else if (field === "plin_numero" && value && !validarTelefonoPeruano(value)) {
      error = "El número de Plin debe tener 9 dígitos y comenzar con 9";
    } else if (field === "email_nuevos_pedidos" && value && !validarEmail(value)) {
      error = "Por favor ingrese un correo electrónico válido";
    } else if (field === "email_stock_critico" && value && !validarEmail(value)) {
      error = "Por favor ingrese un correo electrónico válido";
    } else if (field === "whatsapp_pedidos_listos" && value && !validarWhatsApp(value)) {
      error = "El WhatsApp debe tener 9 dígitos y comenzar con 9 (ej: 912345678)";
    }
    
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    } else if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "yape" | "plin"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 10MB");
      return;
    }

    if (type === "logo") {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else if (type === "yape") {
      if (yapeQrPreview && yapeQrPreview.startsWith("blob:")) {
        URL.revokeObjectURL(yapeQrPreview);
      }
      setYapeQrFile(file);
      setYapeQrPreview(URL.createObjectURL(file));
    } else if (type === "plin") {
      if (plinQrPreview && plinQrPreview.startsWith("blob:")) {
        URL.revokeObjectURL(plinQrPreview);
      }
      setPlinQrFile(file);
      setPlinQrPreview(URL.createObjectURL(file));
    }

    setHasChanges(true);
    e.target.value = "";
  };

  const handleRemoveImage = (type: "logo" | "yape" | "plin") => {
    if (type === "logo") {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoPreview(null);
      setLogoFile(null);
      handleChange("logo_url", null);
    } else if (type === "yape") {
      if (yapeQrPreview && yapeQrPreview.startsWith("blob:")) {
        URL.revokeObjectURL(yapeQrPreview);
      }
      setYapeQrPreview(null);
      setYapeQrFile(null);
      handleChange("yape_qr_url", null);
    } else if (type === "plin") {
      if (plinQrPreview && plinQrPreview.startsWith("blob:")) {
        URL.revokeObjectURL(plinQrPreview);
      }
      setPlinQrPreview(null);
      setPlinQrFile(null);
      handleChange("plin_qr_url", null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validar RUC
    if (formData.ruc && !validarRUC(formData.ruc)) {
      errors.ruc = "El RUC debe tener 11 dígitos numéricos";
    }
    
    // Validar teléfonos
    if (formData.telefono_principal && !validarTelefonoPeruano(formData.telefono_principal)) {
      errors.telefono_principal = "El teléfono debe tener 9 dígitos y comenzar con 9 (ej: 912345678)";
    }
    
    if (formData.telefono_secundario && !validarTelefonoPeruano(formData.telefono_secundario)) {
      errors.telefono_secundario = "El teléfono debe tener 9 dígitos y comenzar con 9 (ej: 912345678)";
    }
    
    // Validar emails
    if (formData.email_negocio && !validarEmail(formData.email_negocio)) {
      errors.email_negocio = "Por favor ingrese un correo electrónico válido";
    }
    
    // Validar WhatsApp
    if (formData.whatsapp_business && !validarWhatsApp(formData.whatsapp_business)) {
      errors.whatsapp_business = "El WhatsApp debe tener 9 dígitos y comenzar con 9 (ej: 912345678)";
    }
    
    // Validar números de Yape/Plin si están habilitados
    if (formData.acepta_yape && formData.yape_numero && !validarTelefonoPeruano(formData.yape_numero)) {
      errors.yape_numero = "El número de Yape debe tener 9 dígitos y comenzar con 9";
    }
    
    if (formData.acepta_plin && formData.plin_numero && !validarTelefonoPeruano(formData.plin_numero)) {
      errors.plin_numero = "El número de Plin debe tener 9 dígitos y comenzar con 9";
    }
    
    // Validar emails de notificaciones
    if (formData.email_nuevos_pedidos && !validarEmail(formData.email_nuevos_pedidos)) {
      errors.email_nuevos_pedidos = "Por favor ingrese un correo electrónico válido";
    }
    
    if (formData.email_stock_critico && !validarEmail(formData.email_stock_critico)) {
      errors.email_stock_critico = "Por favor ingrese un correo electrónico válido";
    }
    
    // Validar WhatsApp para pedidos listos
    if (formData.whatsapp_pedidos_listos && !validarWhatsApp(formData.whatsapp_pedidos_listos)) {
      errors.whatsapp_pedidos_listos = "El WhatsApp debe tener 9 dígitos y comenzar con 9 (ej: 912345678)";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validar antes de guardar
    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    try {
      setIsSaving(true);

      let finalLogoUrl = formData.logo_url;
      let finalYapeQrUrl = formData.yape_qr_url;
      let finalPlinQrUrl = formData.plin_qr_url;

      if (logoFile) {
        try {
          const response = await uploadImage(logoFile);
          finalLogoUrl = response.url;
        } catch (err: any) {
          toast.error("Error al subir el logo: " + err.message);
          setIsSaving(false);
          return;
        }
      }

      if (yapeQrFile) {
        try {
          const response = await uploadImage(yapeQrFile);
          finalYapeQrUrl = response.url;
        } catch (err: any) {
          toast.error("Error al subir QR de Yape");
          setIsSaving(false);
          return;
        }
      }

      if (plinQrFile) {
        try {
          const response = await uploadImage(plinQrFile);
          finalPlinQrUrl = response.url;
        } catch (err: any) {
          toast.error("Error al subir QR de Plin");
          setIsSaving(false);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        logo_url: finalLogoUrl,
        yape_qr_url: finalYapeQrUrl,
        plin_qr_url: finalPlinQrUrl,
      };

      await updateConfig(dataToSave);
      setHasChanges(false);

      setLogoFile(null);
      setYapeQrFile(null);
      setPlinQrFile(null);

      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (yapeQrPreview && yapeQrPreview.startsWith("blob:")) {
        URL.revokeObjectURL(yapeQrPreview);
      }
      if (plinQrPreview && plinQrPreview.startsWith("blob:")) {
        URL.revokeObjectURL(plinQrPreview);
      }
    } catch (error: any) {
      toast.error("Error al guardar configuración: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "¿Estás seguro de restablecer toda la configuración a valores por defecto?"
      )
    ) {
      try {
        await resetConfig();
        setHasChanges(false);
        setFieldErrors({});
        if (logoPreview && logoPreview.startsWith("blob:")) {
          URL.revokeObjectURL(logoPreview);
        }
        setLogoPreview(null);
        setLogoFile(null);
      } catch (error: any) {
        toast.error("Error al resetear configuración: " + error.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Configuración General
            </h1>
            <p className="text-gray-600 mt-1">
              Administra todos los ajustes de tu restaurante
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reloadConfig}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshIcon className="w-4 h-4" />
              Recargar
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <ResetIcon className="w-4 h-4" />
              Restablecer
            </button>
          </div>
        </div>

        {/* Indicador de cambios */}
        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertIcon className="w-5 h-5" />
              <span className="font-medium">Hay cambios sin guardar</span>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving || isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isUploading ? "Subiendo imágenes..." : "Guardando..."}
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 font-medium text-sm whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* ========== TAB: NEGOCIO ========== */}
        {activeTab === "negocio" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información del Negocio
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre del Negocio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  value={formData.nombre_negocio || ""}
                  onChange={(e) =>
                    handleChange("nombre_negocio", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mi Restaurante"
                />
              </div>

              {/* Tipo de Negocio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negocio
                </label>
                <select
                  value={formData.tipo_negocio || "Restaurante"}
                  onChange={(e) => handleChange("tipo_negocio", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Restaurante">Restaurante</option>
                  <option value="Bar">Bar</option>
                  <option value="Cafetería">Cafetería</option>
                  <option value="Comida Rápida">Comida Rápida</option>
                  <option value="Pizzería">Pizzería</option>
                  <option value="Heladería">Heladería</option>
                </select>
              </div>

              {/* RUC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUC
                </label>
                <input
                  type="text"
                  value={formData.ruc || ""}
                  onChange={(e) => handleChange("ruc", e.target.value)}
                  maxLength={11}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.ruc ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="20123456789"
                  onInput={(e) => {
                    // Solo permite números
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 11);
                  }}
                />
                {fieldErrors.ruc && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.ruc}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">11 dígitos numéricos</p>
              </div>

              {/* Teléfono Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono Principal
                </label>
                <input
                  type="text"
                  value={formData.telefono_principal || ""}
                  onChange={(e) =>
                    handleChange("telefono_principal", e.target.value)
                  }
                  maxLength={9}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.telefono_principal ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="912345678"
                  onInput={(e) => {
                    // Solo permite números
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 9);
                  }}
                />
                {fieldErrors.telefono_principal && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.telefono_principal}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">9 dígitos, comienza con 9</p>
              </div>

              {/* Teléfono Secundario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono Secundario (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.telefono_secundario || ""}
                  onChange={(e) =>
                    handleChange("telefono_secundario", e.target.value)
                  }
                  maxLength={9}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.telefono_secundario ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="912345678"
                  onInput={(e) => {
                    // Solo permite números
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 9);
                  }}
                />
                {fieldErrors.telefono_secundario && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.telefono_secundario}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">9 dígitos, comienza con 9</p>
              </div>

              {/* Email del Negocio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Negocio
                </label>
                <input
                  type="email"
                  value={formData.email_negocio || ""}
                  onChange={(e) =>
                    handleChange("email_negocio", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.email_negocio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="contacto@mirestaurante.com"
                />
                {fieldErrors.email_negocio && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email_negocio}</p>
                )}
              </div>
            </div>

            {/* Dirección - Campo completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Completa
              </label>
              <textarea
                value={formData.direccion || ""}
                onChange={(e) => handleChange("direccion", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Av. Principal 123, Distrito, Ciudad"
              />
            </div>

            {/* Eslogan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eslogan
              </label>
              <input
                type="text"
                value={formData.eslogan || ""}
                onChange={(e) => handleChange("eslogan", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="El mejor sabor de la ciudad"
              />
            </div>

            {/* Redes Sociales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Business
                </label>
                <input
                  type="text"
                  value={formData.whatsapp_business || ""}
                  onChange={(e) =>
                    handleChange("whatsapp_business", e.target.value)
                  }
                  maxLength={9}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.whatsapp_business ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="912345678"
                  onInput={(e) => {
                    // Solo permite números
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 9);
                  }}
                />
                {fieldErrors.whatsapp_business && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.whatsapp_business}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">9 dígitos, comienza con 9</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.facebook_url || ""}
                  onChange={(e) => handleChange("facebook_url", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://facebook.com/mirestaurante"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.instagram_url || ""}
                  onChange={(e) =>
                    handleChange("instagram_url", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://instagram.com/mirestaurante"
                />
              </div>

              {/* Logo del Negocio */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo del Negocio
                </label>

                {/* Vista previa del logo */}
                {(logoPreview || formData.logo_url) && (
                  <div className="mb-4 relative inline-block">
                    <img
                      src={logoPreview || formData.logo_url}
                      alt="Logo"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage("logo")}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Botón para subir logo */}
                {!(logoPreview || formData.logo_url) && (
                  <div className="mt-2">
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Subir Logo
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "logo")}
                      className="hidden"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG hasta 10MB. Recomendado: 512x512px
                    </p>
                  </div>
                )}

                {/* Opción manual (URL) */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    O ingresa una URL directamente:
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url || ""}
                    onChange={(e) => handleChange("logo_url", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario de Apertura
                </label>
                <input
                  type="time"
                  value={formData.horario_apertura || "08:00"}
                  onChange={(e) =>
                    handleChange("horario_apertura", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario de Cierre
                </label>
                <input
                  type="time"
                  value={formData.horario_cierre || "22:00"}
                  onChange={(e) =>
                    handleChange("horario_cierre", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB: PAGOS ========== */}
        {activeTab === "pagos" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Métodos de Pago
            </h2>

            {/* Efectivo */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.acepta_efectivo || false}
                onChange={(e) =>
                  handleChange("acepta_efectivo", e.target.checked)
                }
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Efectivo
                </label>
                <p className="text-sm text-gray-600">
                  Aceptar pagos en efectivo
                </p>
              </div>
            </div>

            {/* Tarjeta */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.acepta_tarjeta || false}
                onChange={(e) =>
                  handleChange("acepta_tarjeta", e.target.checked)
                }
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Tarjeta de Crédito/Débito
                </label>
                <p className="text-sm text-gray-600">
                  Aceptar pagos con tarjeta
                </p>
              </div>
            </div>

            {/* Yape - CON SUBIDA DE QR */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.acepta_yape || false}
                  onChange={(e) =>
                    handleChange("acepta_yape", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-900">
                    Yape
                  </label>
                  <p className="text-sm text-gray-600">
                    Aceptar pagos por Yape
                  </p>
                </div>
              </div>

              {formData.acepta_yape && (
                <div className="ml-7 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Yape
                    </label>
                    <input
                      type="text"
                      value={formData.yape_numero || ""}
                      onChange={(e) =>
                        handleChange("yape_numero", e.target.value)
                      }
                      maxLength={9}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.yape_numero ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="912345678"
                      onInput={(e) => {
                        // Solo permite números
                        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 9);
                      }}
                    />
                    {fieldErrors.yape_numero && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.yape_numero}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">9 dígitos, comienza con 9</p>
                  </div>

                  {/* QR de Yape */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR de Yape
                    </label>

                    {yapeQrPreview && (
                      <div className="mb-4 relative inline-block">
                        <img
                          src={yapeQrPreview}
                          alt="QR Yape"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage("yape")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}

                    {!yapeQrPreview && (
                      <div className="mt-2">
                        <label
                          htmlFor="yape-qr-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Subir QR de Yape
                        </label>
                        <input
                          id="yape-qr-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, "yape")}
                          className="hidden"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          PNG, JPG hasta 10MB. Recomendado: 256x256px
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        O ingresa una URL directamente:
                      </label>
                      <input
                        type="url"
                        value={formData.yape_qr_url || ""}
                        onChange={(e) =>
                          handleChange("yape_qr_url", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://ejemplo.com/yape-qr.png"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plin - CON SUBIDA DE QR */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.acepta_plin || false}
                  onChange={(e) =>
                    handleChange("acepta_plin", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-900">
                    Plin
                  </label>
                  <p className="text-sm text-gray-600">
                    Aceptar pagos por Plin
                  </p>
                </div>
              </div>

              {formData.acepta_plin && (
                <div className="ml-7 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Plin
                    </label>
                    <input
                      type="text"
                      value={formData.plin_numero || ""}
                      onChange={(e) =>
                        handleChange("plin_numero", e.target.value)
                      }
                      maxLength={9}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.plin_numero ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="912345678"
                      onInput={(e) => {
                        // Solo permite números
                        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 9);
                      }}
                    />
                    {fieldErrors.plin_numero && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.plin_numero}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">9 dígitos, comienza con 9</p>
                  </div>

                  {/* QR de Plin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR de Plin
                    </label>

                    {plinQrPreview && (
                      <div className="mb-4 relative inline-block">
                        <img
                          src={plinQrPreview}
                          alt="QR Plin"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage("plin")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}

                    {!plinQrPreview && (
                      <div className="mt-2">
                        <label
                          htmlFor="plin-qr-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Subir QR de Plin
                        </label>
                        <input
                          id="plin-qr-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, "plin")}
                          className="hidden"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          PNG, JPG hasta 10MB. Recomendado: 256x256px
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        O ingresa una URL directamente:
                      </label>
                      <input
                        type="url"
                        value={formData.plin_qr_url || ""}
                        onChange={(e) =>
                          handleChange("plin_qr_url", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://ejemplo.com/plin-qr.png"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transferencia Bancaria */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.acepta_transferencia || false}
                  onChange={(e) =>
                    handleChange("acepta_transferencia", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-900">
                    Transferencia Bancaria
                  </label>
                  <p className="text-sm text-gray-600">
                    Aceptar pagos por transferencia
                  </p>
                </div>
              </div>

              {formData.acepta_transferencia && (
                <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banco
                    </label>
                    <input
                      type="text"
                      value={formData.banco_nombre || ""}
                      onChange={(e) =>
                        handleChange("banco_nombre", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="BCP, BBVA, Interbank..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Cuenta
                    </label>
                    <input
                      type="text"
                      value={formData.banco_cuenta || ""}
                      onChange={(e) =>
                        handleChange("banco_cuenta", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="191-1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CCI
                    </label>
                    <input
                      type="text"
                      value={formData.banco_cci || ""}
                      onChange={(e) =>
                        handleChange("banco_cci", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="00219100123456789012"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titular de la Cuenta
                    </label>
                    <input
                      type="text"
                      value={formData.banco_titular || ""}
                      onChange={(e) =>
                        handleChange("banco_titular", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre del titular"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== TAB: TICKETS ========== */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tickets y Comprobantes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formato de Ticket */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato de Ticket
                </label>
                <select
                  value={formData.ticket_formato || "80mm"}
                  onChange={(e) =>
                    handleChange("ticket_formato", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="58mm">58mm (Pequeño)</option>
                  <option value="80mm">80mm (Estándar)</option>
                </select>
              </div>

              {/* Número de Copias */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Copias
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.ticket_copias || 1}
                  onChange={(e) =>
                    handleChange("ticket_copias", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Mensaje en Pie de Ticket */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje en Pie de Ticket
              </label>
              <textarea
                value={formData.ticket_pie_mensaje || ""}
                onChange={(e) =>
                  handleChange("ticket_pie_mensaje", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="¡Gracias por su visita! Vuelva pronto."
              />
            </div>

            {/* Opciones de Ticket */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.ticket_mostrar_logo || false}
                  onChange={(e) =>
                    handleChange("ticket_mostrar_logo", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-900">
                  Mostrar logo en el ticket
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.ticket_incluir_qr || false}
                  onChange={(e) =>
                    handleChange("ticket_incluir_qr", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-900">
                  Incluir código QR en el ticket
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.ticket_mostrar_metodo || false}
                  onChange={(e) =>
                    handleChange("ticket_mostrar_metodo", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-900">
                  Mostrar método de pago en el ticket
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB: OPERACIONES (SIMPLIFICADO) ========== */}
        {activeTab === "operaciones" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configuración de Operaciones
            </h2>

            {/* Tiempo de Preparación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de Preparación Promedio (minutos)
              </label>
              <input
                type="number"
                min="5"
                max="240"
                value={formData.tiempo_preparacion || 30}
                onChange={(e) =>
                  handleChange("tiempo_preparacion", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Entre 5 y 240 minutos
              </p>
            </div>

            {/* Alertar Agotados */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                checked={formData.alertar_agotados || false}
                onChange={(e) =>
                  handleChange("alertar_agotados", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Alertar cuando productos estén agotados
                </label>
                <p className="text-sm text-gray-600">
                  Notificar al equipo cuando un producto se agote en el inventario
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB: WEB ========== */}
        {activeTab === "web" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pedidos Web y Delivery
            </h2>

            {/* Activar Pedidos Online */}
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                checked={formData.pedidos_online_activos || false}
                onChange={(e) =>
                  handleChange("pedidos_online_activos", e.target.checked)
                }
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Activar Pedidos Online
                </label>
                <p className="text-sm text-gray-600">
                  Permitir que los clientes hagan pedidos desde la web
                </p>
              </div>
            </div>

            {formData.pedidos_online_activos && (
              <>
                {/* Costos y Montos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo de Delivery (S/)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.costo_delivery || 0}
                      onChange={(e) =>
                        handleChange(
                          "costo_delivery",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Mínimo de Pedido (S/)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.monto_minimo_pedido || 0}
                      onChange={(e) =>
                        handleChange(
                          "monto_minimo_pedido",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de Preparación Web (minutos)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="240"
                      value={formData.tiempo_prep_web || 30}
                      onChange={(e) =>
                        handleChange(
                          "tiempo_prep_web",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Horarios de Pedidos Web */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horario Inicio Pedidos Web
                    </label>
                    <input
                      type="time"
                      value={formData.pedidos_web_inicio || "08:00"}
                      onChange={(e) =>
                        handleChange("pedidos_web_inicio", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horario Fin Pedidos Web
                    </label>
                    <input
                      type="time"
                      value={formData.pedidos_web_fin || "22:00"}
                      onChange={(e) =>
                        handleChange("pedidos_web_fin", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Mensaje de Bienvenida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje de Bienvenida en Web
                  </label>
                  <textarea
                    value={formData.mensaje_bienvenida_web || ""}
                    onChange={(e) =>
                      handleChange("mensaje_bienvenida_web", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="¡Bienvenido! Haz tu pedido y lo preparamos para ti."
                  />
                </div>

                {/* Reservas */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Activar Reservas
                      </label>
                      <p className="text-sm text-gray-600">
                        Permitir reservas de mesas desde la web
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.reservas_activas || false}
                      onChange={(e) =>
                        handleChange("reservas_activas", e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  {formData.reservas_activas && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Días de Anticipación para Reservas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.dias_limite_reserva || 7}
                        onChange={(e) =>
                          handleChange(
                            "dias_limite_reserva",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Máximo 30 días de anticipación
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ========== TAB: INVENTARIO (SIMPLIFICADO) ========== */}
        {activeTab === "inventario" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configuración de Inventario
            </h2>

            {/* Alertas de Stock */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Alertas de Stock Bajo
                  </label>
                  <p className="text-sm text-gray-600">
                    Recibir alertas cuando el stock esté bajo
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.alertas_stock_bajo || false}
                  onChange={(e) =>
                    handleChange("alertas_stock_bajo", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {formData.alertas_stock_bajo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Alerta de Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nivel_alerta_stock || 10}
                    onChange={(e) =>
                      handleChange(
                        "nivel_alerta_stock",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cantidad mínima antes de alertar
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== TAB: CAJA (SIMPLIFICADO) ========== */}
        {activeTab === "caja" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configuración de Caja
            </h2>

            {/* Fondo Inicial de Caja */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fondo Inicial de Caja (S/)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.fondo_caja_inicial || 100}
                onChange={(e) =>
                  handleChange("fondo_caja_inicial", parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Monto con el que se abre la caja cada día
              </p>
            </div>

            {/* Alertas de Diferencia */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Alertas de Diferencia en Cierre
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diferencia en Monto (S/)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.alerta_diferencia_monto || 50}
                    onChange={(e) =>
                      handleChange(
                        "alerta_diferencia_monto",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alertar si la diferencia supera este monto
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diferencia en Porcentaje (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.alerta_diferencia_pct || 5}
                    onChange={(e) =>
                      handleChange(
                        "alerta_diferencia_pct",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alertar si la diferencia supera este %
                  </p>
                </div>
              </div>
            </div>

            {/* Requerir Observaciones */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                checked={formData.requiere_obs_cierre || false}
                onChange={(e) =>
                  handleChange("requiere_obs_cierre", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Requerir observaciones al cerrar caja
                </label>
                <p className="text-sm text-gray-600">
                  Obligar al usuario a agregar observaciones al finalizar el turno de caja
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB: NOTIFICACIONES ========== */}
        {activeTab === "notificaciones" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Notificaciones
            </h2>

            {/* Email para Nuevos Pedidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email para Notificaciones de Nuevos Pedidos
              </label>
              <input
                type="email"
                value={formData.email_nuevos_pedidos || ""}
                onChange={(e) =>
                  handleChange("email_nuevos_pedidos", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors.email_nuevos_pedidos ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="admin@mirestaurante.com"
              />
              {fieldErrors.email_nuevos_pedidos && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email_nuevos_pedidos}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enviar notificación cuando llegue un nuevo pedido web
              </p>
            </div>

            {/* WhatsApp para Pedidos Listos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp para Notificar Pedidos Listos
              </label>
              <input
                type="text"
                value={formData.whatsapp_pedidos_listos || ""}
                onChange={(e) =>
                  handleChange("whatsapp_pedidos_listos", e.target.value)
                }
                maxLength={9}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors.whatsapp_pedidos_listos ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="912345678"
                onInput={(e) => {
                  // Solo permite números
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 9);
                }}
              />
              {fieldErrors.whatsapp_pedidos_listos && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.whatsapp_pedidos_listos}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Número de WhatsApp para notificar cuando los pedidos estén
                listos
              </p>
            </div>

            {/* Alertas de Stock Crítico */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Alertas de Stock Crítico
                  </label>
                  <p className="text-sm text-gray-600">
                    Recibir alertas cuando el stock esté en nivel crítico
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notif_stock_critico || false}
                  onChange={(e) =>
                    handleChange("notif_stock_critico", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {formData.notif_stock_critico && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email para Alertas de Stock
                  </label>
                  <input
                    type="email"
                    value={formData.email_stock_critico || ""}
                    onChange={(e) =>
                      handleChange("email_stock_critico", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.email_stock_critico ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="inventario@mirestaurante.com"
                  />
                  {fieldErrors.email_stock_critico && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email_stock_critico}</p>
                  )}
                </div>
              )}
            </div>

            {/* Resumen Diario */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Resumen Diario Automático
                  </label>
                  <p className="text-sm text-gray-600">
                    Enviar un resumen de ventas al final del día
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.resumen_diario_activo || false}
                  onChange={(e) =>
                    handleChange("resumen_diario_activo", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {formData.resumen_diario_activo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Envío del Resumen
                  </label>
                  <input
                    type="time"
                    value={formData.resumen_diario_hora || "20:00"}
                    onChange={(e) =>
                      handleChange("resumen_diario_hora", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPage;