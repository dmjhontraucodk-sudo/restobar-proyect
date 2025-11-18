// src/components/menu/CategorySection.tsx - VERSIÓN MEJORADA
import React from 'react';
import { PlusIcon, ArchiveIcon } from '../icons';
import ProductsTable from './ProductsTable';
import { type Category, type MenuItem } from '../../types';

interface CategorySectionProps {
  category: Category;
  onAddItem: (category: Category) => void;
  onToggleItemStatus: (itemId: string) => void;
  onToggleWebVisibility: (itemId: string) => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  category, 
  onAddItem,
  onToggleItemStatus,
  onToggleWebVisibility,
  onEditItem,
  onDeleteItem
}) => {
  // ✅ VALIDACIÓN DEFENSIVA: Si la categoría no existe o está incompleta
  if (!category || !category.name) {
    console.error('CategorySection: categoría inválida', category);
    return null;
  }

  // ✅ NORMALIZAR: Asegurar que items siempre sea un array
  const items = Array.isArray(category.items) ? category.items : [];
  const itemCount = items.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Encabezado de la Categoría */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center">
            <div className="w-2 h-8 bg-blue-600 rounded-full mr-3"></div>
            <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
            <span className="ml-3 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {itemCount} {itemCount === 1 ? 'plato' : 'platos'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onAddItem(category)} 
              className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
            >
              <PlusIcon className="w-3 h-3 mr-1.5" />
              Añadir Plato
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido */}
      {itemCount === 0 ? (
        // Estado vacío (categoría sin platos)
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 mb-3">
            <ArchiveIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No hay platos en esta categoría
          </h3>
          <p className="text-gray-500 mb-4">
            Comienza añadiendo el primer plato a "{category.name}".
          </p>
          <button 
            onClick={() => onAddItem(category)} 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Añadir Plato
          </button>
        </div>
      ) : (
        // Tabla de productos
        <div className="overflow-x-auto">
          <ProductsTable 
            items={items}
            onToggleItemStatus={onToggleItemStatus}
            onToggleWebVisibility={onToggleWebVisibility}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
          />
        </div>
      )}
    </div>
  );
};

export default CategorySection;