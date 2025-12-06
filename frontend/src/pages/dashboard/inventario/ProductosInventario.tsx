// src/pages/dashboard/inventario/ProductosInventario.tsx - VERSIÓN COMPACTA

import React, { useState, useEffect } from 'react';
import { useDashboardApi } from '@shared/api/useDashboardApi';
import toast from 'react-hot-toast';
import { 
  type ProductoInventario,
  type CategoriaInventario,
  type UnidadMedida,
  type CreateProductoInventarioData,
  type UpdateProductoInventarioData
} from '@shared/types';
import { productoInventarioSchema } from '@features/inventory/model/schemas';
import type { ZodIssue } from 'zod';

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
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

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
    setFormErrors({});
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['categoria_inventario_id', 'unidad_medida_id', 'stock_actual', 'costo_unitario', 'stock_minimo', 'stock_maximo'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumberField ? Number(value) : value }));
    if (formErrors[name]) {
        setFormErrors(prev => ({...prev, [name]: undefined}));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = productoInventarioSchema.safeParse(formData);

    if (!validationResult.success) {
        const issues = validationResult.error.issues;
        const newErrors: Record<string, string> = {};
        issues.forEach((issue: ZodIssue) => {
            const path = issue.path[0];
            if (typeof path === 'string') {
                newErrors[path] = issue.message;
            }
        });
        setFormErrors(newErrors);
        return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    try {
      if (editingProducto) {
        await updateProductoInventario(editingProducto.id, validationResult.data as UpdateProductoInventarioData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await createProductoInventario(validationResult.data as CreateProductoInventarioData);
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
      <div className="flex justify-center items-center h-48 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* Barra superior: Alertas + Botón */}
        <div className="flex items-start justify-between gap-4">
          {/* Alertas compactas */}
          <div className="flex-1">
            {productosStockBajo.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      {productosStockBajo.length} producto{productosStockBajo.length > 1 ? 's' : ''} con stock bajo
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón Nuevo Producto */}
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap shadow-sm"
          >
            + Nuevo Producto
          </button>
        </div>

        {/* Filtros compactos */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto..."
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icono} {cat.nombre}
                </option>
              ))}
            </select>

            <select
              value={stockAlert}
              onChange={(e) => setStockAlert(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los niveles de stock</option>
              <option value="bajo">⚠️ Stock bajo</option>
              <option value="ok">✅ Stock OK</option>
            </select>
          </div>
        </div>

        {/* Tabla de productos - compacta */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Mínimo
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Unit.
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`text-xl ${!producto.activo && 'opacity-40'}`}>
                            {producto.categorias_inventario?.icono || '📦'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{producto.nombre}</p>
                            {producto.codigo_barras && (
                              <p className="text-xs text-gray-500">{producto.codigo_barras}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {producto.categorias_inventario ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${producto.categorias_inventario.color}20`,
                              color: producto.categorias_inventario.color || '#000',
                            }}
                          >
                            {producto.categorias_inventario.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin categoría</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBajoStock && <span className="text-amber-500 text-sm">⚠️</span>}
                          <span className={`font-semibold text-sm ${isBajoStock ? 'text-amber-600' : 'text-gray-900'}`}>
                            {stockActual}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {producto.unidades_medida?.abreviatura || 'un'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-600 text-sm">
                          {stockMinimo} {producto.unidades_medida?.abreviatura || 'un'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-gray-900 text-sm">
                          S/. {Number(producto.costo_unitario).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActivo(producto)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            producto.activo
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
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
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
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
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ej: Tomate, Cerveza Pilsen..."
                  />
                  {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    name="categoria_inventario_id"
                    value={formData.categoria_inventario_id}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.categoria_inventario_id ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value={0}>Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icono} {cat.nombre}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoria_inventario_id && <p className="text-red-500 text-xs mt-1">{formErrors.categoria_inventario_id}</p>}
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de Medida
                  </label>
                  <select
                    name="unidad_medida_id"
                    value={formData.unidad_medida_id}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.unidad_medida_id ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value={0}>Seleccionar...</option>
                    {unidades.map((unidad) => (
                      <option key={unidad.id} value={unidad.id}>
                        {unidad.nombre} ({unidad.abreviatura})
                      </option>
                    ))}
                  </select>
                  {formErrors.unidad_medida_id && <p className="text-red-500 text-xs mt-1">{formErrors.unidad_medida_id}</p>}
                </div>

                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={handleChange}
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
                    name="costo_unitario"
                    step="0.01"
                    value={formData.costo_unitario}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.costo_unitario ? 'border-red-500' : 'border-gray-300'}`}
                    min="0"
                  />
                  {formErrors.costo_unitario && <p className="text-red-500 text-xs mt-1">{formErrors.costo_unitario}</p>}
                </div>

                {/* Stock Actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    name="stock_actual"
                    step="0.001"
                    value={formData.stock_actual}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.stock_actual ? 'border-red-500' : 'border-gray-300'}`}
                    min="0"
                  />
                  {formErrors.stock_actual && <p className="text-red-500 text-xs mt-1">{formErrors.stock_actual}</p>}
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="stock_minimo"
                    step="0.001"
                    value={formData.stock_minimo}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.stock_minimo ? 'border-red-500' : 'border-gray-300'}`}
                    min="0"
                  />
                  {formErrors.stock_minimo && <p className="text-red-500 text-xs mt-1">{formErrors.stock_minimo}</p>}
                </div>

                {/* Stock Máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Máximo (Opcional)
                  </label>
                  <input
                    type="number"
                    name="stock_maximo"
                    step="0.001"
                    value={formData.stock_maximo}
                    onChange={handleChange}
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