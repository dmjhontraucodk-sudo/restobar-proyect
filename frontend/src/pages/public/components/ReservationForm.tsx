import React, { useState } from 'react';
import { useWebReservations } from '../hooks/useWebReservations'; 
import { type CreateReservationData } from '../../../types';
// Importación corregida - desde el mismo directorio
import { ClockIcon, UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, UserGroupIcon } from './icons';

const ReservationForm: React.FC = () => {
  const { isSubmitting, handleSubmitReservation } = useWebReservations();
  
  const [formData, setFormData] = useState<CreateReservationData>({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    fecha_hora: '',
    cantidad_personas: 2,
    notas: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateReservationData) => ({ 
      ...prev,
      [name]: name === 'cantidad_personas' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.cantidad_personas < 1) {
      alert('La cantidad de personas debe ser al menos 1.');
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
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100" id="reservar">
      {/* Header con icono destacado */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-4 shadow-md">
          <ClockIcon className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          Solicitar Reserva
        </h2>
        <p className="text-gray-600 text-base max-w-md mx-auto">
          Completa los datos y nos pondremos en contacto para confirmarla.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Nombre y Teléfono */}
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
        
        {/* Email */}
        <div className="relative">
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

        {/* Fecha/Hora y Personas */}
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

        {/* Notas */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notas Especiales (Opcional)</label>
          <textarea 
            name="notas" 
            value={formData.notas} 
            onChange={handleChange} 
            rows={4} 
            className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none" 
            placeholder="Alergias alimentarias, celebración especial, preferencias de mesa..."
          />
        </div>

        {/* Botón de Envío */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
              Enviando solicitud...
            </>
          ) : (
            'SOLICITAR RESERVA'
          )}
        </button>

        {/* Texto de seguridad */}
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
  );
};

export default ReservationForm;