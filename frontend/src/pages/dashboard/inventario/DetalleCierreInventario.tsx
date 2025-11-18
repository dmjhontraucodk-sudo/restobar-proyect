// frontend/src/pages/dashboard/inventario/DetalleCierreInventario.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardApi } from '../../../hooks/useDashboardApi';
import toast from 'react-hot-toast';
import { type CierreInventario, type CierreEstadisticas } from '../../../types';

const DetalleCierreInventario: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCierreById, getCierreEstadisticas, finalizarCierre, isLoading } = useDashboardApi();

  const [cierre, setCierre] = useState<CierreInventario | null>(null);
  const [estadisticas, setEstadisticas] = useState<CierreEstadisticas | null>(null);
  const [vistaActual, setVistaActual] = useState<'detalles' | 'estadisticas'>('detalles');

  useEffect(() => {
    if (id) {
      loadCierre();
      loadEstadisticas();
    }
  }, [id]);

  const loadCierre = async () => {
    try {
      const data = await getCierreById(parseInt(id!));
      setCierre(data);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      navigate('/dashboard/cierre-inventario');
    }
  };

  const loadEstadisticas = async () => {
    try {
      const data = await getCierreEstadisticas(parseInt(id!));
      setEstadisticas(data);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleFinalizar = async () => {
    const confirmacion = window.confirm(
      '⚠️ ¿Estás seguro de finalizar este cierre?\n\n' +
      'Esta acción:\n' +
      '• Actualizará el stock de todos los productos\n' +
      '• NO se puede deshacer\n' +
      '• El cierre quedará bloqueado'
    );

    if (!confirmacion) return;

    try {
      await finalizarCierre(parseInt(id!));
      toast.success('¡Cierre finalizado! Stock actualizado correctamente');
      await loadCierre();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  if (isLoading || !cierre) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const esBorrador = cierre.estado === 'Borrador';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/cierre-inventario')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Cierre {cierre.tipo_cierre} #{cierre.id}
                  </h1>
                  <span
                    className={`px-4 py-1 rounded-full text-sm font-bold ${
                      esBorrador
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {esBorrador ? '⏳ Borrador' : '✅ Finalizado'}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Del {new Date(cierre.fecha_inicio).toLocaleDateString('es-PE')} al{' '}
                  {new Date(cierre.fecha_fin).toLocaleDateString('es-PE')}
                </p>
              </div>
            </div>

            {esBorrador && (
              <button
                onClick={handleFinalizar}
                className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                ✅ Finalizar Cierre
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setVistaActual('detalles')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                vistaActual === 'detalles'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Detalles ({cierre.detalles.length})
            </button>
            <button
              onClick={() => setVistaActual('estadisticas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                vistaActual === 'estadisticas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Estadísticas
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Información General */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Realizado por</p>
              <p className="text-lg font-bold text-gray-900">
                {cierre.empleados?.nombre || cierre.empleados?.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-lg font-bold text-gray-900">{cierre.detalles.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Diferencias</p>
              <p className="text-lg font-bold text-gray-900">
                S/. {Number(cierre.total_diferencias).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Creado</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(cierre.created_at).toLocaleDateString('es-PE')}
              </p>
            </div>
          </div>

          {cierre.observaciones && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Observaciones:</p>
              <p className="text-gray-900">{cierre.observaciones}</p>
            </div>
          )}
        </div>

        {/* Vista de Detalles */}
        {vistaActual === 'detalles' && (
          <div className="space-y-3">
            {cierre.detalles.map((detalle, idx) => {
              const diferencia = Number(detalle.diferencia);
              const valorDif = Number(detalle.valor_diferencia);

              return (
                <div
                  key={detalle.id}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-500">#{idx + 1}</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {detalle.productos_inventario.nombre}
                          </h3>
                          {detalle.productos_inventario.categorias_inventario && (
                            <span
                              className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-1"
                              style={{
                                backgroundColor: detalle.productos_inventario.categorias_inventario.color || '#gray',
                                color: 'white',
                              }}
                            >
                              {detalle.productos_inventario.categorias_inventario.nombre}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mt-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 font-medium">Stock Sistema</p>
                          <p className="text-xl font-bold text-blue-900">
                            {Number(detalle.stock_sistema).toFixed(2)}{' '}
                            {detalle.productos_inventario.unidades_medida?.abreviatura || 'un'}
                          </p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-medium">Stock Físico</p>
                          <p className="text-xl font-bold text-green-900">
                            {Number(detalle.stock_fisico).toFixed(2)}{' '}
                            {detalle.productos_inventario.unidades_medida?.abreviatura || 'un'}
                          </p>
                        </div>

                        <div
                          className={`rounded-lg p-3 ${
                            diferencia === 0
                              ? 'bg-gray-50'
                              : diferencia > 0
                              ? 'bg-green-50'
                              : 'bg-red-50'
                          }`}
                        >
                          <p
                            className={`text-xs font-medium ${
                              diferencia === 0
                                ? 'text-gray-600'
                                : diferencia > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            Diferencia
                          </p>
                          <p
                            className={`text-xl font-bold ${
                              diferencia === 0
                                ? 'text-gray-900'
                                : diferencia > 0
                                ? 'text-green-900'
                                : 'text-red-900'
                            }`}
                          >
                            {diferencia > 0 ? '+' : ''}
                            {diferencia.toFixed(2)}
                          </p>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-xs text-orange-600 font-medium">Valor</p>
                          <p className="text-xl font-bold text-orange-900">
                            S/. {Math.abs(valorDif).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {detalle.tipo_diferencia && (
                        <div className="mt-3 flex items-center gap-4">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            {detalle.tipo_diferencia}
                          </span>
                          {detalle.notas && (
                            <p className="text-sm text-gray-600">💬 {detalle.notas}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista de Estadísticas */}
        {vistaActual === 'estadisticas' && estadisticas && (
          <div className="space-y-6">
            {/* Resumen General */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Total Contados</p>
                <p className="text-3xl font-bold text-blue-600">
                  {estadisticas.total_productos_contados}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Diferencias +</p>
                <p className="text-3xl font-bold text-green-600">
                  {estadisticas.total_diferencias_positivas}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Diferencias -</p>
                <p className="text-3xl font-bold text-red-600">
                  {estadisticas.total_diferencias_negativas}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Valor Mermas</p>
                <p className="text-3xl font-bold text-orange-600">
                  S/. {estadisticas.valor_total_mermas.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Productos con Mayor Diferencia */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📉 Productos con Mayor Diferencia
              </h3>
              <div className="space-y-3">
                {estadisticas.productos_con_mayor_diferencia.map((prod, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{prod.producto}</p>
                      <p className="text-sm text-gray-600">
                        Diferencia: {prod.diferencia > 0 ? '+' : ''}
                        {prod.diferencia.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-red-600">
                      S/. {Math.abs(prod.valor).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Diferencias por Tipo */}
            {estadisticas.diferencias_por_tipo.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  📊 Diferencias por Tipo
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {estadisticas.diferencias_por_tipo.map((tipo) => (
                    <div key={tipo.tipo} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-1">{tipo.tipo}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">{tipo.cantidad} productos</p>
                        <p className="text-lg font-bold text-gray-900">
                          S/. {Math.abs(tipo.valor).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleCierreInventario;