// src/hooks/useDemoCatalog.ts - VERSIÓN AISLADA
import { useState, useMemo } from 'react';

// Datos DEMO COMPLETAMENTE AUTÓNOMOS
const DEMO_PRODUCTS = [
  {
    id: 1,
    nombre: "Ceviche Clásico",
    descripcion: "Pescado fresco marinado en limón con cebolla y ají limo",
    precio: 28.90,
    foto_url: "https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg",
    disponible: true,
    visible_en_web: true,
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
    nombre: "Causa Limeña",
    descripcion: "Papa amarilla con ají, limón y rellena de pollo o atún",
    precio: 22.50,
    foto_url: "https://images.pexels.com/photos/10927379/pexels-photo-10927379.jpeg",
    disponible: true,
    visible_en_web: true,
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
    nombre: "Lomo Saltado",
    descripcion: "Trozos de lomo salteados con cebolla, tomate y papas fritas",
    precio: 38.90,
    foto_url: "https://images.pexels.com/photos/12568756/pexels-photo-12568756.jpeg",
    disponible: true,
    visible_en_web: true,
    es_vegetariano: false,
    es_vegano: false,
    sin_gluten: true,
    es_picante: false,
    es_recomendado: true,
    es_nuevo: false,
    categoria_id: 2
  },
  {
    id: 4,
    nombre: "Risotto de Hongos",
    descripcion: "Arroz arbóreo cremoso con hongos silvestres y parmesano",
    precio: 32.50,
    foto_url: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg",
    disponible: true,
    visible_en_web: true,
    es_vegetariano: true,
    es_vegano: false,
    sin_gluten: false,
    es_picante: false,
    es_recomendado: false,
    es_nuevo: true,
    categoria_id: 2
  },
  {
    id: 5,
    nombre: "Chicha Morada",
    descripcion: "Bebida tradicional peruana de maíz morado",
    precio: 8.90,
    foto_url: "https://images.pexels.com/photos/6607539/pexels-photo-6607539.jpeg",
    disponible: true,
    visible_en_web: true,
    es_vegetariano: true,
    es_vegano: true,
    sin_gluten: true,
    es_picante: false,
    es_recomendado: true,
    es_nuevo: false,
    categoria_id: 3
  },
  {
    id: 6,
    nombre: "Pisco Sour",
    descripcion: "Coctel emblemático del Perú con pisco, limón y clara de huevo",
    precio: 18.50,
    foto_url: "https://images.pexels.com/photos/12824243/pexels-photo-12824243.jpeg",
    disponible: true,
    visible_en_web: true,
    es_vegetariano: true,
    es_vegano: false,
    sin_gluten: true,
    es_picante: false,
    es_recomendado: true,
    es_nuevo: false,
    categoria_id: 3
  }
];

const DEMO_CATEGORIES = [
  {
    id: 1,
    nombre: "Entradas",
    descripcion: "Para empezar con buen sabor",
    productos: DEMO_PRODUCTS.filter(p => p.categoria_id === 1)
  },
  {
    id: 2,
    nombre: "Platos Principales",
    descripcion: "Nuestras especialidades",
    productos: DEMO_PRODUCTS.filter(p => p.categoria_id === 2)
  },
  {
    id: 3,
    nombre: "Bebidas",
    descripcion: "Para acompañar tu comida",
    productos: DEMO_PRODUCTS.filter(p => p.categoria_id === 3)
  }
];

export function useDemoCatalog() {
  console.log('🔍 useDemoCatalog ejecutándose...');
  console.log('📦 Productos demo disponibles:', DEMO_PRODUCTS.length);
  console.log('📂 Categorías demo:', DEMO_CATEGORIES.length);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    spicy: false
  });
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'name'>('popular');
  const [showFilters, setShowFilters] = useState(false);

  // SIMPLE: Devuelve todos los productos sin filtros complejos
  const filteredProducts = useMemo(() => {
    console.log('🎯 Filtrando productos...');
    
    // Para debug: ignora todos los filtros y devuelve todo
    const allProducts = DEMO_PRODUCTS;
    console.log('✅ Productos a mostrar:', allProducts.length);
    
    return allProducts;
  }, []); // Empty dependency array = siempre mismo resultado

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔎 Búsqueda realizada:', searchTerm);
  };

  return {
    categories: DEMO_CATEGORIES,
    tenantInfo: { nombre_empresa: "RestoBar Demo" },
    searchTerm,
    selectedCategory,
    filters,
    sortBy,
    showFilters,
    filteredProducts,
    loading: false,
    setSearchTerm,
    setSelectedCategory,
    setFilters,
    setSortBy,
    setShowFilters,
    handleSearch,
  };
}

// Exportar para debug si es necesario
export { DEMO_PRODUCTS, DEMO_CATEGORIES };