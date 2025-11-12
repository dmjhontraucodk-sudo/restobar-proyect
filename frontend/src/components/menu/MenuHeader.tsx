// src/components/menu/MenuHeader.tsx
import React from 'react';
import { PlusIcon, SearchIcon, RotateCcwIcon } from '../icons';
import { type Category } from '../../types';

// --- INTERFAZ ACTUALIZADA ---
interface MenuHeaderProps {
  title: string; // Título dinámico (ej. "Gestión de Menú")
  description: string; // Descripción dinámica
  onAddCategory: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  availabilityFilter: string;
  onAvailabilityChange: (value: string) => void;
  categories: Category[];
  inactiveItemsCount: number;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({
  title,
  description,
  onAddCategory,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availabilityFilter,
  onAvailabilityChange,
  categories,
  inactiveItemsCount,
  onClearFilters,
  hasActiveFilters
}) => {
  return (
    <>
      {/* Cabecera */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-500 text-sm mt-1">{description}</p>
            </div>
            <button 
              onClick={onAddCategory} 
              className="flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Añadir Categoría
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar platos..." 
                  value={searchTerm} 
                  onChange={(e) => onSearchChange(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={selectedCategory} 
                onChange={(e) => onCategoryChange(e.target.value)} 
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select 
                value={availabilityFilter} 
                onChange={(e) => onAvailabilityChange(e.target.value)} 
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="active">Activos</option>
                <option value="inactive">Desactivados ({inactiveItemsCount})</option>
                <option value="all">Todos</option>
              </select>
              {hasActiveFilters && (
                <button 
                  onClick={onClearFilters} 
                  className="flex items-center px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium whitespace-nowrap"
                >
                  <RotateCcwIcon className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuHeader;