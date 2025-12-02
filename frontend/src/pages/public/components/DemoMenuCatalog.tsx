// src/pages/public/components/DemoMenuCatalog.tsx - VERSIÓN SIMPLIFICADA
import { useState } from 'react';
import { Search, Filter, Award, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import type { Producto } from '../../../types';

// DATOS DEMO DIRECTOS - SIN HOOKS COMPLICADOS
const DEMO_PRODUCTS_DIRECT = [
  {
    id: 1,
    nombre: "CEVICHE CLÁSICO 🐟",
    descripcion: "Pescado fresco marinado en limón con cebolla y ají limo",
    precio: 28.90,
    foto_url: "https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg",
    disponible: true,
    es_vegetariano: false,
    es_vegano: false,
    sin_gluten: true,
    es_picante: true,
    es_recomendado: true,
    es_nuevo: false,
    categoria_id: 1
  },
  {
    id: 2,
    nombre: "CAUSA LIMEÑA 🥔",
    descripcion: "Papa amarilla con ají, limón y rellena de pollo o atún",
    precio: 22.50,
    foto_url: "https://images.pexels.com/photos/10927379/pexels-photo-10927379.jpeg",
    disponible: true,
    es_vegetariano: false,
    es_vegano: false,
    sin_gluten: true,
    es_picante: false,
    es_recomendado: true,
    es_nuevo: true,
    categoria_id: 1
  },
  {
    id: 3,
    nombre: "LOMO SALTADO 🥩",
    descripcion: "Trozos de lomo salteados con cebolla, tomate y papas fritas",
    precio: 38.90,
    foto_url: "https://images.pexels.com/photos/12568756/pexels-photo-12568756.jpeg",
    disponible: true,
    es_vegetariano: false,
    es_vegano: false,
    sin_gluten: true,
    es_picante: false,
    es_recomendado: true,
    es_nuevo: false,
    categoria_id: 2
  }
];

const DEMO_CATEGORIES_DIRECT = [
  { id: 1, nombre: "Entradas", descripcion: "Para empezar" },
  { id: 2, nombre: "Platos Principales", descripcion: "Especialidades" },
  { id: 3, nombre: "Bebidas", descripcion: "Para acompañar" }
];

interface DemoMenuCatalogProps {
  onAddToCart: (product: Producto) => void;
}

export function DemoMenuCatalog({ onAddToCart }: DemoMenuCatalogProps) {
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  
  // Estado local SIMPLE
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Productos filtrados SIMPLES
  const filteredProducts = DEMO_PRODUCTS_DIRECT.filter(product => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return product.nombre.toLowerCase().includes(term) || 
             product.descripcion.toLowerCase().includes(term);
    }
    return true;
  });

  console.log('🎯 DemoMenuCatalog renderizado');
  console.log('📊 Productos para mostrar:', filteredProducts.length);
  console.log('📝 Primer producto:', filteredProducts[0]?.nombre);

  const cartItemCount = getTotalItems();

  return (
    <div id="menu" className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header del Menú */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🍽️ Menú Demo Interactivo
          </h2>
          <p className="text-gray-600 text-lg">Prueba cómo funciona nuestro sistema</p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
            <p className="text-blue-700 text-sm">
              <strong>Modo Demo:</strong> Estos productos son de ejemplo
            </p>
          </div>
        </div>

        {/* Barra de Búsqueda SIMPLE */}
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar platos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-full"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white border border-gray-300 rounded-full"
            >
              <Filter size={20} />
            </button>
          </div>

          {/* Categorías */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-full ${selectedCategory === null ? 'bg-blue-500 text-white' : 'bg-white border'}`}
            >
              Todos
            </button>
            {DEMO_CATEGORIES_DIRECT.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full ${selectedCategory === category.id ? 'bg-blue-500 text-white' : 'bg-white border'}`}
              >
                {category.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Productos - SIEMPRE debe mostrar algo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden border shadow-lg">
              {/* Imagen */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={product.foto_url}
                  alt={product.nombre}
                  className="w-full h-full object-cover hover:scale-110 transition-transform"
                />
                {product.es_recomendado && (
                  <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                    <Award size={12} /> Recomendado
                  </div>
                )}
              </div>
              
              {/* Información */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.nombre}</h3>
                <p className="text-gray-600 text-sm mb-4">{product.descripcion}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">
                    S/ {product.precio.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onAddToCart(product as Producto)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full"
                  >
                    Añadir 🛒
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Si por algún motivo no hay productos */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-8 bg-white rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">No se encontraron productos</h3>
              <p>Intenta con otra búsqueda o</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full"
              >
                Mostrar todos
              </button>
            </div>
          </div>
        )}

        {/* Contador */}
        <div className="mt-8 text-center text-gray-600">
          Mostrando {filteredProducts.length} productos demo
        </div>

        {/* Carrito flotante */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => navigate('/cart')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 relative"
          >
            <ShoppingBag size={24} />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}