// frontend/src/pages/dashboard/inventario/CierreInventario.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardApi } from '../../../hooks/useDashboardApi';
import toast from 'react-hot-toast';
import { type CierreInventario, type GetCierresFilters } from '../../../types';

const CierresInventario: React.FC = () => {
  const navigate = useNavigate();
  const { getCierresInventario, finalizarCierre, isLoading } = useDashboardApi();

  const [cierres, setCierres] = useState<CierreInventario[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'Borrador' | 'Finalizado'>('all');
  const [filtroTipo, setFiltroTipo] = useState<'all' | 'Diario' | 'Semanal' | 'Mensual'>('all');

  useEffect(() => {
    loadCierres();
  }, [filtroEstado, filtroTipo]);

  const loadCierres = async () => {
    try {
      const filters: GetCierresFilters = {};
      if (filtroEstado !== 'all') filters.estado = filtroEstado;
      if (filtroTipo !== 'all') filters.tipo_cierre = filtroTipo;

      const data = await getCierresInventario(filters);
      setCierres(data);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleFinalizarCierre = async (id: number) => {
    const confirmacion = window.confirm(
      '⚠️ ¿Estás seguro de finalizar este cierre?\n\n' +
      'Esta acción:\n' +
      '• Actualizará el stock de todos los productos\n' +
      '• NO se puede deshacer\n' +
      '• El cierre quedará bloqueado'
    );

    if (!confirmacion) return;

    try {
      await finalizarCierre(id);
      toast.success('¡Cierre finalizado! Stock actualizado correctamente');
      await loadCierres();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const cierresBorrador = cierres.filter(c => c.estado === 'Borrador');
  const cierresFinalizados = cierres.filter(c => c.estado === 'Finalizado');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Cargando cierres...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion de Inventario</h1>
              <p className="text-gray-600 mt-1">Gestiona los conteos físicos y ajusta el stock</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/cierre-inventario/nuevo')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              + Nuevo Cierre
            </button>
          </div>

          {/* Alertas */}
          {cierresBorrador.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-medium text-amber-900">
                    {cierresBorrador.length} cierre{cierresBorrador.length > 1 ? 's' : ''} en borrador
                  </p>
                  <p className="text-sm text-amber-700">
                    Finalízalos para actualizar el stock del sistema
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFiltroEstado('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({cierres.length})
              </button>
              <button
                onClick={() => setFiltroEstado('Borrador')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'Borrador'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⏳ Borradores ({cierresBorrador.length})
              </button>
              <button
                onClick={() => setFiltroEstado('Finalizado')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'Finalizado'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✅ Finalizados ({cierresFinalizados.length})
              </button>
            </div>

            <div className="ml-auto flex gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="Diario">Diario</option>
                <option value="Semanal">Semanal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Cierres */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          {cierres.map((cierre) => {
            const esBorrador = cierre.estado === 'Borrador';
            const totalProductos = cierre.detalles?.length || 0;

            return (
              <div
                key={cierre.id}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">
                        {cierre.tipo_cierre === 'Diario' && '📅'}
                        {cierre.tipo_cierre === 'Semanal' && '📆'}
                        {cierre.tipo_cierre === 'Mensual' && '🗓️'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Cierre {cierre.tipo_cierre} #{cierre.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Del {new Date(cierre.fecha_inicio).toLocaleDateString('es-PE')} al{' '}
                          {new Date(cierre.fecha_fin).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-600 font-medium">Productos</p>
                        <p className="text-2xl font-bold text-blue-900">{totalProductos}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-sm text-orange-600 font-medium">Diferencias</p>
                        <p className="text-2xl font-bold text-orange-900">
                          S/. {Number(cierre.total_diferencias).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm text-green-600 font-medium">Realizado por</p>
                        <p className="text-sm font-bold text-green-900 truncate">
                          {cierre.empleados?.nombre || cierre.empleados?.email}
                        </p>
                      </div>
                    </div>

                    {cierre.observaciones && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-600">💬 {cierre.observaciones}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col items-end gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                        esBorrador
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {esBorrador ? '⏳ Borrador' : '✅ Finalizado'}
                    </span>

                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => navigate(`/dashboard/cierre-inventario/${cierre.id}`)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm whitespace-nowrap"
                      >
                        👁️ Ver Detalle
                      </button>

                      {esBorrador && (
                        <button
                          onClick={() => handleFinalizarCierre(cierre.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap"
                        >
                          ✅ Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {cierres.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">📋</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay cierres de inventario
            </h3>
            <p className="text-gray-500 mb-6">
              Crea tu primer cierre para hacer un conteo físico del inventario
            </p>
            <button
              onClick={() => navigate('/dashboard/cierre-inventario/nuevo')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Crear Primer Cierre
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CierresInventario;