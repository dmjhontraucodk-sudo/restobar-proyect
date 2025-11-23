import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useDashboardApi } from '../../hooks/useDashboardApi';
import { 
  DollarSignIcon, 
  CheckCircleIcon, 
  TrendingDownIcon,
  ExclamationIcon // Asegúrate de importar este icono o XCircleIcon
} from '../icons'; 
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  empleadoId: number | null;
  onPaymentSuccess: () => void;
}

const PagarNominaModal: React.FC<Props> = ({ isOpen, onClose, empleadoId, onPaymentSuccess }) => {
  const { calcularPagoNomina, createGastoOperativo, getTiposGasto } = useDashboardApi();
  
  const [calculo, setCalculo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [tipoGastoSueldoId, setTipoGastoSueldoId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && empleadoId) {
      setLoading(true);
      
      const fetchCalculo = calcularPagoNomina(empleadoId);
      
      const fetchTipos = getTiposGasto().then(tipos => {
         const tipo = tipos.find(t => 
             t.nombre.toLowerCase().includes('sueldo') || 
             t.nombre.toLowerCase().includes('nomina') || 
             t.nombre.toLowerCase().includes('personal')
         );
         if (tipo) setTipoGastoSueldoId(tipo.id);
      });

      Promise.all([fetchCalculo, fetchTipos])
        .then(([data]) => setCalculo(data))
        .catch(err => toast.error("Error cargando datos"))
        .finally(() => setLoading(false));
    } else {
        setCalculo(null);
    }
  }, [isOpen, empleadoId]);

  const handlePagar = async (forzar: boolean = false) => {
    if (!calculo || !tipoGastoSueldoId) {
        toast.error("Falta configurar la categoría 'Sueldos'.");
        return;
    }

    // Doble confirmación si ya está pagado
    if (calculo.ya_pagado_mes_actual && !forzar) {
        if(!window.confirm("⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEste empleado YA RECIBIÓ un pago este mes.\n\n¿Estás 100% seguro de que quieres pagarle de nuevo (ej. un bono extra)?")) return;
    } else if (!window.confirm(`¿Confirmar pago de S/ ${calculo.total_pagar.toFixed(2)} a ${calculo.empleado}?`)) {
        return;
    }

    setProcessing(true);
    try {
        const descuentosIds = calculo.descuentos_detalle.map((d: any) => d.id);

        await createGastoOperativo({
            tipo_gasto_id: tipoGastoSueldoId,
            fecha: new Date().toISOString(),
            monto: calculo.total_pagar,
            descripcion: `Pago de Nómina: ${calculo.empleado} (Mes Actual)`,
            metodo_pago: 'Efectivo',
            // @ts-ignore
            descuentos_ids: descuentosIds 
        });

        toast.success("¡Pago registrado exitosamente!");
        onPaymentSuccess();
        onClose();
    } catch (error: any) {
        console.error(error);
        toast.error("Error al procesar pago");
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
           
           {/* 🛑 ALERTA SI YA SE PAGÓ */}
           {calculo.ya_pagado_mes_actual && (
               <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                   <div className="text-red-600 p-1 bg-white rounded-full shadow-sm">
                       <ExclamationIcon className="w-6 h-6" />
                   </div>
                   <div>
                       <h4 className="font-bold text-red-700">¡Pago duplicado detectado!</h4>
                       <p className="text-sm text-red-600 mt-1">
                           Este empleado ya tiene un pago registrado el día <strong>{new Date(calculo.ultimo_pago).toLocaleDateString()}</strong>.
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
                 <h3 className="text-xl font-bold text-blue-900">{calculo.empleado}</h3>
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

           <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
              
              {/* Botón condicional */}
              {calculo.ya_pagado_mes_actual ? (
                  <button 
                    onClick={() => handlePagar(true)} // Pasa 'true' para forzar
                    disabled={processing || !tipoGastoSueldoId}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm flex items-center gap-2"
                  >
                    {processing ? 'Procesando...' : 'Pagar de todas formas'}
                  </button>
              ) : (
                  <button 
                    onClick={() => handlePagar(false)} 
                    disabled={processing || !tipoGastoSueldoId}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center gap-2"
                  >
                    {processing ? 'Procesando...' : (
                        <><CheckCircleIcon className="w-5 h-5" /> Confirmar Pago</>
                    )}
                  </button>
              )}
           </div>
           
           {!tipoGastoSueldoId && (
               <p className="text-xs text-red-500 text-center">
                   ⚠️ Error: Falta categoría 'Sueldos' en configuración.
               </p>
           )}
        </div>
      ) : (
        <div className="p-6 text-center text-red-500">No se pudo cargar la información.</div>
      )}
    </Modal>
  );
};

export default PagarNominaModal;