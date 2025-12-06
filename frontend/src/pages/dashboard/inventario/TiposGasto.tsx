// src/pages/dashboard/TiposGasto.tsx

import React, { useState, useEffect } from "react";
import { useDashboardApi } from '@shared/api/useDashboardApi';
import toast from "react-hot-toast";
import { type TipoGasto, type CreateTipoGastoData } from '@shared/types';

const TiposGasto: React.FC = () => {
  const { getTiposGasto, createTipoGasto, isLoading } = useDashboardApi();

  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    afecta_inventario: false,
    color: "#10B981",
    icono: "💰",
    orden: 0,
  });

  const iconosDisponibles = [
    "📦",
    "💰",
    "⚡",
    "👥",
    "🏪", // Generales
    "🛒",
    "🍺",
    "🍴",
    "🥤", // Compras
    "💡",
    "💧",
    "📡",
    "🔌", // Servicios
    "👔",
    "💼",
    "📊",
    "📈", // Empleados/Admin
    "📢",
    "🎯",
    "🎨",
    "✨", // Marketing
  ];

  const coloresDisponibles = [
    { nombre: "Verde", valor: "#10B981" },
    { nombre: "Azul", valor: "#3B82F6" },
    { nombre: "Naranja", valor: "#F59E0B" },
    { nombre: "Morado", valor: "#8B5CF6" },
    { nombre: "Rojo", valor: "#EF4444" },
    { nombre: "Rosa", valor: "#EC4899" },
    { nombre: "Gris", valor: "#6B7280" },
    { nombre: "Cyan", valor: "#06B6D4" },
  ];

  useEffect(() => {
    loadTipos();
  }, []);

  const loadTipos = async () => {
    try {
      const data = await getTiposGasto();
      setTipos(data);
    } catch (error: any) {
      toast.error(`Error al cargar tipos de gasto: ${error.message}`);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      afecta_inventario: false,
      color: "#10B981",
      icono: "💰",
      orden: tipos.length + 1,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      const createData: CreateTipoGastoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        afecta_inventario: formData.afecta_inventario,
        color: formData.color,
        icono: formData.icono,
        orden: formData.orden,
      };

      await createTipoGasto(createData);
      toast.success("Tipo de gasto creado exitosamente");
      await loadTipos();
      handleCloseModal();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Cargando tipos de gasto...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tipos de Gasto</h1>
            <p className="text-gray-600 mt-1">
              Categoriza tus gastos del negocio
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            + Nuevo Tipo
          </button>
        </div>
      </div>

      {/* Información */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="font-medium text-blue-900">
                ¿Qué son los tipos de gasto?
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Los tipos de gasto te permiten categorizar todos los egresos de
                tu negocio. Si marcas "Afecta Inventario", el sistema
                incrementará el stock automáticamente al recibir la compra.
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Tipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tipos.map((tipo) => (
            <div
              key={tipo.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="text-4xl p-2 rounded-xl"
                    style={{
                      backgroundColor: tipo.color || "#10B981",
                      opacity: 0.9,
                    }}
                  >
                    {tipo.icono || "💰"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tipo.nombre}
                    </h3>
                    {tipo.descripcion && (
                      <p className="text-sm text-gray-500 mt-1">
                        {tipo.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {tipo.afecta_inventario && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                      📦 Afecta Inventario
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Orden: {tipo.orden}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tipo.activo
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tipo.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tipos.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">💰</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay tipos de gasto configurados
            </h3>
            <p className="text-gray-500 mb-6">
              Crea tipos de gasto para categorizar los egresos de tu negocio.
            </p>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Crear Primer Tipo
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Header fijo */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Nuevo Tipo de Gasto
              </h2>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Compras, Servicios, Empleados..."
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción opcional..."
                    rows={2}
                  />
                </div>

                {/* Afecta Inventario */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.afecta_inventario}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          afecta_inventario: e.target.checked,
                        })
                      }
                      className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        Afecta Inventario
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Marca esta opción si este tipo de gasto incrementará el
                        stock de productos (como compras de ingredientes,
                        bebidas, etc.)
                      </p>
                    </div>
                  </label>
                </div>

                {/* Icono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ícono
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {iconosDisponibles.map((icono) => (
                      <button
                        key={icono}
                        type="button"
                        onClick={() => setFormData({ ...formData, icono })}
                        className={`text-xl p-2 rounded-lg border-2 transition-all ${
                          formData.icono === icono
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {icono}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {coloresDisponibles.map((color) => (
                      <button
                        key={color.valor}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, color: color.valor })
                        }
                        className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center justify-center ${
                          formData.color === color.valor
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{ backgroundColor: color.valor }}
                      >
                        <span className="text-white font-medium text-xs">
                          {color.nombre}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={formData.orden}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        orden: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </form>
            </div>

            {/* Botones fijos en la parte inferior */}
            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creando..." : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TiposGasto;
