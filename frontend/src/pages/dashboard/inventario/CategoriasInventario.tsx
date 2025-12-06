// src/pages/dashboard/CategoriasInventario.tsx - VERSIÓN COMPACTA

import React, { useState, useEffect } from "react";
import { useDashboardApi } from '@shared/api/useDashboardApi';
import toast from "react-hot-toast";
import {
  type CategoriaInventario,
  type CreateCategoriaInventarioData,
  type UpdateCategoriaInventarioData,
} from '@shared/types';

const CategoriasInventario: React.FC = () => {
  const {
    getCategoriasInventario,
    createCategoriaInventario,
    updateCategoriaInventario,
    isLoading,
  } = useDashboardApi();

  const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] =
    useState<CategoriaInventario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    color: "#10B981",
    icono: "📦",
    orden: 0,
  });

  const iconosDisponibles = [
    "🍅", "🥬", "🥕", "🧅", "🥔",
    "🍺", "🍻", "🍷", "🥃", "🍹", "🥤",
    "🍽️", "🥄", "🍴",
    "🧼", "🧽", "🧴", "🧹",
    "📦", "📋", "💼", "🏪", "🎯",
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
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const data = await getCategoriasInventario();
      setCategorias(data);
    } catch (error: any) {
      toast.error(`Error al cargar categorías: ${error.message}`);
    }
  };

  const handleOpenModal = (categoria?: CategoriaInventario) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || "",
        color: categoria.color || "#10B981",
        icono: categoria.icono || "📦",
        orden: categoria.orden || 0,
      });
    } else {
      setEditingCategoria(null);
      setFormData({
        nombre: "",
        descripcion: "",
        color: "#10B981",
        icono: "📦",
        orden: categorias.length + 1,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategoria(null);
    setFormData({
      nombre: "",
      descripcion: "",
      color: "#10B981",
      icono: "📦",
      orden: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategoria) {
        const updateData: UpdateCategoriaInventarioData = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          color: formData.color,
          icono: formData.icono,
          orden: formData.orden,
        };
        await updateCategoriaInventario(editingCategoria.id, updateData);
        toast.success("Categoría actualizada exitosamente");
      } else {
        const createData: CreateCategoriaInventarioData = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          color: formData.color,
          icono: formData.icono,
          orden: formData.orden,
        };
        await createCategoriaInventario(createData);
        toast.success("Categoría creada exitosamente");
      }

      await loadCategorias();
      handleCloseModal();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActiva = async (categoria: CategoriaInventario) => {
    try {
      await updateCategoriaInventario(categoria.id, {
        activa: !categoria.activa,
      });
      toast.success(
        `Categoría ${categoria.activa ? "desactivada" : "activada"}`
      );
      await loadCategorias();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* Botón superior */}
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
          >
            + Nueva Categoría
          </button>
        </div>

        {/* Grid de categorías - compacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all ${
                categoria.activa
                  ? "border-gray-200"
                  : "border-gray-300 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="text-3xl"
                    style={{
                      backgroundColor: categoria.color || "#10B981",
                      padding: "6px",
                      borderRadius: "10px",
                      opacity: 0.9,
                    }}
                  >
                    {categoria.icono || "📦"}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {categoria.nombre}
                    </h3>
                    {categoria.descripcion && (
                      <p className="text-xs text-gray-500">
                        {categoria.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Orden: {categoria.orden}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActiva(categoria)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      categoria.activa
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {categoria.activa ? "Activa" : "Inactiva"}
                  </button>

                  <button
                    onClick={() => handleOpenModal(categoria)}
                    className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categorias.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
            <div className="text-gray-400 mb-3">
              <span className="text-5xl">📦</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay categorías de inventario
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              Crea tu primera categoría para organizar tus productos de inventario.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Crear Primera Categoría
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategoria ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Ingredientes, Bebidas..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción opcional..."
                    rows={2}
                  />
                </div>

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
                        className={`text-lg p-2 rounded-lg border-2 transition-all ${
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Guardando..."
                    : editingCategoria
                    ? "Actualizar"
                    : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriasInventario;