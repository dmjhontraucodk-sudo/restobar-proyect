// src/features/menu/products/ui/AddPlatoModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal } from '@shared/ui';
import { PlusIcon, XIcon, ImageIcon, UploadIcon } from '@shared/ui/Icons';
import { type Category } from '@shared/types';
import { addPlatoSchema } from '../../model/schemas';
import type { ZodIssue } from 'zod';

// ✅ DEFINIMOS EL TIPO DE DATO PARA EL INSUMO AQUÍ (Para evitar errores si no está en types)
export interface InsumoOption {
  id: number;
  nombre: string;
  stock_actual: number;
  unidad_medida?: { abreviatura: string };
}

interface AddPlatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  isUploading: boolean;
  editingCategory: Category | null;
  
  itemName: string;
  onItemNameChange: (value: string) => void;
  
  itemPrice: number;
  onItemPriceChange: (value: number) => void;
  
  itemDescription: string;
  onItemDescriptionChange: (value: string) => void;

  // ✅ NUEVOS PROPS PARA VINCULACIÓN DE INVENTARIO
  insumos: InsumoOption[];
  selectedInsumoId: number | null;
  onInsumoChange: (id: number | null) => void;

  itemImagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const AddPlatoModal: React.FC<AddPlatoModalProps> = ({
  isOpen,
  onClose,
  isEditing,
  isUploading,
  editingCategory,
  itemName,
  onItemNameChange,
  itemPrice,
  onItemPriceChange,
  itemDescription,
  onItemDescriptionChange,
  
  // ✅ DESESTRUCTURAMOS LOS NUEVOS PROPS
  insumos,
  selectedInsumoId,
  onInsumoChange,

  itemImagePreview,
  onImageChange,
  onRemoveImage,
  isSubmitting,
  onSubmit
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [itemImagePreview]);

  useEffect(() => {
    if (!isOpen) {
      setImageError(false);
      setImageLoaded(false);
      setFormErrors({});
    }
  }, [isOpen]);

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationResult = addPlatoSchema.safeParse({
        itemName,
        itemPrice,
        itemDescription,
        selectedInsumoId,
    });

    if (!validationResult.success) {
        const issues = validationResult.error.issues;
        const newErrors: Record<string, string> = {};
        issues.forEach((issue: ZodIssue) => {
            const path = issue.path[0];
            if (typeof path === 'string') {
                newErrors[path] = issue.message;
            }
        });
        setFormErrors(newErrors);
        return;
    }

    setFormErrors({});
    onSubmit(e);
  };
  
  const formatPriceForInput = (price: number): string => {
    if (price === 0) return '';
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };
  
  const handlePriceChange = (value: string) => {
    if (formErrors.itemPrice) setFormErrors(prev => ({ ...prev, itemPrice: undefined }));
    if (value === '') {
      onItemPriceChange(0);
      return;
    }
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    const numericValue = parseFloat(cleanValue);
    if (!isNaN(numericValue) && numericValue >= 0) {
      onItemPriceChange(numericValue);
    }
  };
  
  const handlePriceBlur = () => {
    if (itemPrice > 0) {
      const formattedPrice = parseFloat(itemPrice.toFixed(2));
      onItemPriceChange(formattedPrice);
    }
  };
  
  const handleImageError = () => {
    console.warn('Error cargando imagen preview:', itemImagePreview);
    setImageError(true);
    setImageLoaded(false);
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(false);
    setImageLoaded(false);
    onImageChange(e);
  };
  
  const handleRemoveImageSafe = () => {
    setImageError(false);
    setImageLoaded(false);
    onRemoveImage();
  };

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

  const showPreview = !!(itemImagePreview && !imageError);

  return (
    <Modal title={modalTitle} onClose={onClose}>
      <form onSubmit={handleLocalSubmit} className="space-y-6">
        
        {/* Nombre y Precio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Plato <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="itemName" 
              value={itemName} 
              onChange={(e) => {
                onItemNameChange(e.target.value)
                if (formErrors.itemName) setFormErrors(prev => ({ ...prev, itemName: undefined }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${formErrors.itemName ? 'border-red-500' : 'border-gray-300'}`} 
              placeholder="Ej. Lomo Saltado" 
              disabled={isUploading || isSubmitting}
              required 
            />
            {formErrors.itemName && <p className="text-red-500 text-xs mt-1">{formErrors.itemName}</p>}
          </div>

          <div>
            <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Precio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                S/
              </span>
              <input 
                type="text" 
                id="itemPrice" 
                value={formatPriceForInput(itemPrice)} 
                onChange={(e) => handlePriceChange(e.target.value)}
                onBlur={handlePriceBlur}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${formErrors.itemPrice ? 'border-red-500' : 'border-gray-300'}`} 
                placeholder="0.00"
                disabled={isUploading || isSubmitting}
                required 
              />
            </div>
            {formErrors.itemPrice && <p className="text-red-500 text-xs mt-1">{formErrors.itemPrice}</p>}
          </div>
        </div>
        
        {/* Descripción */}
        <div>
          <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea 
            id="itemDescription" 
            value={itemDescription} 
            onChange={(e) => {
                onItemDescriptionChange(e.target.value)
                if (formErrors.itemDescription) setFormErrors(prev => ({ ...prev, itemDescription: undefined }));
            }} 
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${formErrors.itemDescription ? 'border-red-500' : 'border-gray-300'}`} 
            rows={3} 
            placeholder="Describe los ingredientes y características del plato..." 
            disabled={isUploading || isSubmitting}
            required 
          />
          {formErrors.itemDescription && <p className="text-red-500 text-xs mt-1">{formErrors.itemDescription}</p>}
        </div>

        {/* ✅ SECCIÓN DE VINCULACIÓN CON INVENTARIO (NUEVO) */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label htmlFor="inventoryLink" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Vincular con Inventario 
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Opcional</span>
          </label>
          
          <p className="text-xs text-gray-500 mb-3">
            Si seleccionas un producto, se descontará <strong>1 unidad</strong> automáticamente del stock al realizar una venta.
          </p>

          <select
            id="inventoryLink"
            value={selectedInsumoId || ""}
            onChange={(e) => onInsumoChange(e.target.value ? Number(e.target.value) : null)}
            disabled={isUploading || isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
          >
            <option value="">-- Sin vincular (Solo Venta) --</option>
            {insumos.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>
                📦 {insumo.nombre} (Stock: {Number(insumo.stock_actual).toFixed(0)} {insumo.unidad_medida?.abreviatura})
              </option>
            ))}
          </select>
        </div>

        {/* Sección de Imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen del Plato
          </label>
          
          {showPreview && (
            <div className="relative w-32 h-32 mx-auto">
              <div className={`w-32 h-32 rounded-lg border-2 border-gray-300 overflow-hidden ${imageLoaded ? '' : 'bg-gray-100'}`}>
                <img 
                  key={itemImagePreview}
                  src={itemImagePreview} 
                  alt="Vista previa" 
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              </div>
              
              {isUploading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
          
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveImageSafe}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                  disabled={isSubmitting}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          
          {!showPreview && (
            <div className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'} transition-colors duration-200`}>
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-3">
                {isUploading ? "Subiendo imagen..." : "Arrastra una imagen o haz clic para seleccionar"}
              </p>
              <input
                type="file"
                id="itemImage"
                accept="image/*"
                onChange={handleFileChange}
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
            • Completa todos los campos obligatorios (*) para guardar el plato.
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
            disabled={isSubmitting || isUploading}
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
