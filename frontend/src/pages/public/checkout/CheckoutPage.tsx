// src/pages/public/checkout/CheckoutPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Store, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { useCart } from '@app/providers/CartProvider';
import { useWebApi } from '@shared/api/useWebApi';
import { useGlobalConfig } from '@shared/hooks/useGlobalConfig';
import type { PedidoData } from '@shared/types';
import { checkoutSchema } from '@shared/model/public.schema';
import type { ZodIssue } from 'zod';
import toast from 'react-hot-toast';

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

const validarDNI = (dni: string): boolean => {
  // Validar DNI peruano: 8 dígitos
  const regex = /^\d{8}$/;
  return regex.test(dni);
};

const validarRUC = (ruc: string): boolean => {
  // Validar RUC peruano: 11 dígitos
  const regex = /^\d{11}$/;
  return regex.test(ruc);
};

const validarPasaporte = (pasaporte: string): boolean => {
  // Validar pasaporte: letras y números, entre 5 y 20 caracteres
  const regex = /^[a-zA-Z0-9]{5,20}$/;
  return regex.test(pasaporte);
};

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { createOrder, isLoading, error } = useWebApi();
  const { pedidosWeb } = useGlobalConfig();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    const savedMethod = localStorage.getItem('selectedPaymentMethod');
    if (savedMethod) {
      setSelectedPaymentMethod(savedMethod);
    }
  }, []);

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      yape: 'Yape',
      plin: 'Plin',
      transferencia: 'Transferencia Bancaria',
    };
    return methods[method] || 'Efectivo';
  };

  const getPaymentMethodEmoji = (method: string) => {
    const emojis: Record<string, string> = {
      efectivo: '💵',
      tarjeta: '💳',
      yape: '📱',
      plin: '📱',
      transferencia: '🏦',
    };
    return emojis[method] || '💵';
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    tipo_documento: 'DNI' as 'DNI' | 'RUC' | 'PASAPORTE' | 'CARNET_EXTRA',
    documento_identidad: '',
    tipo_pedido: 'RecogerEnTienda' as 'RecogerEnTienda' | 'EntregaDomicilio',
    direccion_entrega: '',
    instrucciones_entrega: '',
    hora_programada: 'asap',
    customTime: '',
    notas_especiales: '',
  });

  // Opciones de tipo de documento
  const tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'RUC', label: 'RUC' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'CARNET_EXTRA', label: 'Carné de Extranjería' },
  ];

  interface Order {
    numero_pedido: string;
  }
  
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  
  const subtotal = getTotalPrice();
  const deliveryFee = Number(pedidosWeb.costoDelivery) || 0;
  const costoEnvioFinal = formData.tipo_pedido === 'EntregaDomicilio' ? deliveryFee : 0;
  const total = subtotal + costoEnvioFinal;

  const handleInputChange = (field: string, value: string) => {
    // Para teléfono: solo números, máximo 9 dígitos
    let processedValue = value;
    if (field === 'cliente_telefono') {
      processedValue = value.replace(/\D/g, '').slice(0, 9);
    }
    // Para documento de identidad: dependiendo del tipo
    if (field === 'documento_identidad') {
      if (formData.tipo_documento === 'DNI') {
        processedValue = value.replace(/\D/g, '').slice(0, 8);
      } else if (formData.tipo_documento === 'RUC') {
        processedValue = value.replace(/\D/g, '').slice(0, 11);
      } else {
        // Para pasaporte y carnet: permitir letras y números
        processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTipoDocumentoChange = (value: string) => {
    // Limpiar documento_identidad cuando cambia el tipo
    setFormData(prev => ({ 
      ...prev, 
      tipo_documento: value as 'DNI' | 'RUC' | 'PASAPORTE' | 'CARNET_EXTRA',
      documento_identidad: ''
    }));
    // Limpiar errores relacionados
    setFormErrors(prev => ({ 
      ...prev, 
      documento_identidad: undefined 
    }));
  };

  const validateStep = (step: number) => {
    let schema;
    if (step === 1) {
        schema = checkoutSchema.pick({ 
          cliente_nombre: true, 
          cliente_telefono: true, 
          cliente_email: true,
          tipo_documento: true,
          documento_identidad: true
        });
    } else if (step === 2) {
        schema = checkoutSchema.pick({ tipo_pedido: true, direccion_entrega: true });
    } else {
        return true;
    }

    const result = schema.safeParse(formData);
    if (!result.success) {
        const issues = result.error.issues;
        const newErrors: Record<string, string> = {};
        issues.forEach((issue: ZodIssue) => {
            const path = issue.path[0];
            if (typeof path === 'string') {
                newErrors[path] = issue.message;
            }
        });
        setFormErrors(newErrors);
        return false;
    }
    
    // Validaciones adicionales para Perú
    const erroresManuales: Record<string, string> = {};
    
    if (step === 1) {
      // Validar Teléfono (9 dígitos, empieza con 9)
      if (!validarTelefonoPeruano(formData.cliente_telefono)) {
        erroresManuales.cliente_telefono = 'El teléfono debe tener 9 dígitos y comenzar con 9';
      }
      
      // Validar Email si está presente
      if (formData.cliente_email && !validarEmail(formData.cliente_email)) {
        erroresManuales.cliente_email = 'Por favor ingrese un correo electrónico válido';
      }
      
      // Validar Documento de Identidad según tipo
      if (formData.tipo_documento === 'DNI' && !validarDNI(formData.documento_identidad)) {
        erroresManuales.documento_identidad = 'El DNI debe tener 8 dígitos';
      } else if (formData.tipo_documento === 'RUC' && !validarRUC(formData.documento_identidad)) {
        erroresManuales.documento_identidad = 'El RUC debe tener 11 dígitos';
      } else if (formData.tipo_documento === 'PASAPORTE' && !validarPasaporte(formData.documento_identidad)) {
        erroresManuales.documento_identidad = 'Ingrese un número de pasaporte válido (5-20 caracteres alfanuméricos)';
      } else if (formData.tipo_documento === 'CARNET_EXTRA' && !formData.documento_identidad.trim()) {
        erroresManuales.documento_identidad = 'Ingrese el número de carné de extranjería';
      }
    }
    
    // Si hay errores manuales, mostrarlos y detener el envío
    if (Object.keys(erroresManuales).length > 0) {
      setFormErrors(prev => ({ ...prev, ...erroresManuales }));
      return false;
    }
    
    setFormErrors({});
    return true;
  };

  const handleSubmitOrder = async () => {
    if (isLoading) return;
    
    // Validaciones manuales antes de Zod
    const erroresManuales: Record<string, string> = {};
    
    // Validar Teléfono (9 dígitos, empieza con 9)
    if (!validarTelefonoPeruano(formData.cliente_telefono)) {
      erroresManuales.cliente_telefono = 'El teléfono debe tener 9 dígitos y comenzar con 9';
    }
    
    // Validar Email si está presente
    if (formData.cliente_email && !validarEmail(formData.cliente_email)) {
      erroresManuales.cliente_email = 'Por favor ingrese un correo electrónico válido';
    }
    
    // Validar Documento de Identidad según tipo
    if (formData.tipo_documento === 'DNI' && !validarDNI(formData.documento_identidad)) {
      erroresManuales.documento_identidad = 'El DNI debe tener 8 dígitos';
    } else if (formData.tipo_documento === 'RUC' && !validarRUC(formData.documento_identidad)) {
      erroresManuales.documento_identidad = 'El RUC debe tener 11 dígitos';
    } else if (formData.tipo_documento === 'PASAPORTE' && !validarPasaporte(formData.documento_identidad)) {
      erroresManuales.documento_identidad = 'Ingrese un número de pasaporte válido (5-20 caracteres alfanuméricos)';
    } else if (formData.tipo_documento === 'CARNET_EXTRA' && !formData.documento_identidad.trim()) {
      erroresManuales.documento_identidad = 'Ingrese el número de carné de extranjería';
    }
    
    // Si hay errores manuales, mostrarlos y detener el envío
    if (Object.keys(erroresManuales).length > 0) {
      setFormErrors(erroresManuales);
      toast.error("Por favor, corrige los errores en el formulario.");
      return;
    }
    
    const validationResult = checkoutSchema.safeParse(formData);
    if (!validationResult.success) {
        toast.error("Por favor, corrige los errores en el formulario.");
        return;
    }

    try {
      const orderData: PedidoData = {
        cliente_nombre: validationResult.data.cliente_nombre,
        cliente_email: validationResult.data.cliente_email || undefined,
        cliente_telefono: validationResult.data.cliente_telefono,
        tipo_documento: validationResult.data.tipo_documento || undefined,
        documento_identidad: validationResult.data.documento_identidad || undefined,
        tipo_pedido: validationResult.data.tipo_pedido,
        direccion_entrega: validationResult.data.tipo_pedido === 'EntregaDomicilio' ? validationResult.data.direccion_entrega : undefined,
        instrucciones_entrega: validationResult.data.instrucciones_entrega || undefined,
        hora_programada: validationResult.data.hora_programada === 'custom' && validationResult.data.customTime ? validationResult.data.customTime : undefined,
        notas_especiales: validationResult.data.notas_especiales || undefined,
        
        subtotal: subtotal,
        total: total,
        costo_envio: costoEnvioFinal,
        
        items: items.map(item => ({
          id: item.id,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      };

      const result = await createOrder(orderData);
      
      setCreatedOrder(result.order);
      setOrderSuccess(true);
      clearCart();
      
      localStorage.removeItem('selectedPaymentMethod');
      
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  // Función para obtener placeholder según tipo de documento
  const getDocumentoPlaceholder = () => {
    switch (formData.tipo_documento) {
      case 'DNI':
        return '12345678';
      case 'RUC':
        return '12345678901';
      case 'PASAPORTE':
        return 'AB123456';
      case 'CARNET_EXTRA':
        return 'X1234567';
      default:
        return 'Número de documento';
    }
  };

  if (orderSuccess && createdOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="text-green-600" size={48} />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ¡Pedido Confirmado!
          </h1>
          
          <p className="text-gray-600 text-lg mb-2">
            Tu pedido ha sido recibido y está siendo procesado
          </p>
          
          <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-8 mt-8 shadow-lg">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-2">Número de Pedido</p>
              <p className="text-3xl font-bold text-blue-600">{createdOrder.numero_pedido}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                <Clock className="mx-auto text-blue-600 mb-3" size={32} />
                <h3 className="text-gray-900 font-semibold mb-2">Tiempo Estimado</h3>
                <p className="text-gray-600">{pedidosWeb.tiempoPrep || 30}-{(pedidosWeb.tiempoPrep || 30) + 15} minutos</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                <MapPin className="mx-auto text-blue-600 mb-3" size={32} />
                <h3 className="text-gray-900 font-semibold mb-2">Tipo de Entrega</h3>
                <p className="text-gray-600">
                  {formData.tipo_pedido === 'RecogerEnTienda' ? 'Recoger en local' : 'Delivery a domicilio'}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-700 text-sm font-medium">
                {getPaymentMethodEmoji(selectedPaymentMethod)} <strong>Método de pago:</strong> {getPaymentMethodName(selectedPaymentMethod)} al {formData.tipo_pedido === 'RecogerEnTienda' ? 'recoger' : 'recibir'}
              </p>
              {selectedPaymentMethod === 'efectivo' && (
                <p className="text-blue-700 text-xs mt-2">
                  💡 Por favor, ten el monto exacto o cambio disponible
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-full text-lg transition-all transform hover:scale-[1.02] mb-4"
          >
            Hacer Otro Pedido
          </button>
          
          <p className="text-gray-600 text-sm">
            ¿Necesitas ayuda? Contáctanos al <span className="text-blue-600">987 654 321</span>
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="text-gray-400 text-6xl mb-6">🛒</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No hay productos en el carrito</h2>
          <p className="text-gray-600 text-lg mb-8">Agrega algunos productos antes de proceder al pago.</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full text-lg transition-all transform hover:scale-105"
          >
            Explorar Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Volver al carrito
        </button>

        <div className="flex items-center justify-between mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    step > s ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Completa tus datos para finalizar el pedido
            </h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cliente_nombre}
                  onChange={(e) => handleInputChange('cliente_nombre', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 ${formErrors.cliente_nombre ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Tu nombre completo"
                />
                 {formErrors.cliente_nombre && <p className="text-red-500 text-xs mt-1">{formErrors.cliente_nombre}</p>}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tipo_documento}
                    onChange={(e) => handleTipoDocumentoChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
                  >
                    {tiposDocumento.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.documento_identidad}
                    onChange={(e) => handleInputChange('documento_identidad', e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 ${formErrors.documento_identidad ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={getDocumentoPlaceholder()}
                    maxLength={formData.tipo_documento === 'DNI' ? 8 : formData.tipo_documento === 'RUC' ? 11 : 20}
                  />
                  {formErrors.documento_identidad && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.documento_identidad}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.tipo_documento === 'DNI' && '8 dígitos'}
                    {formData.tipo_documento === 'RUC' && '11 dígitos'}
                    {formData.tipo_documento === 'PASAPORTE' && 'Letras y números'}
                    {formData.tipo_documento === 'CARNET_EXTRA' && 'Número de carné'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  value={formData.cliente_email}
                  onChange={(e) => handleInputChange('cliente_email', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 ${formErrors.cliente_email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="tu@email.com"
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
                 {formErrors.cliente_email && <p className="text-red-500 text-xs mt-1">{formErrors.cliente_email}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Teléfono de contacto <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.cliente_telefono}
                  onChange={(e) => handleInputChange('cliente_telefono', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 ${formErrors.cliente_telefono ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="912345678"
                  maxLength={9}
                />
                {formErrors.cliente_telefono && <p className="text-red-500 text-xs mt-1">{formErrors.cliente_telefono}</p>}
                <p className="text-xs text-gray-500 mt-1">Formato peruano: 9 dígitos, comienza con 9 (ej: 912345678)</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (validateStep(1)) {
                    setStep(2);
                }
              }}
              className="w-full mt-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:text-gray-600 text-white font-bold py-4 rounded-full transition-all"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Método de Entrega</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleInputChange('tipo_pedido', 'EntregaDomicilio')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.tipo_pedido === 'EntregaDomicilio'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Truck className="text-blue-500 mb-3" size={32} />
                <h3 className="text-gray-900 font-semibold text-lg mb-1">Delivery a Domicilio</h3>
                <p className="text-gray-600 text-sm">Recibe tu pedido en casa</p>
                <p className={`text-sm mt-2 font-semibold ${deliveryFee > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                  {deliveryFee > 0 ? `+ S/ ${deliveryFee.toFixed(2)} envío` : 'Envío gratuito'}
                </p>
              </button>

              <button
                onClick={() => handleInputChange('tipo_pedido', 'RecogerEnTienda')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.tipo_pedido === 'RecogerEnTienda'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Store className="text-blue-500 mb-3" size={32} />
                <h3 className="text-gray-900 font-semibold text-lg mb-1">Recoger en Local</h3>
                <p className="text-gray-600 text-sm">Retira tu pedido</p>
                <p className="text-green-600 text-sm mt-2 font-semibold">Sin costo de envío</p>
              </button>
            </div>

            {formData.tipo_pedido === 'EntregaDomicilio' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Dirección de entrega <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.direccion_entrega}
                    onChange={(e) => handleInputChange('direccion_entrega', e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 ${formErrors.direccion_entrega ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Av. Principal 123, Surco"
                  />
                  {formErrors.direccion_entrega && <p className="text-red-500 text-xs mt-1">{formErrors.direccion_entrega}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Indicaciones adicionales para el repartidor
                  </label>
                  <textarea
                    value={formData.instrucciones_entrega}
                    onChange={(e) => handleInputChange('instrucciones_entrega', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
                    placeholder="Casa color blanco, tocar el timbre dos veces..."
                    rows={3}
                  ></textarea>
                </div>
              </div>
            )}

            {formData.tipo_pedido === 'RecogerEnTienda' && (
              <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                <div className="flex items-start gap-3">
                  <MapPin className="text-blue-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="text-gray-900 font-semibold mb-1">Nuestro Local</h4>
                    <p className="text-gray-600 text-sm">Av. Principal 123, Lima</p>
                    <p className="text-blue-600 text-sm mt-2">
                      Horario de recogida estimado: {pedidosWeb.tiempoPrep || 30} min
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-4 rounded-full transition-all"
              >
                Volver
              </button>
              <button
                onClick={() => {
                    if (validateStep(2)) {
                        setStep(3)
                    }
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:text-gray-600 text-white font-bold py-4 rounded-full transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">¡Casi listo! Revisa tu pedido</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              <div className="space-y-4">
                <h3 className="text-gray-900 font-semibold text-lg">Resumen del Pedido</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-700">
                    <span>
                      {item.cantidad}x {item.nombre}
                    </span>
                    <span>S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-300 pt-3 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>S/ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Costo de envío</span>
                    {costoEnvioFinal > 0 ? (
                      <span>S/ {costoEnvioFinal.toFixed(2)}</span>
                    ) : (
                      <span className="text-green-600 font-semibold">¡Gratis!</span>
                    )}
                  </div>
                  <div className="flex justify-between text-gray-900 text-xl font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">S/ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="text-gray-900 font-semibold mb-3">Información de Contacto</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="text-gray-900 font-semibold">{formData.cliente_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Documento:</span>
                  <span className="text-gray-900 font-semibold">
                    {formData.tipo_documento}: {formData.documento_identidad}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="text-gray-900 font-semibold">{formData.cliente_telefono}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span className="text-gray-900 font-semibold">
                    {formData.tipo_pedido === 'EntregaDomicilio' ? '🚚 Delivery' : '🏃 Recoger'}
                  </span>
                </div>
                {formData.tipo_pedido === 'EntregaDomicilio' && formData.direccion_entrega && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dirección:</span>
                    <span className="text-gray-900 font-semibold text-right max-w-xs">
                      {formData.direccion_entrega}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">
                Notas especiales (alergias, instrucciones, etc.)
              </label>
              <textarea
                value={formData.notas_especiales}
                onChange={(e) => handleInputChange('notas_especiales', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Sin cebolla, alérgico a mariscos..."
                rows={3}
              ></textarea>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-700 text-sm font-medium">
                {getPaymentMethodEmoji(selectedPaymentMethod)} <strong>Método de pago:</strong> {getPaymentMethodName(selectedPaymentMethod)} al {formData.tipo_pedido === 'RecogerEnTienda' ? 'recoger' : 'recibir'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={isLoading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-4 rounded-full transition-all disabled:opacity-50"
              >
                Volver
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-4 rounded-full transition-all shadow-lg shadow-blue-500/30"
              >
                {isLoading ? 'Procesando...' : '✅ Confirmar Pedido'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}