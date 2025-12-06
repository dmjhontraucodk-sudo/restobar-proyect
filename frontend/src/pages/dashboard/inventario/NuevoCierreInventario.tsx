// frontend/src/pages/dashboard/inventario/NuevoCierreInventario.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardApi } from '@shared/api/useDashboardApi';
import toast from "react-hot-toast";
import {
  type ProductoInventario,
  type CreateCierreInventarioData,
  type TipoCierre,
  type TipoDiferencia,
} from '@shared/types';

interface ProductoConteo {
  producto: ProductoInventario;
  stock_fisico: number;
  tipo_diferencia: TipoDiferencia | null;
  notas: string;
}

const NuevoCierreInventario: React.FC = () => {
  const navigate = useNavigate();
  const { getProductosInventario, createCierreInventario, isLoading } =
    useDashboardApi();

  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [productosConteo, setProductosConteo] = useState<ProductoConteo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos del cierre
  const [tipoCierre, setTipoCierre] = useState<TipoCierre>("Semanal");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Búsqueda
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    loadProductos();
    calcularFechasPorDefecto();
  }, []);

  const loadProductos = async () => {
    try {
      const data = await getProductosInventario();
      setProductos(data.filter((p) => p.activo));
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const calcularFechasPorDefecto = () => {
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    setFechaInicio(hace7Dias.toISOString().slice(0, 16));
    setFechaFin(hoy.toISOString().slice(0, 16));
  };

  const handleAgregarProducto = (producto: ProductoInventario) => {
    if (productosConteo.some((p) => p.producto.id === producto.id)) {
      toast.error("Este producto ya está en el conteo");
      return;
    }

    setProductosConteo([
      ...productosConteo,
      {
        producto,
        stock_fisico: Number(producto.stock_actual) || 0,
        tipo_diferencia: null,
        notas: "",
      },
    ]);
  };

  const handleAgregarTodos = () => {
    const nuevos = productos
      .filter((p) => !productosConteo.some((pc) => pc.producto.id === p.id))
      .map((p) => ({
        producto: p,
        stock_fisico: Number(p.stock_actual) || 0,
        tipo_diferencia: null as TipoDiferencia | null,
        notas: "",
      }));

    setProductosConteo([...productosConteo, ...nuevos]);
    toast.success(`${nuevos.length} productos agregados`);
  };

  const handleRemoverProducto = (productoId: number) => {
    setProductosConteo(
      productosConteo.filter((p) => p.producto.id !== productoId)
    );
  };

  const handleUpdateConteo = (
    productoId: number,
    field: "stock_fisico" | "tipo_diferencia" | "notas",
    value: any
  ) => {
    setProductosConteo(
      productosConteo.map((p) =>
        p.producto.id === productoId ? { ...p, [field]: value } : p
      )
    );
  };

  const calcularDiferencia = (conteo: ProductoConteo) => {
    const stockSistema = Number(conteo.producto.stock_actual) || 0;
    return conteo.stock_fisico - stockSistema;
  };

  const calcularValorDiferencia = (conteo: ProductoConteo) => {
    const diferencia = calcularDiferencia(conteo);
    const costo = Number(conteo.producto.costo_unitario) || 0;
    return diferencia * costo;
  };

  const calcularTotales = () => {
    const totalProductos = productosConteo.length;
    const totalDiferencias = productosConteo.reduce(
      (sum, c) => sum + Math.abs(calcularValorDiferencia(c)),
      0
    );
    const diferenciaPositivas = productosConteo.filter(
      (c) => calcularDiferencia(c) > 0
    ).length;
    const diferenciaNegaticas = productosConteo.filter(
      (c) => calcularDiferencia(c) < 0
    ).length;

    return {
      totalProductos,
      totalDiferencias,
      diferenciaPositivas,
      diferenciaNegaticas,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fechaInicio || !fechaFin) {
      toast.error("Debes especificar las fechas del cierre");
      return;
    }

    if (productosConteo.length === 0) {
      toast.error("Debes agregar al menos un producto al conteo");
      return;
    }

    // Validar que todos tengan tipo de diferencia si hay diferencia
    const sinTipo = productosConteo.filter(
      (c) => calcularDiferencia(c) !== 0 && !c.tipo_diferencia
    );

    if (sinTipo.length > 0) {
      toast.error(
        `${sinTipo.length} producto(s) con diferencia necesitan especificar el tipo de diferencia`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateCierreInventarioData = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tipo_cierre: tipoCierre,
        observaciones: observaciones || undefined,
        detalles: productosConteo.map((c) => ({
          producto_inventario_id: c.producto.id,
          stock_fisico: c.stock_fisico,
          tipo_diferencia: c.tipo_diferencia || undefined,
          notas: c.notas || undefined,
        })),
      };

      await createCierreInventario(data);
      toast.success("Cierre creado exitosamente");
      navigate("/dashboard/cierre-inventario");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totales = calcularTotales();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate("/dashboard/cierre-inventario")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Nuevo Cierre de Inventario
              </h1>
              <p className="text-gray-600 mt-1">
                Realiza el conteo físico de tus productos
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 max-w-7xl mx-auto">
        {/* Configuración del Cierre */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            📋 Configuración del Cierre
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cierre *
              </label>
              <select
                value={tipoCierre}
                onChange={(e) => setTipoCierre(e.target.value as TipoCierre)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Diario">📅 Diario</option>
                <option value="Semanal">📆 Semanal</option>
                <option value="Mensual">🗓️ Mensual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio *
              </label>
              <input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin *
              </label>
              <input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Notas generales sobre este cierre..."
            />
          </div>
        </div>

        {/* CONTINÚA EN PARTE 2... */}
        {/* PARTE 2 - Agregar al final de NuevoCierreInventario.tsx */}

        {/* Sección de Productos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1: Lista de Productos Disponibles */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                📦 Productos Disponibles ({productos.length})
              </h2>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="🔍 Buscar producto..."
              />

              <button
                type="button"
                onClick={handleAgregarTodos}
                className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                + Agregar Todos
              </button>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {productosFiltrados.map((producto) => {
                  const yaAgregado = productosConteo.some(
                    (p) => p.producto.id === producto.id
                  );

                  return (
                    <div
                      key={producto.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        yaAgregado
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 hover:border-blue-300 cursor-pointer"
                      }`}
                      onClick={() =>
                        !yaAgregado && handleAgregarProducto(producto)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {producto.nombre}
                          </p>
                          <p className="text-sm text-gray-600">
                            Stock: {Number(producto.stock_actual).toFixed(2)}{" "}
                            {producto.unidades_medida?.abreviatura || "un"}
                          </p>
                        </div>
                        {yaAgregado ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-blue-600 font-bold">+</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna 2 y 3: Productos en Conteo */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  📝 Productos en Conteo ({productosConteo.length})
                </h2>
                {productosConteo.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setProductosConteo([])}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    🗑️ Limpiar Todo
                  </button>
                )}
              </div>

              {productosConteo.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-6xl mb-4">📦</p>
                  <p className="text-gray-500">No hay productos en el conteo</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Selecciona productos de la lista de la izquierda
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {productosConteo.map((conteo, idx) => {
                    const diferencia = calcularDiferencia(conteo);
                    const valorDiferencia = calcularValorDiferencia(conteo);
                    const stockSistema =
                      Number(conteo.producto.stock_actual) || 0;

                    return (
                      <div
                        key={conteo.producto.id}
                        className="border-2 border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">
                              {idx + 1}. {conteo.producto.nombre}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {conteo.producto.categorias_inventario?.nombre ||
                                "Sin categoría"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoverProducto(conteo.producto.id)
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-600 font-medium">
                              Stock Sistema
                            </p>
                            <p className="text-lg font-bold text-blue-900">
                              {stockSistema.toFixed(2)}{" "}
                              {conteo.producto.unidades_medida?.abreviatura ||
                                "un"}
                            </p>
                          </div>

                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-green-600 font-medium">
                              Stock Físico
                            </p>
                            <input
                              type="number"
                              step="0.01"
                              value={conteo.stock_fisico}
                              onChange={(e) =>
                                handleUpdateConteo(
                                  conteo.producto.id,
                                  "stock_fisico",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full text-lg font-bold text-green-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                              required
                            />
                          </div>

                          <div
                            className={`rounded-lg p-3 ${
                              diferencia === 0
                                ? "bg-gray-50"
                                : diferencia > 0
                                ? "bg-green-50"
                                : "bg-red-50"
                            }`}
                          >
                            <p
                              className={`text-xs font-medium ${
                                diferencia === 0
                                  ? "text-gray-600"
                                  : diferencia > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              Diferencia
                            </p>
                            <p
                              className={`text-lg font-bold ${
                                diferencia === 0
                                  ? "text-gray-900"
                                  : diferencia > 0
                                  ? "text-green-900"
                                  : "text-red-900"
                              }`}
                            >
                              {diferencia > 0 ? "+" : ""}
                              {diferencia.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600">
                              S/. {valorDiferencia.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {diferencia !== 0 && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Tipo de Diferencia *
                              </label>
                              <select
                                value={conteo.tipo_diferencia || ""}
                                onChange={(e) =>
                                  handleUpdateConteo(
                                    conteo.producto.id,
                                    "tipo_diferencia",
                                    e.target.value || null
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                required
                              >
                                <option value="">Seleccionar...</option>
                                <option value="Venta">🛒 Venta</option>
                                <option value="Merma">
                                  🗑️ Merma/Desperdicio
                                </option>
                                <option value="Robo">🚨 Robo/Faltante</option>
                                <option value="Error">
                                  ❌ Error de Registro
                                </option>
                                <option value="Donación">🎁 Donación</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Notas
                              </label>
                              <input
                                type="text"
                                value={conteo.notas}
                                onChange={(e) =>
                                  handleUpdateConteo(
                                    conteo.producto.id,
                                    "notas",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Notas adicionales..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totales */}
            {productosConteo.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  📊 Resumen del Cierre
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">
                      Total Productos
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {totales.totalProductos}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">
                      Diferencias +
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {totales.diferenciaPositivas}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-red-700 font-medium">
                      Diferencias -
                    </p>
                    <p className="text-3xl font-bold text-red-900">
                      {totales.diferenciaNegaticas}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-orange-700 font-medium">
                      Valor Total
                    </p>
                    <p className="text-3xl font-bold text-orange-900">
                      S/. {totales.totalDiferencias.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="mt-6 flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/cierre-inventario")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting || productosConteo.length === 0}
          >
            {isSubmitting ? "Guardando..." : "💾 Guardar Cierre (Borrador)"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoCierreInventario;
