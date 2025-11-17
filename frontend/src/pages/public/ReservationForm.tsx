import React, { useState, useEffect, useRef } from 'react'; 
import { useWebReservations } from './hooks/useWebReservations'; 
import { type CreateReservationData } from '../../types';
import Header from './components/Header';
import Footer from './components/Footer';

import { 
  ClockIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  UserGroupIcon 
} from './components/icons';

// ✅ NUEVO: Iconos adicionales para mesas
const TableIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ReservationForm: React.FC = () => {
  const { 
    isSubmitting, 
    handleSubmitReservation, 
    availableMesas,
    searchAvailableMesas,
  } = useWebReservations();
  
  // ✅ NUEVO: Estado del formulario incluye mesa_id
  const [formData, setFormData] = useState<CreateReservationData>({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    fecha_hora: '',
    cantidad_personas: 2,
    notas: '',
    mesa_id: null, // ✅ NUEVO: Mesa seleccionada
  });

  // ✅ NUEVO: Estados para UI de selección de mesas
  const [mostrarSelectorMesas, setMostrarSelectorMesas] = useState(false);
  const hasCargadoMesas = useRef(false);
  const mesaSeleccionadaId = formData.mesa_id;
  const capacity = formData.cantidad_personas;
  const mesaActual = availableMesas.find(m => m.id === mesaSeleccionadaId);

  // Scroll al top cuando el componente se monta
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ✅ NUEVO: Cargar mesas disponibles al montar el componente
  useEffect(() => {
    if (!hasCargadoMesas.current) {
      console.log('🔄 Cargando mesas por primera vez...');
      hasCargadoMesas.current = true;
      searchAvailableMesas();
    }
  }, [searchAvailableMesas]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateReservationData) => ({ 
      ...prev,
      [name]: name === 'cantidad_personas' ? parseInt(value) : value,
    }));
  };

  // ✅ NUEVO: Función para seleccionar mesa
  const seleccionarMesa = (mesaId: number) => {
    setFormData(prev => ({ ...prev, mesa_id: mesaId }));
    setMostrarSelectorMesas(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.cantidad_personas < 1) {
      alert('La cantidad de personas debe ser al menos 1.');
      return;
    }

    // ✅ NUEVO: Validación de capacidad de mesa
    if (availableMesas.length > 0 && mesaActual) {
      if (mesaActual.capacidad < formData.cantidad_personas) {
        alert(`La mesa seleccionada solo tiene capacidad para ${mesaActual.capacidad} personas. Por favor, selecciona otra mesa o reduce la cantidad de personas.`);
        return;
      }
    } else if (availableMesas.length > 0 && !mesaActual) {
      alert('Por favor, selecciona una mesa de la lista disponible.');
      return;
    }
    
    if (await handleSubmitReservation(formData)) {
      setFormData({
        cliente_nombre: '',
        cliente_telefono: '',
        cliente_email: '',
        fecha_hora: '',
        cantidad_personas: 2,
        notas: '',
        mesa_id: null,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100" id="reservar">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-4 shadow-md">
                <ClockIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Reserva Tu Experiencia
              </h2>
              <p className="text-gray-600 text-base max-w-md mx-auto">
                Selecciona tu mesa preferida y completa los datos para una experiencia personalizada.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Información Personal */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 text-blue-500 mr-2" />
                  Información Personal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        name="cliente_nombre" 
                        value={formData.cliente_nombre} 
                        onChange={handleChange} 
                        required 
                        className="pl-10 w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white" 
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono *</label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="tel" 
                        name="cliente_telefono" 
                        value={formData.cliente_telefono} 
                        onChange={handleChange} 
                        required 
                        className="pl-10 w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white" 
                        placeholder="+51 XXX XXX XXX"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      name="cliente_email" 
                      value={formData.cliente_email} 
                      onChange={handleChange} 
                      className="pl-10 w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white" 
                      placeholder="tu@email.com (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles de la Reserva */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 text-blue-500 mr-2" />
                  Detalles de la Reserva
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha y Hora *</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="datetime-local" 
                        name="fecha_hora" 
                        value={formData.fecha_hora} 
                        onChange={handleChange} 
                        required 
                        className="pl-10 w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white" 
                      />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad de Personas *</label>
                    <div className="relative">
                      <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="number" 
                        name="cantidad_personas" 
                        value={formData.cantidad_personas} 
                        onChange={handleChange} 
                        min={1} 
                        max={20}
                        required 
                        className="pl-10 w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ NUEVO: Selector de Mesa */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <TableIcon className="w-5 h-5 text-blue-500 mr-2" />
                  Selecciona Tu Mesa
                </h3>

                {mesaActual ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                        <div>
                          <p className="font-semibold text-green-800">Mesa seleccionada</p>
                          <p className="text-green-600">
                            Mesa {mesaActual.nombre_o_numero} • Capacidad: {mesaActual.capacidad} personas
                          </p>
                          {mesaActual.capacidad < capacity && (
                            <p className="text-orange-600 text-sm mt-1">
                              ⚠️ Esta mesa tiene capacidad para {mesaActual.capacidad} personas. Tienes seleccionado {capacity}.
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, mesa_id: null }));
                          setMostrarSelectorMesas(true);
                        }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl mb-4">
                    <TableIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">
                      {availableMesas.length > 0
                        ? `Hay ${availableMesas.length} mesa${availableMesas.length > 1 ? 's' : ''} disponible${availableMesas.length > 1 ? 's' : ''}.`
                        : `No hay mesas disponibles en este momento.`
                      }
                    </p>
                    {availableMesas.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMostrarSelectorMesas(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                      >
                        Elegir Mesa
                      </button>
                    )}
                  </div>
                )}

                {/* Modal de Selector de Mesas */}
                {mostrarSelectorMesas && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                      <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Selecciona Tu Mesa</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Necesitas una mesa para <strong>{capacity} personas</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => setMostrarSelectorMesas(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {availableMesas.map((mesa) => {
                            const tieneCapacidad = mesa.capacidad >= capacity;
                            return (
                              <div
                                key={mesa.id}
                                onClick={() => seleccionarMesa(mesa.id)}
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                                  mesaSeleccionadaId === mesa.id
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : tieneCapacidad
                                      ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                                      : 'border-orange-200 bg-orange-50 hover:border-orange-300'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-bold text-lg text-gray-800">Mesa {mesa.nombre_o_numero}</h4>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                      tieneCapacidad ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {mesa.estado}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-gray-600">
                                    <UsersIcon className="w-4 h-4 mr-1" />
                                    <span className="font-semibold">{mesa.capacidad}</span>
                                  </div>
                                </div>
                                
                                {!tieneCapacidad && (
                                  <p className="text-xs text-orange-600 mb-2">
                                    ⚠️ Capacidad insuficiente para {capacity} personas
                                  </p>
                                )}

                                <div className="mt-4 flex justify-between items-center">
                                  <span className={`text-sm font-medium ${
                                    tieneCapacidad ? 'text-green-600' : 'text-orange-600'
                                  }`}>
                                    {tieneCapacidad ? '✓ Capacidad adecuada' : 'Capacidad limitada'}
                                  </span>
                                  {mesaSeleccionadaId === mesa.id && (
                                    <CheckIcon className="w-5 h-5 text-blue-500" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {availableMesas.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No hay mesas disponibles en este momento.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end p-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setMostrarSelectorMesas(false)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas Especiales */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Notas Especiales</h3>
                <textarea 
                  name="notas" 
                  value={formData.notas} 
                  onChange={handleChange} 
                  rows={4} 
                  className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none" 
                  placeholder="Alergias alimentarias, celebración especial, preferencias de mesa, requerimientos especiales..."
                />
              </div>

              {/* Botón de Envío */}
              <button 
                type="submit" 
                disabled={isSubmitting || (availableMesas.length > 0 && !mesaActual)}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Procesando reserva...
                  </>
                ) : (
                  'CONFIRMAR RESERVA'
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                Tus datos están protegidos. No compartimos tu información con terceros.
              </p>
            </form>

            {/* Información de confianza */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                    <span className="text-green-600 text-sm font-bold">✓</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Confirmación rápida</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                    <span className="text-blue-600 text-sm font-bold">🕒</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Respuesta 15min</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-1">
                    <span className="text-purple-600 text-sm font-bold">★</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Servicio premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReservationForm;