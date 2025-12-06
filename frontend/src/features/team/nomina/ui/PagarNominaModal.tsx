// frontend/src/features/team/nomina/ui/PagarNominaModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '@shared/ui';
import {
  DollarSignIcon,
  CheckCircleIcon,
  TrendingDownIcon,
  ExclamationIcon
} from '@shared/ui/Icons';
import toast from 'react-hot-toast';
import { useTeamManagement } from '@features/team/model/useTeamManagement';
import {
  type CalcularPagoResponse,
  type PagarNominaData,
  type pagos_metodo_pago, // ✅ Ahora este tipo existe
  PAGOS_METODO_PAGO_VALUES // ✅ Ahora esta constante existe
} from '@shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  empleadoId: number | null;
  onPaymentSuccess: () => void;
}

const PagarNominaModal: React.FC<Props> = ({ isOpen, onClose, empleadoId, onPaymentSuccess }) => {
  const { getDetallePagoEmpleado, pagarNomina } = useTeamManagement();

  const [calculo, setCalculo] = useState<CalcularPagoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [metodoPago, setMetodoPago] = useState<pagos_metodo_pago>(PAGOS_METODO_PAGO_VALUES.Efectivo);

  useEffect(() => {
    if (isOpen && empleadoId) {
      setLoading(true);
      setCalculo(null);
      
      getDetallePagoEmpleado(empleadoId)
        .then(data => {
            if (data) {
                setCalculo(data);
            } else {
                toast.error("No se pudo obtener el detalle de pago.");
                onClose();
            }
        })
        .catch((err) => {
            console.error(err);
            toast.error(err.message || "Error cargando datos de pago.");
            onClose();
        })
        .finally(() => setLoading(false));
    } else {
        setCalculo(null);
        setMetodoPago(PAGOS_METODO_PAGO_VALUES.Efectivo);
    }
  }, [isOpen, empleadoId, getDetallePagoEmpleado, onClose]);

  const handlePagar = async (forzar: boolean = false) => {
    if (!calculo || !empleadoId) {
        toast.error("Datos de pago incompletos o empleado no seleccionado.");
        return;
    }
    if (calculo.total_pagar <= 0) {
        toast.error("El monto a pagar es cero. No se puede procesar el pago.");
        return;
    }

    if (calculo.ya_pagado_mes_actual && !forzar) {
        if(!window.confirm("⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEste empleado YA RECIBIÓ un pago este mes.\n\n¿Estás 100% seguro de que quieres pagarle de nuevo (ej. un bono extra)?")) return;
    } else if (!forzar && !window.confirm(`¿Confirmar pago de S/ ${calculo.total_pagar.toFixed(2)} a ${calculo.empleado_nombre} por ${metodoPago}?`)) {
        return;
    }

    setProcessing(true);
    try {
        const data: PagarNominaData = {
            metodo_pago: metodoPago,
        };
        
        await pagarNomina(empleadoId, data);

        toast.success("¡Pago registrado exitosamente!");
        onPaymentSuccess();
        onClose();
    } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Error al procesar pago");
    } finally {
        setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} title="Procesar Pago de Nómina">
      {loading ? (
         <div className="p-8 text-center text-gray-500">Calculando liquidación...</div>
      ) : calculo ? (
        <div className="space-y-6"> 
           
           {calculo.ya_pagado_mes_actual && (
               <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                   <div className="text-red-600 p-1 bg-white rounded-full shadow-sm">
                       <ExclamationIcon className="w-6 h-6" />
                   </div>
                   <div>
                       <h4 className="font-bold text-red-700">¡Pago duplicado detectado!</h4>
                       <p className="text-sm text-red-600 mt-1">
                           Este empleado ya tiene un pago registrado el día{" "}
                           <strong>{calculo.ultimo_pago ? new Date(calculo.ultimo_pago).toLocaleDateString() : 'Fecha desconocida'}</strong>.
                       </p>
                   </div>
               </div>
           )}

           <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                 <DollarSignIcon className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-blue-800 font-medium">Empleado</p>
                 <h3 className="text-xl font-bold text-blue-900">{calculo.empleado_nombre}</h3>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex justify-between items-center text-gray-600">
                 <span>Sueldo Base</span>
                 <span className="font-medium">S/ {calculo.sueldo_base.toFixed(2)}</span>
              </div>
              
              {calculo.total_descuentos > 0 && (
                 <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="flex justify-between items-center text-red-700 font-medium mb-2 border-b border-red-200 pb-2">
                        <span className="flex items-center gap-2"><TrendingDownIcon className="w-4 h-4"/> Descuentos</span>
                        <span>- S/ {calculo.total_descuentos.toFixed(2)}</span>
                    </div>
                    <ul className="space-y-1">
                        {calculo.descuentos_detalle.map((d: any) => (
                            <li key={d.id} className="flex justify-between text-xs text-red-600">
                                <span>• {d.motivo}</span>
                                <span>- S/ {Number(d.monto).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                 </div>
              )}
              
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-lg font-bold text-gray-900">
                 <span>Total a Pagar (Neto)</span>
                 <span>S/ {calculo.total_pagar.toFixed(2)}</span>
              </div>
           </div>

           {/* Selector de Método de Pago */}
           <div className="mt-4">
                <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                <select
                    id="metodoPago"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as pagos_metodo_pago)}
                >
                    <option value={PAGOS_METODO_PAGO_VALUES.Efectivo}>Efectivo</option>
                    <option value={PAGOS_METODO_PAGO_VALUES.Tarjeta}>Tarjeta</option>
                    <option value={PAGOS_METODO_PAGO_VALUES.Transferencia}>Transferencia</option>
                    <option value={PAGOS_METODO_PAGO_VALUES.Otro}>Otro</option>
                </select>
           </div>

           <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
              
              {calculo.ya_pagado_mes_actual ? (
                  <button 
                    onClick={() => handlePagar(true)}
                    disabled={processing}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm flex items-center gap-2"
                  >
                    {processing ? 'Procesando...' : 'Pagar de todas formas'}
                  </button>
              ) : (
                  <button 
                    onClick={() => handlePagar(false)} 
                    disabled={processing}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center gap-2"
                  >
                    {processing ? 'Procesando...' : (
                        <><CheckCircleIcon className="w-5 h-5" /> Confirmar Pago</>
                    )}
                  </button>
              )}
           </div>
        </div>
      ) : (
        <div className="p-6 text-center text-red-500">No se pudo cargar la información.</div>
      )}
    </Modal>
  );
};

export default PagarNominaModal;