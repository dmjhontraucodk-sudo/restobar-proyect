// src/features/menu/products/ui/ProductsTable.tsx
import React from 'react';
import { EditIcon, TrashIcon, EyeIcon, EyeOffIcon, ArchiveIcon, RotateCcwIcon } from '@shared/ui/Icons';
import type { MenuItem } from '@shared/types';

interface ProductsTableProps {
  items: MenuItem[];
  onToggleItemStatus: (itemId: string) => void;
  onToggleWebVisibility: (itemId: string) => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  items,
  onToggleItemStatus,
  onToggleWebVisibility,
  onEditItem,
  onDeleteItem
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Contenedor con scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-4 text-left font-medium text-gray-600 text-sm uppercase tracking-wide border-b border-gray-200 w-64">
                Plato
              </th>
              <th className="py-4 px-4 text-left font-medium text-gray-600 text-sm uppercase tracking-wide hidden lg:table-cell border-b border-gray-200 w-80">
                Descripción
              </th>
              <th className="py-4 px-4 text-left font-medium text-gray-600 text-sm uppercase tracking-wide border-b border-gray-200 w-24">
                Precio
              </th>
              <th className="py-4 px-4 text-left font-medium text-gray-600 text-sm uppercase tracking-wide border-b border-gray-200 w-32">
                Estado
              </th>
              <th className="py-4 px-4 text-right font-medium text-gray-600 text-sm uppercase tracking-wide border-b border-gray-200 w-32">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-gray-50 transition-colors duration-200 ${
                  !item.disponible ? 'bg-red-50/30' : ''
                }`}
              >
                {/* Columna Plato */}
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={item.foto_url || 'https://via.placeholder.com/80x80.png?text=Sin+Imagen'} 
                      alt={item.name} 
                      className={`w-10 h-10 rounded-lg object-cover flex-shrink-0 ${
                        !item.disponible ? 'opacity-50 grayscale' : ''
                      }`} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium text-gray-900 text-sm truncate ${
                          !item.disponible ? 'text-gray-500' : ''
                        }`}>
                          {item.name}
                        </h3>
                        {!item.disponible && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded flex-shrink-0">
                            Desactivado
                          </span>
                        )}
                      </div>
                      <p className={`text-xs text-gray-500 truncate lg:hidden mt-1 ${
                        !item.disponible ? 'text-gray-400' : ''
                      }`}>
                        {item.description}
                      </p>
                      {/* Precio en móvil */}
                      <div className="lg:hidden mt-1">
                        <span className={`font-semibold text-gray-900 text-sm ${
                          !item.disponible ? 'text-gray-400' : ''
                        }`}>
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* Columna Descripción (solo desktop) */}
                <td className="py-4 px-4 hidden lg:table-cell">
                  <p className={`text-gray-600 text-sm line-clamp-2 ${
                    !item.disponible ? 'text-gray-400' : ''
                  }`}>
                    {item.description}
                  </p>
                </td>
                
                {/* Columna Precio (solo desktop) */}
                <td className="py-4 px-4 hidden lg:table-cell">
                  <span className={`font-semibold text-gray-900 ${
                    !item.disponible ? 'text-gray-400' : ''
                  }`}>
                    ${item.price.toFixed(2)}
                  </span>
                </td>
                
                {/* Columna Estado */}
                <td className="py-4 px-4">
                  <div className="flex flex-col space-y-1 text-xs">
                    <span className={`inline-flex items-center ${
                      item.disponible ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-1 flex-shrink-0 ${
                        item.disponible ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      {item.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                    <span className={`inline-flex items-center ${
                      !item.disponible 
                        ? 'text-gray-400' 
                        : item.visible_en_web 
                          ? 'text-blue-600' 
                          : 'text-gray-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-1 flex-shrink-0 ${
                        !item.disponible 
                          ? 'bg-gray-400' 
                          : item.visible_en_web 
                            ? 'bg-blue-500' 
                            : 'bg-gray-400'
                      }`}></div>
                      {item.visible_en_web ? 'Visible web' : 'Oculto web'}
                    </span>
                  </div>
                </td>
                
                {/* Columna Acciones */}
                <td className="py-4 px-4">
                  <div className="flex justify-end space-x-1">
                    {/* Botón Activar/Desactivar */}
                    <button 
                      onClick={() => onToggleItemStatus(item.id)} 
                      className={`p-1.5 rounded-lg transition-colors duration-200 ${
                        item.disponible 
                          ? 'text-orange-600 hover:bg-orange-50 hover:text-orange-700' 
                          : 'text-green-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                      title={item.disponible ? 'Desactivar plato' : 'Activar plato'}
                    >
                      {item.disponible ? (
                        <ArchiveIcon className="w-4 h-4" />
                      ) : (
                        <RotateCcwIcon className="w-4 h-4" />
                      )}
                    </button>

                    {/* Botón Visibilidad Web */}
                    <button 
                      onClick={() => onToggleWebVisibility(item.id)} 
                      disabled={!item.disponible}
                      className={`p-1.5 rounded-lg transition-colors duration-200 ${
                        !item.disponible 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : item.visible_en_web 
                            ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                      title={item.visible_en_web ? 'Ocultar en web' : 'Mostrar en web'}
                    >
                      {item.visible_en_web ? (
                        <EyeIcon className="w-4 h-4" />
                      ) : (
                        <EyeOffIcon className="w-4 h-4" />
                      )}
                    </button>

                    {/* Botón Editar */}
                    <button 
                      onClick={() => onEditItem(item)} 
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Editar plato"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>

                    {/* Botón Eliminar */}
                    <button 
                      onClick={() => onDeleteItem(item)} 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Borrar plato"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No hay productos</p>
          <p className="text-gray-400 text-sm mt-1">Agrega nuevos platos para comenzar</p>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
