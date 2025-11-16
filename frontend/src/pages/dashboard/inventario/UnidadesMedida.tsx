// src/pages/dashboard/UnidadesMedida.tsx

import React, { useState, useEffect } from 'react';
import { useDashboardApi } from '../../../hooks/useDashboardApi';
import toast from 'react-hot-toast';
import { type UnidadMedida, type CreateUnidadMedidaData } from '../../../types';

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Cargando unidades...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Unidades de Medida</h1>
              <p className="text-gray-600 mt-1">Define cómo mides tus productos</p>
            </div>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              + Nueva Unidad
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setTipoFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({unidades.length})
            </button>
            <button
              onClick={() => setTipoFilter('Peso')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoFilter === 'Peso'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚖️ Peso ({unidadesPorTipo.Peso.length})
            </button>
            <button
              onClick={() => setTipoFilter('Volumen')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoFilter === 'Volumen'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🧪 Volumen ({unidadesPorTipo.Volumen.length})
            </button>
            <button
              onClick={() => setTipoFilter('Cantidad')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoFilter === 'Cantidad'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Cantidad ({unidadesPorTipo.Cantidad.length})
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abreviatura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {unidadesFiltradas.map((unidad) => (
                  <tr key={unidad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{unidad.nombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        {unidad.abreviatura}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {unidad.tipo === 'Peso' && <span>⚖️</span>}
                        {unidad.tipo === 'Volumen' && <span>🧪</span>}
                        {unidad.tipo === 'Cantidad' && <span>📦</span>}
                        <span className="text-gray-700">{unidad.tipo || 'Sin tipo'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
              <div className="text-center py-12">
                <p className="text-gray-500">No hay unidades de medida en esta categoría</p>
              </div>
            )}
          </div>
        </div>

        {unidades.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center mt-6">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">📏</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay unidades de medida
            </h3>
            <p className="text-gray-500 mb-6">
              Crea unidades para medir tus productos de inventario.
            </p>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Crear Primera Unidad
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nueva Unidad de Medida</h2>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Peso">⚖️ Peso</option>
                  <option value="Volumen">🧪 Volumen</option>
                  <option value="Cantidad">📦 Cantidad</option>
                </select>
              </div>

              {/* Ejemplos */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Ejemplos:</p>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>• Peso: kg, g, lb, oz</p>
                  <p>• Volumen: L, ml, gal</p>
                  <p>• Cantidad: un, cj, doc, btl</p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
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
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
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