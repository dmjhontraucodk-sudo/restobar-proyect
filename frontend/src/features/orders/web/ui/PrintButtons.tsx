// frontend/src/features/orders/web/ui/PrintButtons.tsx
import React from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@app/providers/AuthProvider';
import { PrinterIcon, ReceiptIcon } from '@shared/ui/Icons';
import type { ApiWebPedido } from '@shared/types';

const API_BASE = "/api/dashboard";

interface PrintButtonsProps {
    order: ApiWebPedido;
}

export const PrintButtons: React.FC<PrintButtonsProps> = ({ order }) => {
    const { currentTenant } = useAuth();

    const handlePrint = async (type: 'boleta' | 'factura' | 'contra-entrega') => {
        const toastId = toast.loading(`Generando ${type}...`);
        
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                toast.error("Error de autenticación.", { id: toastId });
                return;
            }

            const headers = new Headers();
            headers.append("Authorization", `Bearer ${token}`);
            if (currentTenant) {
                headers.append("X-Tenant-Subdomain", currentTenant);
            }

            const response = await fetch(`${API_BASE}/web-orders/${order.id}/print/${type}`, {
                method: 'POST',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.statusText}`);
            }

            const blob = await response.blob();
            const pdfUrl = URL.createObjectURL(blob);
            
            toast.success('Documento generado. Abriendo...', { id: toastId });
            window.open(pdfUrl, '_blank');
            
        } catch (err: any) {
            toast.error(err.message || `Error al generar ${type}`, { id: toastId });
        }
    };

    if (order.estado !== 'Entregado') return null;

    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-1.5">
                <PrinterIcon className="w-4 h-4" />
                Imprimir Documentos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button 
                    onClick={() => handlePrint('boleta')}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-all"
                >
                    <ReceiptIcon className="w-4 h-4 text-blue-500" />
                    Boleta
                </button>
                <button 
                    onClick={() => handlePrint('factura')}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-all"
                >
                    <ReceiptIcon className="w-4 h-4 text-green-500" />
                    Factura
                </button>
                {order.tipo_pedido === 'EntregaDomicilio' && (
                     <button 
                        onClick={() => handlePrint('contra-entrega')}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-all"
                    >
                        <ReceiptIcon className="w-4 h-4 text-orange-500" />
                        Contra Entrega
                    </button>
                )}
            </div>
        </div>
    );
};
