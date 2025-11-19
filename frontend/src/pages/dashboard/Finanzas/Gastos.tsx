// frontend/src/pages/dashboard/finanzas/Gastos.tsx - VERSIÓN COMPLETAMENTE CORREGIDA

import React, { useState, useEffect } from "react";
import { useDashboardApi } from "../../../hooks/useDashboardApi";
import toast from "react-hot-toast";
import { type GastoOperativo, type TipoGasto } from "../../../types";

const Gastos: React.FC = () => {
  // ✅ CORREGIDO: Usar funciones de GASTOS OPERATIVOS en lugar de COMPRAS
  const { getGastosOperativos, createGastoOperativo, getTiposGasto, isLoading } = useDashboardApi();

  // ✅ CORREGIDO: Usar tipo GastoOperativo en lugar de Compra
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [tiposGasto, setTiposGasto] = useState<TipoGasto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<"all" | number>("all");

  // Form state
  const [formData, setFormData] = useState({
    tipo_gasto_id: 0,
    fecha: new Date().toISOString().slice(0, 16),
    monto: 0,
    numero_documento: "",
    descripcion: "",
    metodo_pago: "Efectivo",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ✅ CORREGIDO: Usar getGastosOperativos en lugar de getCompras
      const [gastosData, tiposData] = await Promise.all([
        getGastosOperativos(),
        getTiposGasto(),
      ]);

      // ✅ CORREGIDO: Ya no necesitamos filtrar porque getGastosOperativos solo trae gastos no inventario
      const tiposNoInventario = tiposData.filter(
        (tipo) => tipo.afecta_inventario === false && tipo.activo
      );

      setGastos(gastosData);
      setTiposGasto(tiposNoInventario);
    } catch (error: any) {
      console.error("Error cargando datos:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tipo_gasto_id === 0) {
      toast.error("Selecciona un tipo de gasto");
      return;
    }

    if (formData.monto <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    try {
      // ✅ CORREGIDO: Usar createGastoOperativo en lugar de createCompra
      await createGastoOperativo({
        tipo_gasto_id: formData.tipo_gasto_id,
        fecha: formData.fecha,
        monto: formData.monto, 
        descripcion: formData.descripcion || undefined,
        numero_documento: formData.numero_documento || undefined,
        metodo_pago: formData.metodo_pago, 
      });

      toast.success("Gasto registrado exitosamente");
      setShowModal(false);
      // Reset form
      setFormData({
        tipo_gasto_id: 0,
        fecha: new Date().toISOString().slice(0, 16),
        monto: 0,
        numero_documento: "",
        descripcion: "",
        metodo_pago: "Efectivo",
      });
      loadData();
    } catch (error: any) {
      console.error("Error creando gasto:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Filtrar gastos
  const gastosFiltrados =
    filtroTipo === "all"
      ? gastos
      : gastos.filter((g) => g.tipo_gasto_id === filtroTipo);

  // ✅ CORREGIDO: Usar g.monto en lugar de g.total
  const totalGastos = gastosFiltrados.reduce(
    (sum, g) => sum + Number(g.monto),
    0
  );

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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gastos Operativos
              </h1>
              <p className="text-gray-600 mt-1">
                Registra gastos que NO afectan el inventario (servicios,
                empleados, etc.)
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              💸 Registrar Gasto
            </button>
          </div>

          {/* Información */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="font-medium text-blue-900">
                  ¿Qué son gastos operativos?
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Son egresos que no incrementan tu inventario, como: luz, agua,
                  internet, sueldos, mantenimiento, publicidad, limpieza, etc.
                </p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-linear-to-r from-red-50 to-red-100 rounded-xl p-4">
              <p className="text-sm text-red-600 font-medium">
                Total Mes Actual
              </p>
              <p className="text-3xl font-bold text-red-900">
                S/. {totalGastos.toFixed(2)}
              </p>
            </div>
            <div className="bg-linear-to-r from-orange-50 to-orange-100 rounded-xl p-4">
              <p className="text-sm text-orange-600 font-medium">
                Cantidad de Gastos
              </p>
              <p className="text-3xl font-bold text-orange-900">
                {gastosFiltrados.length}
              </p>
            </div>
            <div className="bg-linear-to-r from-purple-50 to-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-600 font-medium">
                Promedio por Gasto
              </p>
              <p className="text-3xl font-bold text-purple-900">
                S/.{" "}
                {gastosFiltrados.length > 0
                  ? (totalGastos / gastosFiltrados.length).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroTipo("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroTipo === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos ({gastos.length})
            </button>
            {tiposGasto.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setFiltroTipo(tipo.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroTipo === tipo.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tipo.icono} {tipo.nombre} (
                {gastos.filter((g) => g.tipo_gasto_id === tipo.id).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Gastos */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          {gastosFiltrados.map((gasto) => {
            const tipoGasto = gasto.tipos_gasto;

            return (
              <div
                key={gasto.id}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="text-3xl p-3 rounded-xl"
                      style={{
                        backgroundColor: tipoGasto.color || "#EF4444",
                        opacity: 0.9,
                      }}
                    >
                      {tipoGasto.icono || "💸"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tipoGasto.nombre}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600 mt-2">
                        <p>
                          📅{" "}
                          {new Date(gasto.fecha).toLocaleDateString("es-PE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {gasto.numero_documento && (
                          <p>📄 Doc: {gasto.numero_documento}</p>
                        )}
                        {gasto.descripcion && (
                          <p className="text-gray-500">{gasto.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {/* ✅ CORREGIDO: Usar gasto.monto en lugar de gasto.total */}
                    <p className="text-3xl font-bold text-red-600">
                      - S/. {Number(gasto.monto).toFixed(2)}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      💸 Gasto Operativo
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {gastosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">💸</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay gastos registrados
            </h3>
            <p className="text-gray-500 mb-6">
              Registra tus gastos operativos para llevar control de los egresos.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Registrar Primer Gasto
            </button>
          </div>
        )}
      </div>

      {/* Modal de Registro */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Registrar Gasto
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Gasto */}
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
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Seleccionar...</option>
                  {tiposGasto.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.icono} {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Monto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto (S/.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monto || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monto: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                    min="0.01"
                  />
                </div>
              </div>

              {/* Documento y Descripción */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: F001-12345"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del gasto..."
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      tipo_gasto_id: 0,
                      fecha: new Date().toISOString().slice(0, 16),
                      monto: 0,
                      numero_documento: "",
                      descripcion: "",
                      metodo_pago: "Efectivo",
                    });
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  💸 Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gastos;