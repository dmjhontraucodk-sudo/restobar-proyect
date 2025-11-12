import React from 'react';
import Modal from '../ui/Modal';
import { PlusIcon, XIcon, BookOpenIcon, ImageIcon, UploadIcon } from '../icons';
import { type Category, type RecetaItemUI } from '../../types';
import { type Insumo } from '../../hooks/useDashboardApi';

interface AddPlatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  isUploading: boolean; // ✨ NUEVO PROP PARA ESTADO DE SUBIDA
  editingCategory: Category | null;
  itemName: string;
  onItemNameChange: (value: string) => void;
  itemPrice: number;
  onItemPriceChange: (value: number) => void;
  itemDescription: string;
  onItemDescriptionChange: (value: string) => void;
  itemImagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  currentReceta: RecetaItemUI[];
  insumoSearch: string;
  onInsumoSearchChange: (value: string) => void;
  insumoCantidad: string;
  onInsumoCantidadChange: (value: string) => void;
  onAddInsumoToReceta: () => void;
  onRemoveInsumo: (insumoId: number) => void;
  allInsumos: Insumo[];
  isLoadingInsumos: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const AddPlatoModal: React.FC<AddPlatoModalProps> = ({
  isOpen,
  onClose,
  isEditing,
  isUploading, // ✨ RECIBIR ESTADO DE SUBIDA
  editingCategory,
  itemName,
  onItemNameChange,
  itemPrice,
  onItemPriceChange,
  itemDescription,
  onItemDescriptionChange,
  itemImagePreview,
  onImageChange,
  onRemoveImage,
  currentReceta,
  insumoSearch,
  onInsumoSearchChange,
  insumoCantidad,
  onInsumoCantidadChange,
  onAddInsumoToReceta,
  onRemoveInsumo,
  allInsumos,
  isLoadingInsumos,
  isSubmitting,
  onSubmit
}) => {
  if (!isOpen || !editingCategory) return null;

  const modalTitle = isEditing 
    ? `Editar Plato: ${itemName || '...'}` 
    : `Añadir Plato a: ${editingCategory.name}`;
  
  let submitButtonText = isEditing ? "Actualizar Plato" : "Guardar Plato";
  
  if (isUploading) {
    submitButtonText = "Subiendo imagen...";
  } else if (isSubmitting) {
    submitButtonText = isEditing ? "Actualizando..." : "Guardando...";
  }

  return (
    <Modal title={modalTitle} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Plato <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="itemName" 
              value={itemName} 
              onChange={(e) => onItemNameChange(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              placeholder="Ej. Lomo Saltado" 
              disabled={isUploading || isSubmitting}
              required 
            />
          </div>
          <div>
            <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Precio <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              id="itemPrice" 
              value={itemPrice} 
              min="0" 
              step="0.01" 
              onChange={(e) => onItemPriceChange(parseFloat(e.target.value))} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              disabled={isUploading || isSubmitting}
              required 
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea 
            id="itemDescription" 
            value={itemDescription} 
            onChange={(e) => onItemDescriptionChange(e.target.value)} 
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none" 
            rows={3} 
            placeholder="Describe los ingredientes y características del plato..." 
            disabled={isUploading || isSubmitting}
            required 
          />
        </div>

        {/* Constructor de Recetas */}
        <div className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Receta (Ingredientes del Inventario) <span className="text-red-500">*</span>
            </h3>
          </div>

          {isLoadingInsumos ? (
            <div className="text-sm text-gray-500">Cargando insumos...</div>
          ) : allInsumos.length === 0 ? (
            <div className="text-sm text-red-500">No hay insumos en tu inventario. Ve a la sección "Inventario" para añadirlos.</div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="insumoSearch" className="block text-sm font-medium text-gray-700 mb-1">Buscar Insumo</label>
                <input 
                  type="text"
                  id="insumoSearch"
                  list="insumos-list"
                  value={insumoSearch}
                  onChange={(e) => onInsumoSearchChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Escribe para buscar..."
                  disabled={isUploading || isSubmitting}
                />
                <datalist id="insumos-list">
                  {allInsumos.map(insumo => (
                    <option key={insumo.id} value={insumo.nombre} />
                  ))}
                </datalist>
              </div>
              <div className="w-full sm:w-32">
                <label htmlFor="insumoCantidad" className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input 
                  type="number"
                  id="insumoCantidad"
                  value={insumoCantidad}
                  onChange={(e) => onInsumoCantidadChange(e.target.value)}
                  min="0"
                  step="0.001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={isUploading || isSubmitting}
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-transparent mb-1">Añadir</label>
                <button
                  type="button"
                  onClick={onAddInsumoToReceta}
                  disabled={isUploading || isSubmitting}
                  className="w-full px-5 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
                >
                  Añadir
                </button>
              </div>
            </div>
          )}
        
          {currentReceta.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Ingredientes añadidos:</h4>
              <ul className="divide-y divide-gray-100 border rounded-lg max-h-40 overflow-y-auto">
                {currentReceta.map(item => (
                  <li key={item.insumoId} className="flex justify-between items-center p-3 bg-white">
                    <div>
                      <span className="font-medium text-gray-800">{item.nombre}</span>
                      <span className="text-gray-500 text-sm"> ({item.unidad})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{item.cantidad}</span>
                      <button 
                        type="button" 
                        title="Quitar"
                        disabled={isUploading || isSubmitting}
                        onClick={() => onRemoveInsumo(item.insumoId)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ✨ SUBIDA DE IMAGEN MEJORADA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen del Plato
          </label>
          
          {itemImagePreview ? (
            <div className="relative w-32 h-32 mx-auto">
              <img 
                src={itemImagePreview} 
                alt="Vista previa" 
                className="w-32 h-32 rounded-lg object-cover border-2 border-gray-300"
              />
              {/* ✨ INDICADOR DE SUBIDA */}
              {isUploading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={isUploading || isSubmitting}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'} transition-colors duration-200`}>
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-3">
                {isUploading ? "Subiendo imagen..." : "Arrastra una imagen o haz clic para seleccionar"}
              </p>
              <input
                type="file"
                id="itemImage"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
                disabled={isUploading || isSubmitting}
              />
              <label
                htmlFor="itemImage"
                className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors duration-200 ${isUploading || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 cursor-pointer'}`}
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                {isUploading ? "Subiendo..." : "Seleccionar Imagen"}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Formatos: JPG, PNG, WEBP • Máx. 10MB
              </p>
            </div>
          )}
        </div>

        {/* Información Adicional */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            {isEditing ? "Actualizando Plato" : "Información del Plato"}
          </h3>
          <p className="text-xs text-blue-600">
            • La categoría <strong>"{editingCategory.name}"</strong> se usará para este plato.<br/>
            • Debes añadir al menos <span className="font-bold">un ingrediente</span> a la receta.
          </p>
        </div>

        {/* Botones de Guardar */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting || isUploading}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium disabled:opacity-50 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || isLoadingInsumos || isUploading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
          >
            {(isSubmitting || isUploading) ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <PlusIcon className="w-4 h-4 mr-2 inline" />
            )}
            {submitButtonText}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPlatoModal;