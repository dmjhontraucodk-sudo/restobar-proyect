// src/pages/public/components/CartDemo.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Shield,
  Clock,
  Wallet,
  Smartphone,
  Building2,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@app/providers/CartProvider";
import { PublicHeader as Header } from "@widgets/public-header";
import { PublicFooter as Footer } from "@widgets/public-footer";
import toast from "react-hot-toast";

export default function CartDemo() {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
    clearCart,
  } = useCart();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("efectivo");

  // ✅ CONFIGURACIÓN DEMO - Datos fijos para la demostración
  const demoConfig = {
    nombreNegocio: "RestoBar Demo",
    metodosPago: {
      efectivo: true,
      tarjeta: true,
      yape: { activo: true, telefono: "987654321" },
      plin: { activo: true, telefono: "987654321" },
      transferencia: { activo: true, cuenta: "Número de cuenta demo" }
    },
    pedidosWeb: {
      activos: true,
      dentroDeHorario: true,
      costoDelivery: 0, // Gratis en demo
      montoMinimo: 20,
      tiempoPrep: 30,
      horario: {
        inicio: "10:00",
        fin: "22:00"
      },
      horaActual: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    },
    validaciones: {
      pedidoValido: (total: number) => ({
        disponible: total >= 20,
        mensaje: total >= 20 ? "Pedido válido" : "Pedido mínimo: S/ 20.00",
        error: total < 20 ? "MONTO_MINIMO_NO_ALCANZADO" : undefined
      })
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
    setForceUpdate((prev) => prev + 1);
  };

  const handleRemoveItem = (productId: number) => {
    removeFromCart(productId);
    setForceUpdate((prev) => prev + 1);
  };

  const handleClearCart = () => {
    clearCart();
    setForceUpdate((prev) => prev + 1);
  };

  // ✅ Función para simular checkout en demo
  const handleDemoCheckout = () => {
    const totalPrice = getTotalPrice();
    
    // Validación demo simple
    if (totalPrice < demoConfig.pedidosWeb.montoMinimo) {
      toast.error(`Monto mínimo: S/ ${demoConfig.pedidosWeb.montoMinimo.toFixed(2)}`);
      return;
    }
    
    if (!selectedPaymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }
    
    toast.success("¡Pedido demo procesado! En una cuenta real, esto guardaría el pedido en la base de datos.", {
      duration: 5000,
      icon: "✅"
    });
    
    // Opcional: Limpiar carrito después de "procesar"
    setTimeout(() => {
      clearCart();
      navigate("/");
    }, 2000);
  };

  // Verificar métodos de pago disponibles DEMO
  const availablePaymentMethods = [
    demoConfig.metodosPago.efectivo && {
      id: "efectivo",
      name: "Efectivo",
      icon: DollarSign,
    },
    demoConfig.metodosPago.tarjeta && { 
      id: "tarjeta", 
      name: "Tarjeta", 
      icon: CreditCard 
    },
    demoConfig.metodosPago.yape.activo && { 
      id: "yape", 
      name: "Yape", 
      icon: Smartphone 
    },
    demoConfig.metodosPago.plin.activo && { 
      id: "plin", 
      name: "Plin", 
      icon: Smartphone 
    },
    demoConfig.metodosPago.transferencia.activo && {
      id: "transferencia",
      name: "Transferencia",
      icon: Building2,
    },
  ].filter(Boolean);

  // Cálculos DEMO
  const totalPrice = getTotalPrice();
  const deliveryCost = Number(demoConfig.pedidosWeb.costoDelivery) || 0;
  const finalTotal = Number(totalPrice) + deliveryCost;
  const meetsMinimum = totalPrice >= demoConfig.pedidosWeb.montoMinimo;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header isDemo={true} />
        
        {/* Alert de Demo */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Modo Demo:</strong> Este carrito es solo para demostración. En una cuenta real, los pedidos se procesarían y guardarían.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-16 min-h-screen">
          <div className="max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Carrito vacío
            </h2>
            <p className="text-gray-600 mb-8 text-sm">
              Agrega productos deliciosos a tu pedido demo
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors mb-3"
            >
              <ShoppingBag size={16} />
              Explorar Menú Demo
            </Link>
            
          </div>
        </div>
        <Footer isDemo={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header isDemo={true} />

      {/* ✅ Alert de Demo - Mejorado */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-500 shrink-0" size={18} />
              <div>
                <p className="text-yellow-800 font-medium text-sm">Modo Demostración</p>
                <p className="text-yellow-700 text-xs">
                  Esta es una simulación interactiva. En una cuenta real, los pedidos se procesarían completamente.
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <div className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header compacto - Mismo diseño */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Volver al menú demo
            </Link>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Tu Pedido Demo</h1>
              <p className="text-gray-500 text-sm">
                {getTotalItems()} producto{getTotalItems() > 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={handleClearCart}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors text-sm"
            >
              <Trash2 size={16} />
              Vaciar
            </button>
          </div>

          {/* ✅ Nota de demo - Solo si hay productos */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              💡 <strong>Esto es una demostración:</strong> Los productos, precios y métodos de pago son de ejemplo. 
              En tu restaurante real, podrás configurar todo a tu medida.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Productos - Mismo diseño */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.cantidad}-${forceUpdate}`}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Imagen */}
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {item.foto_url ? (
                        <img
                          src={item.foto_url}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-xl">🍽️</span>
                        </div>
                      )}
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate pr-2">
                          {item.nombre}
                        </h3>
                        <p className="text-lg font-bold text-blue-600 whitespace-nowrap">
                          S/ {Number(item.precio).toFixed(2)}
                        </p>
                      </div>

                      {/* Controles */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.cantidad - 1)
                            }
                            className="p-1.5 hover:text-blue-600 text-gray-600 transition-colors"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="text-gray-900 font-semibold text-sm min-w-6 text-center">
                            {item.cantidad}
                          </span>

                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.cantidad + 1)
                            }
                            className="p-1.5 hover:text-blue-600 text-gray-600 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-base font-bold text-gray-900">
                            S/{" "}
                            {(Number(item.precio) * item.cantidad).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-600 text-xs font-medium transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen del Pedido CON MÉTODOS DE PAGO - Mismo diseño */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 border border-gray-200 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Resumen Demo
                </h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Subtotal ({getTotalItems()})</span>
                    <span className="font-semibold">
                      S/ {totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Costo de Delivery */}
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Envío</span>
                    {deliveryCost > 0 ? (
                      <span className="font-semibold">
                        S/ {deliveryCost.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-green-600 font-semibold">
                        Gratis
                      </span>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-gray-900">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-blue-600 text-lg">
                        S/ {finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Alerta de Monto Mínimo DEMO */}
                  {!meetsMinimum && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>
                          Monto mínimo demo: S/ {demoConfig.pedidosWeb.montoMinimo.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selector de Método de Pago DEMO */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Método de Pago Demo
                  </label>
                  <div className="space-y-2">
                    {availablePaymentMethods.length > 0 ? (
                      availablePaymentMethods.map((method: any) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              selectedPaymentMethod === method.id
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Icon
                              size={20}
                              className={
                                selectedPaymentMethod === method.id
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }
                            />
                            <span
                              className={`font-medium text-sm ${
                                selectedPaymentMethod === method.id
                                  ? "text-blue-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {method.name}
                            </span>
                            {selectedPaymentMethod === method.id && (
                              <CheckCircle
                                size={18}
                                className="ml-auto text-blue-600"
                              />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No hay métodos de pago configurados
                      </div>
                    )}
                  </div>
                </div>

                {/* Info rápida DEMO */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-700 text-xs">
                    <Clock size={12} />
                    <span className="font-medium">
                      Preparación demo: {demoConfig.pedidosWeb.tiempoPrep} min aprox.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 text-xs mt-1">
                    <span>⏰ Horario demo: {demoConfig.pedidosWeb.horario.inicio} - {demoConfig.pedidosWeb.horario.fin}</span>
                  </div>
                </div>

                {/* ✅ Acciones DEMO */}
                <div className="space-y-2">
                  <button
                    onClick={handleDemoCheckout}
                    disabled={!meetsMinimum || !selectedPaymentMethod}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wallet size={16} />
                    Procesar Pedido Demo
                  </button>

                  <Link
                    to="/"
                    className="w-full bg-transparent border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-center block text-sm"
                  >
                    Agregar más productos
                  </Link>

                  
                </div>

                {/* Garantías DEMO */}
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield size={12} className="text-green-500" />
                    <span>Pago seguro al recibir (demo)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-blue-500" />
                    <span>Preparación rápida en demo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">💡</span>
                    <span className="text-gray-400">Esta es solo una demostración</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección informativa DEMO */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💰</span>
                </div>
                <h3 className="font-semibold text-gray-900">Precios Reales</h3>
              </div>
              <p className="text-gray-600 text-sm">
                En tu restaurante, configurarás tus propios precios y promociones.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📱</span>
                </div>
                <h3 className="font-semibold text-gray-900">Pedidos Reales</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Tus clientes harán pedidos reales que recibirás en tu dashboard.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900">Gestiona Todo</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Controla pedidos, inventario y finanzas desde un solo lugar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer isDemo={true} />
    </div>
  );
}