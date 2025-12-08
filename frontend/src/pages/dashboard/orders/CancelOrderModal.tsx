import React, { useState } from 'react';
import { Modal } from '@shared/ui';
import { ExclamationCircleIcon } from "@shared/ui/Icons"; // Icono de advertencia

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isProcessing: boolean;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ isOpen, onClose, onConfirm, isProcessing }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            alert('Por favor, ingresa un motivo para la cancelación.');
            return;
        }
        onConfirm(reason);
    };

    if (!isOpen) return null;

    return (
        <Modal onClose={onClose} title="Confirmar Cancelación de Pedido">
            <div className="p-4 space-y-4">
                <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <ExclamationCircleIcon className="w-6 h-6 flex-shrink-0" />
                    <p className="text-sm font-medium">Esta acción no se puede deshacer y revertirá el stock de productos cerrados.</p>
                </div>
                
                <div>
                    <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo de la cancelación <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="cancelReason"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ej. Cliente no responde, falta de stock de producto, error del cliente..."
                        disabled={isProcessing}
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        Volver
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                    >
                        {isProcessing && (
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        Confirmar Cancelación
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CancelOrderModal;