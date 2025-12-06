// src/features/reservations/ui/ReservationFormDemo.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader as Header } from '@widgets/public-header';
import { PublicFooter as Footer } from '@widgets/public-footer';
import toast from 'react-hot-toast';

// Iconos para la demo
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const EnvelopeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const TableIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

interface MesaDemo {
  id: number;
  nombre_o_numero: string;
  capacidad: number;
  disponible: boolean;
}

export default function ReservationFormDemo() {
  //const navigate = useNavigate();
  
  // Estado del formulario DEMO
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    fecha_hora: '',
    cantidad_personas: 2,
    notas: '',
    mesa_id: null as number | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mostrarSelectorMesas, setMostrarSelectorMesas] = useState(false);

  // Datos DEMO de mesas
  const [availableMesas] = useState<MesaDemo[]>([
    { id: 1, nombre_o_numero: "01", capacidad: 2, disponible: true },
    { id: 2, nombre_o_numero: "02", capacidad: 4, disponible: true },
    { id: 3, nombre_o_numero: "03", capacidad: 2, disponible: true },
    { id: 4, nombre_o_numero: "04", capacidad: 6, disponible: true },
    { id: 5, nombre_o_numero: "05", capacidad: 4, disponible: false },
    { id: 6, nombre_o_numero: "06", capacidad: 8, disponible: true },
  ]);

  // Mesa seleccionada
  const mesaSeleccionadaId = formData.mesa_id;
  const mesaActual = availableMesas.find(m => m.id === mesaSeleccionadaId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev,
      [name]: name === 'cantidad_personas' ? parseInt(value) : value,
    }));
  };

  const seleccionarMesa = (mesaId: number) => {
    setFormData(prev => ({ ...prev, mesa_id: mesaId }));
    setMostrarSelectorMesas(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.cantidad_personas < 1) {
      toast.error('La cantidad de personas debe ser al menos 1.');
      return;
    }

    if (availableMesas.length > 0 && mesaActual) {
      if (mesaActual.capacidad < formData.cantidad_personas) {
        toast.error(`La mesa seleccionada solo tiene capacidad para ${mesaActual.capacidad} personas.`);
        return;
      }
      if (!mesaActual.disponible) {
        toast.error('Esta mesa no está disponible.');
        return;
      }
    } else if (availableMesas.length > 0 && !mesaActual) {
      toast.error('Por favor, selecciona una mesa de la lista disponible.');
      return;
    }

    setIsSubmitting(true);
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('¡Reserva demo procesada! En una cuenta real, esto guardaría la reserva en la base de datos.', {
      duration: 5000,
      icon: '✅'
    });

    // Limpiar formulario
    setFormData({
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_email: '',
      fecha_hora: '',
      cantidad_personas: 2,
      notas: '',
      mesa_id: null,
    });
    
    setIsSubmitting(false);
  };

  // Filtrar mesas disponibles
  const mesasDisponibles = availableMesas.filter(mesa => 
    mesa.disponible && mesa.capacidad >= formData.cantidad_personas
  );

  return (
    <div className="min-h-screen bg-white">
      <Header isDemo={true} />

      {/* ✅ Alert de Demo */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-yellow-800 font-medium text-sm">Modo Demostración</p>
                <p className="text-yellow-700 text-xs">
                  Esta es una simulación interactiva de reservas. Las mesas y horarios son de ejemplo.
                </p>
              </div>
            </div>
            <Link
              to="/register"
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-medium transition-colors"
            >
              Crear cuenta real
            </Link>
          </div>
        </div>
      </div>

      <div className="py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header Compacto */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-3 shadow-sm">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Reserva Tu Mesa - Demo
            </h2>
            <p className="text-gray-600 text-sm">
              Simulación interactiva del sistema de reservas
            </p>
          </div>

          {/* Información Demo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700 text-sm">
              💡 <strong>Esto es una demostración:</strong> Las mesas, horarios y disponibilidad son ficticios. 
              En tu restaurante real, podrás gestionar reservas reales.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Información Personal - Compacta */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <UserIcon className="w-5 h-5 text-blue-500 mr-2" />
                  Información Personal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        name="cliente_nombre" 
                        value={formData.cliente_nombre} 
                        onChange={handleChange} 
                        required 
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm" 
                        placeholder="Ej: Juan Pérez (demo)"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="tel" 
                        name="cliente_telefono" 
                        value={formData.cliente_telefono} 
                        onChange={handleChange} 
                        required 
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm" 
                        placeholder="+51 999 888 777 (demo)"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      name="cliente_email" 
                      value={formData.cliente_email} 
                      onChange={handleChange} 
                      className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm" 
                      placeholder="demo@email.com (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles de la Reserva - Compacta */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <ClockIcon className="w-5 h-5 text-blue-500 mr-2" />
                  Detalles de la Reserva
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora *</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="datetime-local" 
                        name="fecha_hora" 
                        value={formData.fecha_hora} 
                        onChange={handleChange} 
                        required 
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personas *</label>
                    <div className="relative">
                      <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="cantidad_personas"
                        value={formData.cantidad_personas}
                        onChange={handleChange}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <option key={num} value={num}>
                            {num} persona{num !== 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de Mesa - Compacto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <TableIcon className="w-5 h-5 text-blue-500 mr-2" />
                  Selección de Mesa (Demo)
                </h3>

                {mesaActual ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                        <div>
                          <p className="font-medium text-green-800 text-sm">Mesa {mesaActual.nombre_o_numero}</p>
                          <p className="text-green-600 text-xs">
                            Capacidad demo: {mesaActual.capacidad} personas
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, mesa_id: null }));
                          setMostrarSelectorMesas(true);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <TableIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm mb-2">
                      {mesasDisponibles.length > 0
                        ? `${mesasDisponibles.length} mesa${mesasDisponibles.length > 1 ? 's' : ''} disponible${mesasDisponibles.length > 1 ? 's' : ''} (demo)`
                        : 'No hay mesas disponibles para esta cantidad de personas'
                      }
                    </p>
                    {mesasDisponibles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMostrarSelectorMesas(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Elegir Mesa (Demo)
                      </button>
                    )}
                  </div>
                )}

                {/* Modal de Mesas - Compacto */}
                {mostrarSelectorMesas && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                      <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">Seleccionar Mesa (Demo)</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Para {formData.cantidad_personas} personas
                          </p>
                        </div>
                        <button
                          onClick={() => setMostrarSelectorMesas(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                          {availableMesas.map((mesa) => {
                            const tieneCapacidad = mesa.capacidad >= formData.cantidad_personas;
                            const estaDisponible = mesa.disponible;
                            
                            return (
                              <div
                                key={mesa.id}
                                onClick={() => estaDisponible && tieneCapacidad && seleccionarMesa(mesa.id)}
                                className={`border rounded-lg p-3 transition-all ${
                                  !estaDisponible ? 'opacity-50 cursor-not-allowed' :
                                  !tieneCapacidad ? 'cursor-not-allowed' :
                                  'cursor-pointer hover:border-blue-300'
                                } ${
                                  mesaSeleccionadaId === mesa.id
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : estaDisponible && tieneCapacidad
                                      ? 'border-gray-200 bg-white'
                                      : 'border-gray-100 bg-gray-50'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-gray-800 text-sm">Mesa {mesa.nombre_o_numero}</h4>
                                  <div className="flex items-center gap-1">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                      tieneCapacidad ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {mesa.capacidad}
                                    </span>
                                    {!estaDisponible && (
                                      <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                                        Ocupada
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {!tieneCapacidad && (
                                  <p className="text-xs text-orange-600">
                                    Capacidad máxima: {mesa.capacidad}
                                  </p>
                                )}
                                
                                {!estaDisponible && (
                                  <p className="text-xs text-red-600">
                                    Mesa no disponible (demo)
                                  </p>
                                )}

                                {mesaSeleccionadaId === mesa.id && (
                                  <CheckIcon className="w-4 h-4 text-blue-500 mt-1" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {mesasDisponibles.length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No hay mesas disponibles para {formData.cantidad_personas} personas
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end p-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setMostrarSelectorMesas(false)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas - Compacta */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Notas Especiales (Demo)</h3>
                <textarea 
                  name="notas" 
                  value={formData.notas} 
                  onChange={handleChange} 
                  rows={3} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none" 
                  placeholder="Ej: Celebración de cumpleaños, alergia a mariscos... (demo)"
                />
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting || (mesasDisponibles.length > 0 && !mesaActual)}
                  className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Procesando demo...
                    </>
                  ) : (
                    'PROCESAR RESERVA DEMO'
                  )}
                </button>

                <Link
                  to="/"
                  className="w-full flex justify-center items-center py-2.5 px-6 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
                >
                  Volver al Menú Demo
                </Link>

                <Link
                  to="/register"
                  className="w-full flex justify-center items-center py-2.5 px-6 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Crear Mi RestoBar Real
                </Link>
              </div>

              <p className="text-center text-xs text-gray-500">
                Esta es solo una demostración. Los datos no se guardan en una base de datos real.
              </p>
            </form>

            {/* Info de confianza - Compacta */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-center">
                <div className="flex-1">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <span className="text-xs text-gray-600">Simulación</span>
                </div>
                <div className="flex-1">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-blue-600 text-xs">🕒</span>
                  </div>
                  <span className="text-xs text-gray-600">Instantáneo</span>
                </div>
                <div className="flex-1">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-purple-600 text-xs">🎯</span>
                  </div>
                  <span className="text-xs text-gray-600">Interactivo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección informativa DEMO */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📅</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Reservas Reales</h3>
              </div>
              <p className="text-gray-600 text-xs">
                Con tu cuenta, gestionarás reservas reales de clientes.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🔔</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
              </div>
              <p className="text-gray-600 text-xs">
                Recibirás alertas de nuevas reservas en tiempo real.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Reportes</h3>
              </div>
              <p className="text-gray-600 text-xs">
                Analiza ocupación y tendencias de reservas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer isDemo={true} />
    </div>
  );
}