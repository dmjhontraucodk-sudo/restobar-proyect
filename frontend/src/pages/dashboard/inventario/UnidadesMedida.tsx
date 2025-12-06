// src/pages/dashboard/UnidadesMedida.tsx - VERSIÓN COMPACTA

import React, { useState, useEffect } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import toast from 'react-hot-toast';
import { type UnidadMedida, type CreateUnidadMedidaData } from '@shared/types';

const UnidadesMedida: React.FC = () => {
  const { getUnidadesMedida, createUnidadMedida, isLoading } = useDashboardApi();

  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipoFilter, setTipoFilter] = useState<'all' | 'Peso' | 'Volumen' | 'Cantidad'>('all');

  const [formData, setFormData] = useState({
    nombre: '',
    abreviatura: '',
    tipo: 'Cantidad',
  });

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      const data = await getUnidadesMedida();
      setUnidades(data);
    } catch (error: any) {
      toast.error(`Error al cargar unidades: ${error.message}`);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      nombre: '',
      abreviatura: '',
      tipo: 'Cantidad',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.abreviatura.trim()) {
      toast.error('El nombre y la abreviatura son requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      const createData: CreateUnidadMedidaData = {
        nombre: formData.nombre,
        abreviatura: formData.abreviatura,
        tipo: formData.tipo,
      };

      await createUnidadMedida(createData);
      toast.success('Unidad de medida creada exitosamente');
      await loadUnidades();
      handleCloseModal();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unidadesFiltradas = unidades.filter(u => 
    tipoFilter === 'all' || u.tipo === tipoFilter
  );

  const unidadesPorTipo = {
    Peso: unidades.filter(u => u.tipo === 'Peso'),
    Volumen: unidades.filter(u => u.tipo === 'Volumen'),
    Cantidad: unidades.filter(u => u.tipo === 'Cantidad'),
    Otros: unidades.filter(u => !u.tipo || !['Peso', 'Volumen', 'Cantidad'].includes(u.tipo)),
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Cargando unidades...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* Botón y filtros superiores - compactos */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTipoFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                tipoFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({unidades.length})
            </button>
            <button
              onClick={() => setTipoFilter('Peso')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                tipoFilter === 'Peso'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚖️ Peso ({unidadesPorTipo.Peso.length})
            </button>
            <button
              onClick={() => setTipoFilter('Volumen')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                tipoFilter === 'Volumen'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🧪 Volumen ({unidadesPorTipo.Volumen.length})
            </button>
            <button
              onClick={() => setTipoFilter('Cantidad')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                tipoFilter === 'Cantidad'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Cantidad ({unidadesPorTipo.Cantidad.length})
            </button>
          </div>

          <button
            onClick={handleOpenModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm whitespace-nowrap"
          >
            + Nueva Unidad
          </button>
        </div>

        {/* Tabla - compacta */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abreviatura
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {unidadesFiltradas.map((unidad) => (
                  <tr key={unidad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 text-sm">{unidad.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {unidad.abreviatura}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {unidad.tipo === 'Peso' && <span className="text-sm">⚖️</span>}
                        {unidad.tipo === 'Volumen' && <span className="text-sm">🧪</span>}
                        {unidad.tipo === 'Cantidad' && <span className="text-sm">📦</span>}
                        <span className="text-gray-700 text-sm">{unidad.tipo || 'Sin tipo'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        unidad.activa
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {unidad.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {unidadesFiltradas.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No hay unidades de medida en esta categoría</p>
              </div>
            )}
          </div>
        </div>

        {unidades.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
            <div className="text-gray-400 mb-3">
              <span className="text-5xl">📏</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay unidades de medida
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              Crea unidades para medir tus productos de inventario.
            </p>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Crear Primera Unidad
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Nueva Unidad de Medida</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Kilogramo, Litro, Unidad..."
                  required
                />
              </div>

              {/* Abreviatura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abreviatura *
                </label>
                <input
                  type="text"
                  value={formData.abreviatura}
                  onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: kg, L, un..."
                  required
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 10 caracteres. Se convertirá a minúsculas automáticamente.
                </p>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Peso">⚖️ Peso</option>
                  <option value="Volumen">🧪 Volumen</option>
                  <option value="Cantidad">📦 Cantidad</option>
                </select>
              </div>

              {/* Ejemplos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 mb-1.5">Ejemplos:</p>
                <div className="space-y-0.5 text-xs text-blue-700">
                  <p>• Peso: kg, g, lb, oz</p>
                  <p>• Volumen: L, ml, gal</p>
                  <p>• Cantidad: un, cj, doc, btl</p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-3">
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnidadesMedida;