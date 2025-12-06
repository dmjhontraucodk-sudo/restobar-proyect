// frontend/src/pages/dashboard/inventario/Compras.tsx - CON MODAL

import React, { useState, useEffect } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import toast from 'react-hot-toast';
import { type Compra, type TipoGasto, type ProductoInventario } from '@shared/types';

const Compras: React.FC = () => {
  const { 
    getCompras,
    createCompra,
    receiveCompra,
    getTiposGasto,
    getProductosInventario,
    isLoading 
  } = useDashboardApi();
  
  const [compras, setCompras] = useState<Compra[]>([]);
  const [tiposGasto, setTiposGasto] = useState<TipoGasto[]>([]);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'pendientes' | 'recibidas'>('all');
  
  // ✨ ESTADO DEL MODAL
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tipo_gasto_id: '',
    fecha: new Date().toISOString().split('T')[0],
    proveedor_id: null as number | null,
    numero_documento: '',
    observaciones: '',
    items: [] as Array<{
      producto_inventario_id: number;
      cantidad: number;
      costo_unitario: number;
    }>
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [comprasData, tiposData, productosData] = await Promise.all([
        getCompras(),
        getTiposGasto(),
        getProductosInventario(),
      ]);
      
      const soloCompras = comprasData.filter(item => 
        item.tipos_gasto?.afecta_inventario === true
      );
      
      const tiposInventario = tiposData.filter(tipo => 
        tipo.afecta_inventario === true && tipo.activo
      );
      
      const productosActivos = productosData.filter(p => p.activo);
      
      setCompras(soloCompras);
      setTiposGasto(tiposInventario);
      setProductos(productosActivos);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleReceiveCompra = async (compraId: number) => {
    const confirmacion = window.confirm(
      '¿Estás seguro de marcar esta compra como RECIBIDA?\n\n' +
      'Esto incrementará el stock de los productos.'
    );

    if (!confirmacion) return;

    try {
      await receiveCompra(compraId);
      toast.success('¡Compra recibida! Stock actualizado correctamente');
      await loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // ✨ AGREGAR PRODUCTO AL FORMULARIO
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { producto_inventario_id: 0, cantidad: 0, costo_unitario: 0 }]
    });
  };

  // ✨ ACTUALIZAR ITEM
  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  // ✨ ELIMINAR ITEM
  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // ✨ CALCULAR TOTAL
  const calcularTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (item.cantidad * item.costo_unitario);
    }, 0);
  };

  // ✨ CREAR COMPRA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo_gasto_id) {
      toast.error('Selecciona un tipo de gasto');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    const itemsInvalidos = formData.items.some(
      item => !item.producto_inventario_id || item.cantidad <= 0 || item.costo_unitario <= 0
    );

    if (itemsInvalidos) {
      toast.error('Completa todos los campos de los productos');
      return;
    }

    try {
      const total = calcularTotal();
      
      await createCompra({
        tipo_gasto_id: parseInt(formData.tipo_gasto_id),
        fecha: new Date(formData.fecha).toISOString(),
        total: total,
        descripcion: formData.observaciones,
        numero_documento: formData.numero_documento || undefined,
        items: formData.items,
      });

      toast.success('¡Compra creada exitosamente!');
      setShowModal(false);
      setFormData({
        tipo_gasto_id: '',
        fecha: new Date().toISOString().split('T')[0],
        proveedor_id: null,
        numero_documento: '',
        observaciones: '',
        items: []
      });
      await loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // Filtrar compras
  const comprasFiltradas = viewMode === 'all' 
    ? compras 
    : compras.filter(c => 
        viewMode === 'pendientes' 
          ? c.estado_compra === 'Pendiente' 
          : c.estado_compra === 'Recibido'
      );

  const totalCompras = comprasFiltradas.reduce((sum, c) => sum + Number(c.total), 0);
  const comprasPendientes = compras.filter(c => c.estado_compra === 'Pendiente').length;
  const comprasRecibidas = compras.filter(c => c.estado_compra === 'Recibido').length;

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
              <h1 className="text-2xl font-bold text-gray-900">Compras de Inventario</h1>
              <p className="text-gray-600 mt-1">
                Gestiona las compras que incrementan tu stock de productos
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              + Nueva Compra
            </button>
          </div>

          {/* Información */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="font-medium text-blue-900">¿Qué son compras de inventario?</p>
                <p className="text-sm text-blue-700 mt-1">
                  Son compras de productos que se agregan a tu stock: ingredientes, bebidas, 
                  insumos, etc. Al recibirlas, el stock se actualiza automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Total Compras</p>
              <p className="text-3xl font-bold text-green-900">
                S/. {totalCompras.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Todas</p>
              <p className="text-3xl font-bold text-blue-900">{compras.length}</p>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4">
              <p className="text-sm text-amber-600 font-medium">Pendientes</p>
              <p className="text-3xl font-bold text-amber-900">{comprasPendientes}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-600 font-medium">Recibidas</p>
              <p className="text-3xl font-bold text-purple-900">{comprasRecibidas}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({compras.length})
            </button>
            <button
              onClick={() => setViewMode('pendientes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'pendientes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏳ Pendientes ({comprasPendientes})
            </button>
            <button
              onClick={() => setViewMode('recibidas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'recibidas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Recibidas ({comprasRecibidas})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Compras */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          {comprasFiltradas.map((compra) => {
            const tipoGasto = compra.tipos_gasto;
            const esPendiente = compra.estado_compra === 'Pendiente';
            const detalles = compra.compras_detalles || [];

            return (
              <div
                key={compra.id}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="text-3xl p-3 rounded-xl"
                      style={{
                        backgroundColor: tipoGasto?.color || '#10B981',
                        opacity: 0.9,
                      }}
                    >
                      {tipoGasto?.icono || '📦'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Compra #{compra.id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            esPendiente
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {esPendiente ? '⏳ Pendiente' : '✅ Recibido'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-medium text-gray-700">
                          {tipoGasto?.nombre || 'Sin categoría'}
                        </p>
                        <p>
                          📅 {new Date(compra.fecha).toLocaleDateString('es-PE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
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
                    <p className="text-3xl font-bold text-green-600">
                      S/. {Number(compra.total).toFixed(2)}
                    </p>
                    {esPendiente && (
                      <button
                        onClick={() => handleReceiveCompra(compra.id)}
                        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        ✅ Recibir Compra
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalles de Productos */}
                {detalles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      📦 Productos ({detalles.length}):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {detalles.map((detalle) => (
                        <div
                          key={detalle.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <p className="font-medium text-gray-900 text-sm">
                            {detalle.productos_inventario?.nombre}
                          </p>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                            <span>
                              Cantidad: {Number(detalle.cantidad).toFixed(2)}{' '}
                              {detalle.productos_inventario?.unidades_medida?.abreviatura || 'un'}
                            </span>
                            <span className="font-medium">
                              S/. {Number(detalle.costo_unitario).toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs font-bold text-green-600">
                            Subtotal: S/. {(Number(detalle.cantidad) * Number(detalle.costo_unitario)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {comprasFiltradas.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">📦</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay compras {viewMode === 'pendientes' ? 'pendientes' : viewMode === 'recibidas' ? 'recibidas' : 'registradas'}
            </h3>
            <p className="text-gray-500 mb-6">
              {viewMode === 'all' 
                ? 'Registra tu primera compra de productos para el inventario.'
                : `No hay compras ${viewMode === 'pendientes' ? 'pendientes de recibir' : 'recibidas'} en este momento.`
              }
            </p>
            {viewMode === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Registrar Primera Compra
              </button>
            )}
          </div>
        )}
      </div>

      {/* ✨ MODAL DE NUEVA COMPRA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Nueva Compra de Inventario</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Gasto *
                  </label>
                  <select
                    value={formData.tipo_gasto_id}
                    onChange={(e) => setFormData({ ...formData, tipo_gasto_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {tiposGasto.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.icono} {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° Documento
                  </label>
                  <input
                    type="text"
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Factura, boleta, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Notas adicionales"
                  />
                </div>
              </div>

              {/* Productos */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    + Agregar Producto
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg">
                      <div className="flex-1">
                        <select
                          value={item.producto_inventario_id}
                          onChange={(e) => handleUpdateItem(index, 'producto_inventario_id', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        >
                          <option value="0">Seleccionar producto...</option>
                          {productos.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.nombre} ({prod.unidades_medida?.abreviatura})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          step="0.01"
                          value={item.cantidad || ''}
                          onChange={(e) => handleUpdateItem(index, 'cantidad', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Cantidad"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          step="0.01"
                          value={item.costo_unitario || ''}
                          onChange={(e) => handleUpdateItem(index, 'costo_unitario', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="S/. Costo"
                          required
                        />
                      </div>
                      <div className="w-32 text-right">
                        <p className="text-sm font-semibold text-gray-700 py-2">
                          S/. {(item.cantidad * item.costo_unitario).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos agregados. Click en "Agregar Producto" para comenzar.
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-3xl font-bold text-green-600">
                    S/. {calcularTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                >
                  Crear Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;