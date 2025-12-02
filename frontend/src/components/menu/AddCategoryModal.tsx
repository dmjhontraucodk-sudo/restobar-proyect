// components/menu/AddCategoryModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { PlusIcon } from '../icons';
import { addCategorySchema } from '../../schemas/menu.schema';
import type { ZodIssue } from 'zod';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  onCategoryNameChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  onCategoryNameChange,
  isSubmitting,
  onSubmit
}) => {
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationResult = addCategorySchema.safeParse({ categoryName });

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
  
  if (!isOpen) return null;

  return (
    <Modal title="Nueva Categoría" onClose={onClose}>
      <form onSubmit={handleLocalSubmit} className="space-y-4">
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la categoría
          </label>
          <input 
            type="text" 
            id="categoryName" 
            value={categoryName} 
            onChange={(e) => {
                onCategoryNameChange(e.target.value)
                if (formErrors.categoryName) setFormErrors(prev => ({ ...prev, categoryName: undefined }));
            }} 
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${formErrors.categoryName ? 'border-red-500' : 'border-gray-300'}`} 
            placeholder="Ej. Entradas, Platos Principales, Postres..." 
            autoFocus 
            disabled={isSubmitting}
          />
          {formErrors.categoryName && <p className="text-red-500 text-xs mt-1">{formErrors.categoryName}</p>}
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <PlusIcon className="w-4 h-4 mr-2 inline" />
            )}
            {isSubmitting ? "Guardando..." : "Guardar Categoría"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCategoryModal;