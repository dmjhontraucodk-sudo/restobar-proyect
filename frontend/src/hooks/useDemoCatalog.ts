// src/hooks/useDemoCatalog.ts
import { useState, useMemo } from 'react';
import type { Producto, CategoriaMenu } from '../types';

// Datos de ejemplo para el demo
const demoCategories: CategoriaMenu[] = [
  {
    id: 1,
    nombre: "Entradas",
    descripcion: "Para empezar con buen sabor",
    productos: [
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
      }
    ]
  },
  {
    id: 2,
    nombre: "Platos Principales",
    descripcion: "Nuestras especialidades",
    productos: [
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
      }
    ]
  },
  {
    id: 3,
    nombre: "Bebidas",
    descripcion: "Para acompañar tu comida",
    productos: [
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
    ]
  }
];

interface Filters {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  spicy: boolean;
}

export function useDemoCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    spicy: false
  });
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'name'>('popular');
  const [showFilters, setShowFilters] = useState(false);

  const categories = demoCategories;
  const tenantInfo = { nombre_empresa: "RestoBar Demo" };

  // Combinar todos los productos
  const allProducts = useMemo(() => {
    return categories.flatMap(category => category.productos);
  }, [categories]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoria_id === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros
    if (filters.vegetarian) {
      filtered = filtered.filter(product => product.es_vegetariano);
    }
    if (filters.vegan) {
      filtered = filtered.filter(product => product.es_vegano);
    }
    if (filters.glutenFree) {
      filtered = filtered.filter(product => product.sin_gluten);
    }
    if (filters.spicy) {
      filtered = filtered.filter(product => product.es_picante);
    }

    // Ordenar
    switch (sortBy) {
      case 'price-asc':
        filtered = [...filtered].sort((a, b) => a.precio - b.precio);
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'popular':
      default:
        filtered = [...filtered].sort((a, b) => {
          if (a.es_recomendado && !b.es_recomendado) return -1;
          if (!a.es_recomendado && b.es_recomendado) return 1;
          return 0;
        });
        break;
    }

    return filtered;
  }, [allProducts, selectedCategory, searchTerm, filters, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return {
    categories,
    tenantInfo,
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