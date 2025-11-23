// src/pages/public/ProductCatalog.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Leaf, Flame, Award, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWebApi } from '../../hooks/useWebApi';
import type { CategoriaMenu } from '../../types';

export default function ProductCatalog() {
  const [categories, setCategories] = useState<CategoriaMenu[]>([]);
  const [tenantInfo, setTenantInfo] = useState<{ nombre_empresa: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    spicy: false,
  });
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'name'>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { getCatalog, searchProducts } = useWebApi();
  const { addToCart } = useCart();

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCatalog();
      setCategories(data.categories || []);
      setTenantInfo(data.tenant);
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setLoading(false);
    }
  }, [getCatalog]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      loadCatalog();
      return;
    }

    try {
      setLoading(true);
      const data = await searchProducts(searchTerm);
      setCategories([{
        id: 0,
        nombre: `Resultados para "${searchTerm}"`,
        productos: data.results || []
      }]);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      nombre: product.nombre,
      precio: Number(product.precio),
      foto_url: product.foto_url,
      disponible: product.disponible
    });
  };

  // Combinar todos los productos para filtros
  const allProducts = categories.flatMap(cat => cat.productos || []);

  // Aplicar filtros
  const filteredProducts = allProducts
    .filter(product => {
      if (selectedCategory && product.categoria_id !== selectedCategory) return false;
      if (searchTerm && !product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filters.vegetarian && !product.es_vegetariano) return false;
      if (filters.vegan && !product.es_vegano) return false;
      if (filters.glutenFree && !product.sin_gluten) return false;
      if (filters.spicy && !product.es_picante) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.es_recomendado ? 1 : 0) - (a.es_recomendado ? 1 : 0);
      if (sortBy === 'price-asc') return a.precio - b.precio;
      if (sortBy === 'name') return a.nombre.localeCompare(b.nombre);
      return 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {tenantInfo?.nombre_empresa || 'Nuestro Menú'}
          </h1>
          <p className="text-gray-600 text-lg">Descubre nuestra experiencia gastronómica</p>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="¿Qué te apetece hoy? Busca platos, ingredientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-full text-gray-700 hover:border-blue-500 transition-colors"
            >
              <Filter size={20} />
              Filtros
            </button>
          </form>

          {showFilters && (
            <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.vegetarian}
                    onChange={(e) => setFilters({ ...filters, vegetarian: e.target.checked })}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-gray-900">Vegetariano</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.vegan}
                    onChange={(e) => setFilters({ ...filters, vegan: e.target.checked })}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-gray-900">Vegano</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.glutenFree}
                    onChange={(e) => setFilters({ ...filters, glutenFree: e.target.checked })}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-gray-900">Sin Gluten</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.spicy}
                    onChange={(e) => setFilters({ ...filters, spicy: e.target.checked })}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-gray-900">Picante</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="popular">Más populares</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="name">A-Z</option>
                </select>
              </div>
            </div>
          )}

          {/* Categorías */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                }`}
              >
                {category.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-500/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              {/* Imagen del Producto */}
              <div className="relative h-56 overflow-hidden">
                {product.foto_url ? (
                  <img
                    src={product.foto_url}
                    alt={product.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">🍽️</span>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {product.es_recomendado && (
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Award size={12} /> Recomendado
                    </span>
                  )}
                  {product.es_nuevo && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Sparkles size={12} /> Nuevo
                    </span>
                  )}
                </div>
                
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  {product.es_vegano && (
                    <span className="bg-green-500 text-white p-2 rounded-full" title="Vegano">
                      <Leaf size={16} />
                    </span>
                  )}
                  {product.es_picante && (
                    <span className="bg-red-500 text-white p-2 rounded-full" title="Picante">
                      <Flame size={16} />
                    </span>
                  )}
                </div>
              </div>

              {/* Información del Producto */}
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.nombre}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {product.descripcion || 'Delicioso plato preparado con ingredientes frescos'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">
                    S/ {Number(product.precio).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.disponible}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-full transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {product.disponible ? 'Añadir 🛒' : 'No disponible'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No se encontraron platos con estos criterios</p>
          </div>
        )}
      </div>
    </div>
  );
}