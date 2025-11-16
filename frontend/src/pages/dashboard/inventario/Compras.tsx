// src/pages/dashboard/Compras.tsx

import React, { useState, useEffect } from "react";
import { useDashboardApi } from "../../../hooks/useDashboardApi";
import toast from "react-hot-toast";
import {
  type Compra,
  type TipoGasto,
  type ProductoInventario,
  type CreateCompraData,
  type CreateCompraDetalleData,
} from "../../../types";

const Compras: React.FC = () => {
  const {
    getGastos,
    createGasto,
    receiveCompra,
    getTiposGasto,
    getProductosInventario,
    isLoading,
  } = useDashboardApi();

  const [compras, setCompras] = useState<Compra[]>([]);
  const [tiposGasto, setTiposGasto] = useState<TipoGasto[]>([]);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "pendientes" | "recibidas">(
    "all"
  );

  // Form state
  const [formData, setFormData] = useState({
    tipo_gasto_id: 0,
    fecha: new Date().toISOString().slice(0, 16), // Formato para datetime-local
    numero_documento: "",
    descripcion: "",
    items: [] as Array<{
      producto_inventario_id: number;
      cantidad: number;
      costo_unitario: number;
    }>,
  });

  // Item temporal para agregar
  const [tempItem, setTempItem] = useState({
    producto_inventario_id: 0,
    cantidad: 0,
    costo_unitario: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [comprasData, tiposData, productosData] = await Promise.all([
        getGastos(),
        getTiposGasto(),
        getProductosInventario(),
      ]);
      setCompras(comprasData);
      setTiposGasto(tiposData.filter((t) => t.activo));
      setProductos(productosData.filter((p) => p.activo));
    } catch (error: any) {
      toast.error(`Error al cargar datos: ${error.message}`);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      tipo_gasto_id: tiposGasto.find((t) => t.afecta_inventario)?.id || 0,
      fecha: new Date().toISOString().slice(0, 16),
      numero_documento: "",
      descripcion: "",
      items: [],
    });
    setTempItem({
      producto_inventario_id: 0,
      cantidad: 0,
      costo_unitario: 0,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleAddItem = () => {
    if (tempItem.producto_inventario_id === 0) {
      toast.error("Selecciona un producto");
      return;
    }
    if (tempItem.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    if (tempItem.costo_unitario <= 0) {
      toast.error("El costo debe ser mayor a 0");
      return;
    }

    // Verificar que no esté duplicado
    if (
      formData.items.some(
        (i) => i.producto_inventario_id === tempItem.producto_inventario_id
      )
    ) {
      toast.error("Este producto ya fue agregado");
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { ...tempItem }],
    });

    setTempItem({
      producto_inventario_id: 0,
      cantidad: 0,
      costo_unitario: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.cantidad * item.costo_unitario,
      0
    );
  };

  // FUNCIÓN CORREGIDA - Conversión de fecha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tipo_gasto_id === 0) {
      toast.error("Selecciona un tipo de gasto");
      return;
    }

    const tipoSeleccionado = tiposGasto.find(
      (t) => t.id === formData.tipo_gasto_id
    );

    if (tipoSeleccionado?.afecta_inventario && formData.items.length === 0) {
      toast.error("Debes agregar al menos un producto para este tipo de gasto");
      return;
    }

    setIsSubmitting(true);

    try {
      const total = tipoSeleccionado?.afecta_inventario ? calculateTotal() : 0;

      // CORRECCIÓN: Convertir fecha a formato ISO 8601 válido
      const fechaISO = new Date(formData.fecha).toISOString();

      const createData: CreateCompraData = {
        tipo_gasto_id: formData.tipo_gasto_id,
        fecha: fechaISO, // ← Usar la fecha convertida
        total: total,
        descripcion: formData.descripcion || undefined,
        numero_documento: formData.numero_documento || undefined,
        items: tipoSeleccionado?.afecta_inventario ? formData.items : undefined,
      };

      await createGasto(createData);
      toast.success("Gasto registrado exitosamente");
      await loadData();
      handleCloseModal();
    } catch (error: any) {
      console.error("Error detallado:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveCompra = async (compraId: number) => {
    const confirmacion = window.confirm(
      "¿Estás seguro de recibir esta compra? El stock se incrementará automáticamente."
    );

    if (!confirmacion) return;

    try {
      await receiveCompra(compraId);
      toast.success("Compra recibida. Stock actualizado exitosamente");
      await loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // Filtrar compras
  const comprasFiltradas = compras.filter((c) => {
    if (viewMode === "pendientes") return c.estado_compra === "Pendiente";
    if (viewMode === "recibidas") return c.estado_compra === "Recibido";
    return true;
  });

  const comprasPendientes = compras.filter(
    (c) => c.estado_compra === "Pendiente" && c.tipos_gasto.afecta_inventario
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Cargando compras...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Compras y Gastos
              </h1>
              <p className="text-gray-600 mt-1">
                Registra y gestiona los egresos de tu negocio
              </p>
            </div>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              + Nuevo Gasto
            </button>
          </div>

          {/* Alertas */}
          {comprasPendientes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-medium text-amber-900">
                    {comprasPendientes.length} compra
                    {comprasPendientes.length > 1 ? "s" : ""} pendiente
                    {comprasPendientes.length > 1 ? "s" : ""} de recibir
                  </p>
                  <p className="text-sm text-amber-700">
                    Recibe las compras para actualizar el stock
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todas ({compras.length})
            </button>
            <button
              onClick={() => setViewMode("pendientes")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "pendientes"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⏳ Pendientes ({comprasPendientes.length})
            </button>
            <button
              onClick={() => setViewMode("recibidas")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "recibidas"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✅ Recibidas
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Compras */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          {comprasFiltradas.map((compra) => {
            const tipoGasto = compra.tipos_gasto;
            const afectaInventario = tipoGasto.afecta_inventario;
            const isPendiente = compra.estado_compra === "Pendiente";

            return (
              <div
                key={compra.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="text-3xl p-3 rounded-xl"
                      style={{
                        backgroundColor: tipoGasto.color || "#10B981",
                        opacity: 0.9,
                      }}
                    >
                      {tipoGasto.icono || "💰"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {tipoGasto.nombre}
                        </h3>
                        {afectaInventario && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            📦 Inventario
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          📅{" "}
                          {new Date(compra.fecha).toLocaleDateString("es-PE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {compra.numero_documento && (
                          <p>📄 Doc: {compra.numero_documento}</p>
                        )}
                        {compra.descripcion && (
                          <p className="text-gray-500">{compra.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      S/. {Number(compra.total).toFixed(2)}
                    </p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        isPendiente
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isPendiente ? "⏳ Pendiente" : "✅ Recibido"}
                    </span>
                  </div>
                </div>

                {/* Detalles de la compra */}
                {compra.compras_detalles &&
                  compra.compras_detalles.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Productos ({compra.compras_detalles.length})
                      </p>
                      <div className="space-y-2">
                        {compra.compras_detalles.map((detalle, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">•</span>
                              <span className="font-medium text-gray-900">
                                {detalle.productos_inventario.nombre}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              {Number(detalle.cantidad).toFixed(2)}{" "}
                              {detalle.productos_inventario.unidades_medida
                                ?.abreviatura || "un"}{" "}
                              × S/. {Number(detalle.costo_unitario).toFixed(2)}
                              {" = "}
                              <span className="font-medium text-gray-900">
                                S/.{" "}
                                {(
                                  Number(detalle.cantidad) *
                                  Number(detalle.costo_unitario)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Botón de recibir */}
                {isPendiente && afectaInventario && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleReceiveCompra(compra.id)}
                      className="w-full bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors font-medium"
                    >
                      ✅ Recibir Compra (Incrementar Stock)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {comprasFiltradas.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">🛒</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay{" "}
              {viewMode === "pendientes"
                ? "compras pendientes"
                : viewMode === "recibidas"
                ? "compras recibidas"
                : "gastos registrados"}
            </h3>
            <p className="text-gray-500 mb-6">
              {viewMode === "all"
                ? "Registra tu primer gasto para comenzar."
                : "Cambia el filtro para ver otros gastos."}
            </p>
            {viewMode === "all" && (
              <button
                onClick={handleOpenModal}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Registrar Primer Gasto
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL - Registrar Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Header fijo */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                Registrar Gasto
              </h2>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo de Gasto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Gasto *
                    </label>
                    <select
                      value={formData.tipo_gasto_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tipo_gasto_id: parseInt(e.target.value),
                          items: [],
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value={0}>Seleccionar...</option>
                      {tiposGasto.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.icono} {tipo.nombre}{" "}
                          {tipo.afecta_inventario && "(Afecta stock)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha y Hora *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fecha}
                      onChange={(e) =>
                        setFormData({ ...formData, fecha: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Número de Documento y Descripción */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      N° Documento
                    </label>
                    <input
                      type="text"
                      value={formData.numero_documento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numero_documento: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: F001-12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={formData.descripcion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descripcion: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción del gasto..."
                    />
                  </div>
                </div>

                {/* Items - Solo si afecta inventario */}
                {formData.tipo_gasto_id > 0 &&
                  tiposGasto.find((t) => t.id === formData.tipo_gasto_id)
                    ?.afecta_inventario && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Productos de la Compra
                      </h3>

                      {/* Agregar item - VERSIÓN CORREGIDA */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          {/* Producto */}
                          <div className="md:col-span-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Producto
                            </label>
                            <select
                              value={tempItem.producto_inventario_id}
                              onChange={(e) =>
                                setTempItem({
                                  ...tempItem,
                                  producto_inventario_id: parseInt(
                                    e.target.value
                                  ),
                                })
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value={0}>Seleccionar producto...</option>
                              {productos.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nombre} (
                                  {p.unidades_medida?.abreviatura || "un"})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Cantidad */}
                          <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cantidad
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={tempItem.cantidad || ""}
                              onChange={(e) =>
                                setTempItem({
                                  ...tempItem,
                                  cantidad: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                              min="0"
                            />
                          </div>

                          {/* Costo Unitario */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Costo S/.
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={tempItem.costo_unitario || ""}
                              onChange={(e) =>
                                setTempItem({
                                  ...tempItem,
                                  costo_unitario:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                              min="0"
                            />
                          </div>

                          {/* Botón Agregar */}
                          <div className="md:col-span-2">
                            <button
                              type="button"
                              onClick={handleAddItem}
                              className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={
                                !tempItem.producto_inventario_id ||
                                !tempItem.cantidad ||
                                !tempItem.costo_unitario
                              }
                            >
                              <span>+</span>
                              <span>Agregar</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lista de items */}
                      {formData.items.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {formData.items.map((item, idx) => {
                            const producto = productos.find(
                              (p) => p.id === item.producto_inventario_id
                            );
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {producto?.nombre}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {item.cantidad}{" "}
                                    {producto?.unidades_medida?.abreviatura ||
                                      "un"}{" "}
                                    × S/. {item.costo_unitario.toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="font-bold text-gray-900">
                                    S/.{" "}
                                    {(
                                      item.cantidad * item.costo_unitario
                                    ).toFixed(2)}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="text-red-600 hover:text-red-700 p-1"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Total */}
                      {formData.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                          <p className="text-lg font-semibold text-gray-900">
                            Total:
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            S/. {calculateTotal().toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
              </form>
            </div>

            {/* Botones fijos en la parte inferior */}
            <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
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
                  type="button" // Cambiado a type="button" para evitar conflicto con el form
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registrando..." : "Registrar Gasto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;