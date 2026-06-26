import React from 'react';
import { TrashIcon } from '@shared/ui/Icons';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  itemName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">

        {/* Icono de advertencia */}
        <div className="flex flex-col items-center pt-8 px-6 pb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <TrashIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">
            ¿Eliminar plato?
          </h2>
          <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
            Estás a punto de eliminar{' '}
            <span className="font-semibold text-gray-800">"{itemName}"</span>.
            {' '}El plato desaparecerá del menú y del POS permanentemente.
          </p>
        </div>

        {/* Aviso */}
        <div className="mx-6 mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-amber-500 text-base mt-0.5">⚠</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            El historial de órdenes no se verá afectado. Si quieres ocultarlo temporalmente, usa el botón de desactivar.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Eliminando...
              </>
            ) : (
              <>
                <TrashIcon className="w-4 h-4" />
                Eliminar
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
