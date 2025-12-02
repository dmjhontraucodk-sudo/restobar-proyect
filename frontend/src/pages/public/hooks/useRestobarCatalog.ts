// src/pages/public/hooks/useRestobarCatalog.ts
import { useState, useEffect } from 'react';
import { useWebApi } from '../../../hooks/useWebApi';
import type { CategoriaMenu } from '../../../types';


export const useRestobarCatalog = () => {
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

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
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
  };

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

  return {
    // Estado
    categories,
    tenantInfo,
    searchTerm,
    selectedCategory,
    filters,
    sortBy,
    showFilters,
    loading,
    filteredProducts,
    
    // Setters
    setSearchTerm,
    setSelectedCategory,
    setFilters,
    setSortBy,
    setShowFilters,
    
    // Funciones
    handleSearch,
    loadCatalog,
  };
};