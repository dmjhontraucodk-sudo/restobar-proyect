// src/pages/dashboard/ProductosInventario.tsx

import React, { useState, useEffect } from 'react';
import { useDashboardApi } from '../../../hooks/useDashboardApi';
import toast from 'react-hot-toast';
import { 
  type ProductoInventario,
  type CategoriaInventario,
  type UnidadMedida,
  type CreateProductoInventarioData,
  type UpdateProductoInventarioData
} from '../../../types';

const ProductosInventario: React.FC = () => {
  const { 
    getProductosInventario,
    createProductoInventario,
    updateProductoInventario,
    getCategoriasInventario,
    getUnidadesMedida,
    isLoading 
  } = useDashboardApi();

  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<ProductoInventario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros
  const [categoriaFilter, setCategoriaFilter] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockAlert, setStockAlert] = useState<'all' | 'bajo' | 'ok'>('all');

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    categoria_inventario_id: 0,
    unidad_medida_id: 0,
    codigo_barras: '',
    stock_actual: 0,
    costo_unitario: 0,
    stock_minimo: 0,
    stock_maximo: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productosData, categoriasData, unidadesData] = await Promise.all([
        getProductosInventario(),
        getCategoriasInventario(),
        getUnidadesMedida(),
      ]);
      setProductos(productosData);
      setCategorias(categoriasData.filter(c => c.activa));
      setUnidades(unidadesData.filter(u => u.activa));
    } catch (error: any) {
      toast.error(`Error al cargar datos: ${error.message}`);
    }
  };

  const handleOpenModal = (producto?: ProductoInventario) => {
    if (producto) {
      setEditingProducto(producto);
      setFormData({
        nombre: producto.nombre,
        categoria_inventario_id: producto.categoria_inventario_id || 0,
        unidad_medida_id: producto.unidad_medida_id || 0,
        codigo_barras: producto.codigo_barras || '',
        stock_actual: Number(producto.stock_actual),
        costo_unitario: Number(producto.costo_unitario),
        stock_minimo: Number(producto.stock_minimo),
        stock_maximo: Number(producto.stock_maximo || 0),
      });
    } else {
      setEditingProducto(null);
      setFormData({
        nombre: '',
        categoria_inventario_id: 0,
        unidad_medida_id: 0,
        codigo_barras: '',
        stock_actual: 0,
        costo_unitario: 0,
        stock_minimo: 0,
        stock_maximo: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProducto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        nombre: formData.nombre,
        categoria_inventario_id: formData.categoria_inventario_id || undefined,
        unidad_medida_id: formData.unidad_medida_id || undefined,
        codigo_barras: formData.codigo_barras || undefined,
        stock_actual: formData.stock_actual,
        costo_unitario: formData.costo_unitario,
        stock_minimo: formData.stock_minimo,
        stock_maximo: formData.stock_maximo || undefined,
      };

      if (editingProducto) {
        await updateProductoInventario(editingProducto.id, data as UpdateProductoInventarioData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await createProductoInventario(data as CreateProductoInventarioData);
        toast.success('Producto creado exitosamente');
      }

      await loadData();
      handleCloseModal();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivo = async (producto: ProductoInventario) => {
    try {
      await updateProductoInventario(producto.id, { activo: !producto.activo });
      toast.success(`Producto ${producto.activo ? 'desactivado' : 'activado'}`);
      await loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // Productos filtrados
  const productosFiltrados = productos.filter((producto) => {
    const matchCategoria = categoriaFilter === 'all' || producto.categoria_inventario_id === categoriaFilter;
    const matchSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStock = 
      stockAlert === 'all' ||
      (stockAlert === 'bajo' && Number(producto.stock_actual) <= Number(producto.stock_minimo)) ||
      (stockAlert === 'ok' && Number(producto.stock_actual) > Number(producto.stock_minimo));
    
    return matchCategoria && matchSearch && matchStock;
  });

  const productosStockBajo = productos.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Cargando productos...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Productos de Inventario</h1>
              <p className="text-gray-600 mt-1">Gestiona los productos de tu inventario</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              + Nuevo Producto
            </button>
          </div>

          {/* Alertas */}
          {productosStockBajo.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium text-amber-900">
                    {productosStockBajo.length} producto{productosStockBajo.length > 1 ? 's' : ''} con stock bajo
                  </p>
                  <p className="text-sm text-amber-700">Revisa tu inventario y considera hacer un pedido</p>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icono} {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={stockAlert}
                onChange={(e) => setStockAlert(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los niveles de stock</option>
                <option value="bajo">⚠️ Stock bajo</option>
                <option value="ok">✅ Stock OK</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Mínimo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Unit.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productosFiltrados.map((producto) => {
                  const stockActual = Number(producto.stock_actual);
                  const stockMinimo = Number(producto.stock_minimo);
                  const isBajoStock = stockActual <= stockMinimo;

                  return (
                    <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl ${!producto.activo && 'opacity-40'}`}>
                            {producto.categorias_inventario?.icono || '📦'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{producto.nombre}</p>
                            {producto.codigo_barras && (
                              <p className="text-sm text-gray-500">{producto.codigo_barras}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {producto.categorias_inventario ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${producto.categorias_inventario.color}20`,
                              color: producto.categorias_inventario.color || '#000',
                            }}
                          >
                            {producto.categorias_inventario.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin categoría</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isBajoStock && <span className="text-amber-500">⚠️</span>}
                          <span className={`font-semibold ${isBajoStock ? 'text-amber-600' : 'text-gray-900'}`}>
                            {stockActual}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {producto.unidades_medida?.abreviatura || 'un'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-600">
                          {stockMinimo} {producto.unidades_medida?.abreviatura || 'un'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          S/. {Number(producto.costo_unitario).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActivo(producto)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            producto.activo
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenModal(producto)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {productosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL*/}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Tomate, Cerveza Pilsen..."
                    required
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria_inventario_id}
                    onChange={(e) => setFormData({ ...formData, categoria_inventario_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icono} {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de Medida
                  </label>
                  <select
                    value={formData.unidad_medida_id}
                    onChange={(e) => setFormData({ ...formData, unidad_medida_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Seleccionar...</option>
                    {unidades.map((unidad) => (
                      <option key={unidad.id} value={unidad.id}>
                        {unidad.nombre} ({unidad.abreviatura})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    value={formData.codigo_barras}
                    onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Opcional..."
                  />
                </div>

                {/* Costo Unitario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Unitario (S/.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costo_unitario}
                    onChange={(e) => setFormData({ ...formData, costo_unitario: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                {/* Stock Actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                {/* Stock Máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Máximo (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.stock_maximo}
                    onChange={(e) => setFormData({ ...formData, stock_maximo: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
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
                  {isSubmitting ? 'Guardando...' : editingProducto ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosInventario;