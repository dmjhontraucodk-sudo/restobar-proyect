// frontend/src/pages/dashboard/Finanzas/CajaPage.tsx - MEJORADA CON ESTADÍSTICAS

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCaja } from '@features/finance/model/useCaja';
import Modal from '@shared/ui/Modal/Modal';

// Importamos TUS iconos existentes
import { 
  PlusIcon, 
  LockIcon, 
  ClockIcon, 
  CurrencyDollarIcon
} from '@shared/ui/Icons'; 

// Definimos MinusIcon localmente
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ✨ Icono de Gráfico de Barras
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

// Componente Principal
const CajaPage = () => {
  const { cajaData, isLoading, estadisticasExtendidas, actions } = useCaja();
  
  // Estados para Modales
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  
  // Estado formulario
  const [formData, setFormData] = useState({
    monto: '',
    concepto: '',
    notas: '',
    tipo: 'EGRESO' as 'INGRESO' | 'EGRESO'
  });

  if (isLoading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
      <p className="text-gray-600 font-medium">Cargando caja...</p>
    </div>
  );

  // --- VISTA: CAJA CERRADA ---
  if (!cajaData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LockIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">La Caja está Cerrada</h2>
          <p className="text-gray-500 mb-8">Debes abrir un turno para comenzar a cobrar órdenes.</p>
          
          <button 
            onClick={() => setShowAbrirModal(true)}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors mb-4"
          >
            Abrir Caja
          </button>

          <Link 
            to="/dashboard/caja/historial" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline block mt-4 pt-4 border-t border-gray-100"
          >
            Ver Historial de Cierres Anteriores
          </Link>
        </div>

        {/* Modal Abrir Caja */}
        {showAbrirModal && (
          <Modal onClose={() => setShowAbrirModal(false)} title="Abrir Turno de Caja">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const success = await actions.abrirCaja(Number(formData.monto), formData.notas);
              if (success) {
                 setShowAbrirModal(false);
                 setFormData({ monto: '', concepto: '', notas: '', tipo: 'EGRESO' });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial (Fondo)</label>
                  <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.monto}
                        onChange={e => setFormData({...formData, monto: e.target.value})}
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea 
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    value={formData.notas}
                    onChange={e => setFormData({...formData, notas: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                   <button type="button" onClick={() => setShowAbrirModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                   <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Confirmar Apertura</button>
                </div>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // --- VISTA: CAJA ABIERTA ---
  const { caja, resumen } = cajaData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold text-gray-900">Gestión de Caja</h1>
             
             <Link 
               to="/dashboard/caja/historial" 
               className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors font-medium flex items-center gap-1"
             >
                📜 Ver Historial
             </Link>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <ClockIcon className="w-4 h-4" />
            Turno Abierto: {new Date(caja.fecha_apertura).toLocaleString()}
          </p>
        </div>
        <button 
          onClick={() => setShowCerrarModal(true)}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium border border-red-200 transition-colors"
        >
          Cerrar Caja
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Monto Inicial" amount={resumen.inicial} color="gray" />
        <StatCard title="Ingresos (Ventas)" amount={resumen.ingresos} color="green" />
        <StatCard title="Egresos (Gastos)" amount={resumen.egresos} color="red" />
        <StatCard title="Saldo en Caja (Teórico)" amount={resumen.saldo_teorico} color="blue" big />
      </div>

      {/* ✨ NUEVA SECCIÓN: Estadísticas por Método de Pago ✨ */}
      {estadisticasExtendidas && estadisticasExtendidas.por_metodo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <ChartBarIcon className="w-5 h-5 text-gray-500" />
            Desglose por Método de Pago
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {estadisticasExtendidas.por_metodo.map((stat) => (
              <div key={stat.metodo} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-600">{stat.metodo}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {stat.porcentaje.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">S/ {stat.total.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.cantidad} transacciones</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Total Transacciones</p>
              <p className="text-xl font-bold text-gray-900">{estadisticasExtendidas.total_transacciones}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Ticket Promedio</p>
              <p className="text-xl font-bold text-gray-900">S/ {estadisticasExtendidas.ticket_promedio.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
             <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
             Movimientos del Turno
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => { setFormData({...formData, tipo: 'INGRESO', monto: '', concepto: ''}); setShowMovimientoModal(true); }}
              className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 flex items-center gap-1 transition-colors"
            >
              <PlusIcon className="w-4 h-4" /> Ingreso
            </button>
            <button 
              onClick={() => { setFormData({...formData, tipo: 'EGRESO', monto: '', concepto: ''}); setShowMovimientoModal(true); }}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 flex items-center gap-1 transition-colors"
            >
              <MinusIcon className="w-4 h-4" /> Egreso
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {caja.movimientos.length === 0 ? (
                 <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sin movimientos registrados</td></tr>
              ) : (
                caja.movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(mov.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{mov.concepto}</td>
                    <td className="px-4 py-3 text-gray-500">{mov.metodo_pago}</td>
                    <td className={`px-4 py-3 text-right font-bold ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.tipo === 'INGRESO' ? '+' : '-'} S/ {Number(mov.monto).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Movimiento */}
      {showMovimientoModal && (
        <Modal onClose={() => setShowMovimientoModal(false)} title={`Registrar ${formData.tipo === 'INGRESO' ? 'Ingreso Extra' : 'Gasto/Retiro'}`}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const success = await actions.registrarMovimiento(formData.tipo, formData.concepto, Number(formData.monto), 'Efectivo', formData.notas);
            if(success) {
              setShowMovimientoModal(false);
              setFormData({ monto: '', concepto: '', notas: '', tipo: 'EGRESO' });
            }
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto</label>
                <input type="number" step="0.01" required className="w-full p-2 border rounded-lg mt-1" 
                  value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Concepto</label>
                <input type="text" required className="w-full p-2 border rounded-lg mt-1" placeholder={formData.tipo === 'INGRESO' ? 'Ej. Venta de caja vacía' : 'Ej. Compra de hielo'}
                  value={formData.concepto} onChange={e => setFormData({...formData, concepto: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowMovimientoModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                  <button type="submit" className={`px-6 py-2 text-white rounded-lg font-medium ${formData.tipo === 'INGRESO' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    Guardar
                  </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Cerrar Caja */}
      {showCerrarModal && (
        <Modal onClose={() => setShowCerrarModal(false)} title="Cerrar Caja">
          <form onSubmit={async (e) => {
            e.preventDefault();
            const success = await actions.cerrarCaja(Number(formData.monto), formData.notas);
            if(success) {
              setShowCerrarModal(false);
              setFormData({ monto: '', concepto: '', notas: '', tipo: 'EGRESO' });
            }
          }}>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">Saldo esperado en sistema:</p>
                <p className="text-2xl font-bold text-blue-900">S/ {resumen.saldo_teorico.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteo Físico (¿Cuánto dinero hay realmente?)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.monto}
                  onChange={e => setFormData({...formData, monto: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de Cierre</label>
                <textarea 
                   className="w-full p-2 border rounded-lg"
                   value={formData.notas}
                   onChange={e => setFormData({...formData, notas: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                 <button type="button" onClick={() => setShowCerrarModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                 <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                   Finalizar Turno
                 </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Componente auxiliar para las tarjetas
const StatCard = ({ title, amount, color, big = false }: any) => (
  <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${big ? 'border-l-8' : ''}`} 
       style={{ borderColor: color === 'gray' ? '#9CA3AF' : color === 'green' ? '#22C55E' : color === 'red' ? '#EF4444' : '#3B82F6' }}>
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <p className={`font-bold text-gray-900 ${big ? 'text-3xl' : 'text-xl'}`}>
      S/ {Number(amount).toFixed(2)}
    </p>
  </div>
);

export default CajaPage;