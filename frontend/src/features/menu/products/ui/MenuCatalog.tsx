// src/features/menu/products/ui/MenuCatalog.tsx
import { Search, Filter, ShoppingBag, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestobarCatalog } from '@features/menu/model/useRestobarCatalog';
import { useCart } from '@app/providers/CartProvider';
import { useGlobalConfig } from '@shared/hooks/useGlobalConfig'; // ✅ IMPORTAR
import type { Producto } from '@shared/types';

// Elimina la prop onAddToCart ya que usaremos useCart directamente
export function MenuCatalog() {
  const {
    categories,
    tenantInfo,
    searchTerm,
    selectedCategory,
    filters,
    sortBy,
    showFilters,
    loading,
    filteredProducts,
    setSearchTerm,
    setSelectedCategory,
    setFilters,
    setSortBy,
    setShowFilters,
  } = useRestobarCatalog();

  const { addToCart, getTotalItems } = useCart();
  const { formatCurrency } = useGlobalConfig(); // ✅ USAR HOOK
  const cartItemCount = getTotalItems();
  const navigate = useNavigate();

  // Función para agregar al carrito
  const handleAddToCart = (product: Producto) => {
    // ✅ Usar precio oferta si existe
    const finalPrice = (product.precio_oferta && Number(product.precio_oferta) > 0)
      ? Number(product.precio_oferta)
      : Number(product.precio);

    addToCart({
      id: product.id,
      nombre: product.nombre,
      precio: finalPrice, // ✅ Precio corregido
      foto_url: product.foto_url,
      disponible: product.disponible
    });
  };

  // Lógica para detectar si hay filtros activos
  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedCategory !== null || 
    Object.values(filters).some(Boolean);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setFilters({ vegetarian: false, vegan: false, glutenFree: false, spicy: false });
    setShowFilters(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] bg-gray-50">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-slate-900 mb-2"></div>
        <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Cargando...</p>
      </div>
    );
  }

  return (
    <div id="menu" className="min-h-screen bg-gray-50/50 font-sans text-slate-800 pb-24">
      
      {/* --- HEADER COMPACTO --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            
            {/* Fila Superior: Título y Buscador */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {tenantInfo?.nombre_empresa || 'Carta'}
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-medium">
                    Elige tus favoritos
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Buscador */}
                    <div className="relative group flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={16} />
                        <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-100 border-transparent rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Botón Filtros Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all border ${
                        showFilters || Object.values(filters).some(Boolean) 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Fila Inferior: Categorías y Botón Limpiar */}
            <div className="flex items-center gap-4">
                {/* Scroll Categorías */}
                <div className="flex-1 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border ${
                            selectedCategory === null
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-gray-200 hover:border-slate-300'
                            }`}
                        >
                            Todos
                        </button>
                        {categories.map((category) => (
                            <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border ${
                                selectedCategory === category.id
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-gray-200 hover:border-slate-300'
                            }`}
                            >
                            {category.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* BOTÓN LIMPIAR FILTROS (Solo aparece si es necesario) */}
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-md hover:bg-red-100 transition-colors whitespace-nowrap animate-in fade-in"
                    >
                        <X size={14} />
                        Limpiar todo
                    </button>
                )}
            </div>

            {/* Panel de Filtros Avanzados (Desplegable) */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex flex-wrap gap-3">
                            {[
                            { label: 'Vegetariano', key: 'vegetarian' },
                            { label: 'Vegano', key: 'vegan' },
                            { label: 'Sin Gluten', key: 'glutenFree' },
                            { label: 'Picante', key: 'spicy' },
                            ].map((filter) => (
                            <label key={filter.key} className="flex items-center gap-2 cursor-pointer select-none group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    (filters as any)[filter.key] ? 'bg-slate-900 border-slate-900' : 'bg-white border-gray-300 group-hover:border-slate-400'
                                }`}>
                                    {(filters as any)[filter.key] && <ChevronDown size={12} className="text-white" />} 
                                </div>
                                <span className={`text-xs font-semibold ${(filters as any)[filter.key] ? 'text-slate-900' : 'text-slate-500'}`}>
                                {filter.label}
                                </span>
                                <input
                                type="checkbox"
                                className="hidden"
                                checked={(filters as any)[filter.key]}
                                onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.checked })}
                                />
                            </label>
                            ))}
                        </div>
                        
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-gray-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded border border-gray-200 focus:outline-none cursor-pointer"
                        >
                            <option value="popular">Populares</option>
                            <option value="price-asc">Precio: Menor</option>
                            <option value="name">Nombre (A-Z)</option>
                        </select>
                    </div>
                    
                    {/* Botón Limpiar Móvil */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="sm:hidden mt-3 w-full flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-md"
                        >
                            <X size={14} />
                            Limpiar filtros aplicados
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* --- GRID INTELIGENTE --- */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {filteredProducts.map((product) => (
              <ProductTile 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                 <Search className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium">No se encontraron productos.</p>
            <button 
               onClick={clearAllFilters}
               className="mt-3 text-slate-900 text-xs font-bold hover:underline"
            >
              Limpiar búsqueda y filtros
            </button>
          </div>
        )}
      </div>

      {/* Botón Carrito */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => navigate('/cart')}
          className="bg-slate-900 hover:bg-black text-white w-14 h-14 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center relative"
        >
          <ShoppingBag size={20} />
          {cartItemCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// Componente ProductTile
function ProductTile({ 
  product, 
  onAddToCart,
  isReadOnly 
}: { 
  product: Producto; 
  onAddToCart: (product: Producto) => void;
  isReadOnly: boolean;
}) {
  const { formatCurrency } = useGlobalConfig(); // ✅ USAR HOOK AQUÍ TAMBIÉN

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-slate-400 hover:shadow-lg transition-all duration-300 h-full">
      
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.foto_url ? (
          <img
            src={product.foto_url}
            alt={product.nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <span className="text-3xl opacity-30">🍽️</span>
          </div>
        )}

        {product.es_recomendado && (
           <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-extrabold text-orange-600 shadow-sm uppercase tracking-wide">
              Top
           </div>
        )}

        {/* ✅ BADGE DE OFERTA */}
        {product.precio_oferta && Number(product.precio_oferta) > 0 && (
           <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md uppercase tracking-wide animate-pulse">
              ¡Oferta!
           </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
              {product.nombre}
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-1 h-8">
              {product.descripcion}
            </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex flex-col">
                {product.precio_oferta && Number(product.precio_oferta) > 0 ? (
                    <>
                        <span className="text-[10px] text-gray-400 line-through">
                            {formatCurrency(Number(product.precio))}
                        </span>
                        <span className="text-sm font-extrabold text-red-600">
                            {formatCurrency(Number(product.precio_oferta))}
                        </span>
                    </>
                ) : (
                    <span className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(Number(product.precio))}
                    </span>
                )}
            </div>

            {!isReadOnly && (
              <button
                onClick={(e) => {
                  e.preventDefault(); 
                  onAddToCart(product);
                }}
                disabled={!product.disponible}
                className={`
                  h-8 px-3 rounded-md flex items-center justify-center transition-all text-xs font-bold
                  ${product.disponible 
                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-900 hover:text-white' 
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }
                `}
              >
                {product.disponible ? 'Agregar' : 'Agotado'}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}