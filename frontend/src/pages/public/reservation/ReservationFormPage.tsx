import React, { useState, useEffect, useRef } from 'react'; 
import { useWebReservations } from '@features/reservations/model/useWebReservations'; 
import { type CreateReservationData } from '@shared/types';
import { PublicHeader as Header } from '@widgets/public-header';
import { PublicFooter as Footer } from '@widgets/public-footer';
import { reservationSchema } from '@shared/model/public.schema';
import type { ZodIssue } from 'zod';

import { 
  ClockIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  UserGroupIcon 
} from '@widgets/landing-sections/ui/icons';

// Iconos adicionales para mesas
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

// Funciones de validación específicas para Perú
const validarTelefonoPeruano = (telefono: string): boolean => {
  // Validar que tenga 9 dígitos y empiece con 9
  const regex = /^9\d{8}$/;
  return regex.test(telefono);
};

const validarEmail = (email: string): boolean => {
  // Validar formato de email básico
  if (!email) return true; // Email es opcional
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

const ReservationForm: React.FC = () => {
  const { 
    isSubmitting, 
    handleSubmitReservation, 
    availableMesas,
    searchAvailableMesas,
  } = useWebReservations();
  
  const [formData, setFormData] = useState<CreateReservationData>({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    fecha_hora: '',
    cantidad_personas: 2,
    notas: '',
    mesa_id: null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [mostrarSelectorMesas, setMostrarSelectorMesas] = useState(false);
  const hasCargadoMesas = useRef(false);
  const mesaSeleccionadaId = formData.mesa_id;
  const capacity = formData.cantidad_personas;
  const mesaActual = availableMesas.find(m => m.id === mesaSeleccionadaId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!hasCargadoMesas.current) {
      hasCargadoMesas.current = true;
      searchAvailableMesas();
    }
  }, [searchAvailableMesas]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Para teléfono: solo números, máximo 9 dígitos
    let processedValue = value;
    if (name === 'cliente_telefono') {
      processedValue = value.replace(/\D/g, '').slice(0, 9);
    }
    
    setFormData((prev: CreateReservationData) => ({ 
      ...prev,
      [name]: name === 'cantidad_personas' ? parseInt(value) : processedValue,
    }));
    
    // Limpiar error si existe
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const seleccionarMesa = (mesaId: number) => {
    setFormData(prev => ({ ...prev, mesa_id: mesaId }));
    setMostrarSelectorMesas(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDACIONES MANUALES PARA PERÚ
    const erroresManuales: Record<string, string> = {};
    
    // Validar Teléfono (9 dígitos, empieza con 9)
    if (!validarTelefonoPeruano(formData.cliente_telefono)) {
      erroresManuales.cliente_telefono = 'El teléfono debe tener 9 dígitos y comenzar con 9';
    }
    
    // Validar Email si está presente
    if (formData.cliente_email && !validarEmail(formData.cliente_email)) {
      erroresManuales.cliente_email = 'Por favor ingrese un correo electrónico válido';
    }
    
    // Si hay errores manuales, mostrarlos y detener el envío
    if (Object.keys(erroresManuales).length > 0) {
      setFormErrors(erroresManuales);
      return;
    }
    
    const validationResult = reservationSchema.safeParse(formData);

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
    
    if (availableMesas.length > 0 && mesaActual) {
      if (mesaActual.capacidad < formData.cantidad_personas) {
        alert(`La mesa seleccionada solo tiene capacidad para ${mesaActual.capacidad} personas.`);
        return;
      }
    } else if (availableMesas.length > 0 && !mesaActual) {
      alert('Por favor, selecciona una mesa de la lista disponible.');
      return;
    }
    
    if (await handleSubmitReservation(validationResult.data)) {
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
      
      <div className="py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header Compacto */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-3 shadow-sm">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Reserva Tu Mesa
            </h2>
            <p className="text-gray-600 text-sm">
              Completa tus datos para confirmar la reserva
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
                        className={`pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${formErrors.cliente_nombre ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="Nombre completo"
                      />
                    </div>
                    {formErrors.cliente_nombre && <p className="text-red-500 text-xs mt-1">{formErrors.cliente_nombre}</p>}
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
                        maxLength={9}
                        className={`pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${formErrors.cliente_telefono ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="912345678"
                      />
                    </div>
                    {formErrors.cliente_telefono && <p className="text-red-500 text-xs mt-1">{formErrors.cliente_telefono}</p>}
                    <p className="text-xs text-gray-500 mt-1">Formato peruano: 9 dígitos (ej: 912345678)</p>
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
                      className={`pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${formErrors.cliente_email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="tu@email.com (opcional)"
                      onBlur={() => {
                        // Validar email cuando el usuario sale del campo
                        if (formData.cliente_email && !validarEmail(formData.cliente_email)) {
                          setFormErrors(prev => ({
                            ...prev,
                            cliente_email: 'Formato de correo inválido'
                          }));
                        } else if (formErrors.cliente_email) {
                          // Limpiar error si el campo está vacío o es válido
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.cliente_email;
                            return newErrors;
                          });
                        }
                      }}
                    />
                  </div>
                  {formErrors.cliente_email && <p className="text-red-500 text-xs mt-1">{formErrors.cliente_email}</p>}
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
                        className={`pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${formErrors.fecha_hora ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </div>
                    {formErrors.fecha_hora && <p className="text-red-500 text-xs mt-1">{formErrors.fecha_hora}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personas *</label>
                    <div className="relative">
                      <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        name="cantidad_personas" 
                        value={formData.cantidad_personas} 
                        onChange={handleChange} 
                        min={1} 
                        max={20}
                        required 
                        className={`pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${formErrors.cantidad_personas ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </div>
                    {formErrors.cantidad_personas && <p className="text-red-500 text-xs mt-1">{formErrors.cantidad_personas}</p>}
                  </div>
                </div>
              </div>

              {/* Selector de Mesa - Compacto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <TableIcon className="w-5 h-5 text-blue-500 mr-2" />
                  Selección de Mesa
                </h3>

                {mesaActual ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                        <div>
                          <p className="font-medium text-green-800 text-sm">Mesa {mesaActual.nombre_o_numero}</p>
                          <p className="text-green-600 text-xs">
                            Capacidad: {mesaActual.capacidad} personas
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
                      {availableMesas.length > 0
                        ? `${availableMesas.length} mesa${availableMesas.length > 1 ? 's' : ''} disponible${availableMesas.length > 1 ? 's' : ''}`
                        : 'No hay mesas disponibles'
                      }
                    </p>
                    {availableMesas.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMostrarSelectorMesas(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Elegir Mesa
                      </button>
                    )}
                  </div>
                )}
                 {formErrors.mesa_id && <p className="text-red-500 text-xs mt-1">{formErrors.mesa_id}</p>}

                {/* Modal de Mesas - Compacto */}
                {mostrarSelectorMesas && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                      <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">Seleccionar Mesa</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Para {capacity} personas
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
                            const tieneCapacidad = mesa.capacidad >= capacity;
                            return (
                              <div
                                key={mesa.id}
                                onClick={() => seleccionarMesa(mesa.id)}
                                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                  mesaSeleccionadaId === mesa.id
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : tieneCapacidad
                                      ? 'border-gray-200 bg-white hover:border-blue-300'
                                      : 'border-orange-200 bg-orange-50'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-gray-800 text-sm">Mesa {mesa.nombre_o_numero}</h4>
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    tieneCapacidad ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {mesa.capacidad}
                                  </span>
                                </div>
                                
                                {!tieneCapacidad && (
                                  <p className="text-xs text-orange-600">
                                    Máx: {mesa.capacidad}
                                  </p>
                                )}

                                {mesaSeleccionadaId === mesa.id && (
                                  <CheckIcon className="w-4 h-4 text-blue-500 mt-1" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {availableMesas.length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No hay mesas disponibles
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
                <h3 className="text-lg font-semibold text-gray-800">Notas Especiales</h3>
                <textarea 
                  name="notas" 
                  value={formData.notas} 
                  onChange={handleChange} 
                  rows={3} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none" 
                  placeholder="Alergias, celebración, preferencias..."
                />
              </div>

              {/* Botón de Envío */}
              <button 
                type="submit" 
                disabled={isSubmitting || (availableMesas.length > 0 && !mesaActual)}
                className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  'CONFIRMAR RESERVA'
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                Tus datos están protegidos y seguros.
              </p>
            </form>

            {/* Info de confianza - Compacta */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-center">
                <div className="flex-1">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <span className="text-xs text-gray-600">Rápido</span>
                </div>
                <div className="flex-1">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-blue-600 text-xs">🕒</span>
                  </div>
                  <span className="text-xs text-gray-600">15min</span>
                </div>
                <div className="flex-1">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-purple-600 text-xs">★</span>
                  </div>
                  <span className="text-xs text-gray-600">Premium</span>
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