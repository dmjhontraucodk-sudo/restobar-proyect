// src/pages/public/cart/CartPage.tsx - CON VALIDACIÓN COMPLETA DE HORARIO
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
  XCircle,
} from "lucide-react";
import { useCart } from "@app/providers/CartProvider";
import { useGlobalConfig } from "@shared/hooks/useGlobalConfig";
import { PublicHeader as Header } from "@widgets/public-header";
import { PublicFooter as Footer } from "@widgets/public-footer";
import toast from "react-hot-toast";

export default function Cart() {
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

  // Obtener configuración - CON VALIDACIONES COMPLETAS
  const { 
    metodosPago, 
    pedidosWeb, 
    isLoading: configLoading,
    validaciones,
    formatCurrency // ✅ IMPORTAR FUNCIÓN
  } = useGlobalConfig();

  // Estado para método de pago seleccionado
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ✅ FUNCIÓN: Validar si se puede proceder al checkout
  const validarCheckout = async (): Promise<{ 
    puedeContinuar: boolean; 
    mensaje?: string;
    error?: string;
  }> => {
    try {
      setIsChecking(true);
      
      const totalPrice = getTotalPrice();
      
      // ✅ USAR VALIDACIÓN COMPLETA DEL HOOK
      const validacion = validaciones?.pedidoValido?.(totalPrice) || {
        disponible: true,
        mensaje: "Pedido válido"
      };
      
      if (!validacion.disponible) {
        return {
          puedeContinuar: false,
          mensaje: validacion.mensaje,
          error: validacion.error
        };
      }

      // Validar método de pago seleccionado
      if (!selectedPaymentMethod) {
        return {
          puedeContinuar: false,
          mensaje: "Selecciona un método de pago para continuar",
          error: "METODO_PAGO_NO_SELECCIONADO"
        };
      }

      return { puedeContinuar: true };

    } catch (error) {
      console.error("Error validando checkout:", error);
      return {
        puedeContinuar: false,
        mensaje: "Error al verificar disponibilidad. Intenta nuevamente.",
        error: "ERROR_VALIDACION"
      };
    } finally {
      setIsChecking(false);
    }
  };

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

  // ✅ CORREGIDO: Validar ANTES de navegar al checkout
  const handleConfirmOrder = async () => {
    if (configLoading) {
      toast.error("Cargando configuración, espera un momento...");
      return;
    }

    const validacion = await validarCheckout();
    
    if (!validacion.puedeContinuar) {
      toast.error(validacion.mensaje || "No se puede proceder con el pedido");
      return;
    }

    // Guardar método de pago en localStorage para usarlo en Checkout
    localStorage.setItem("selectedPaymentMethod", selectedPaymentMethod);

    console.log("📦 Navegando a checkout:", {
      metodoPago: selectedPaymentMethod,
      total: getTotalPrice(),
      delivery: Number(pedidosWeb.costoDelivery) || 0,
      pedidosActivos: pedidosWeb.activos,
      dentroDeHorario: pedidosWeb.dentroDeHorario
    });

    // Navegar a la página de checkout
    navigate("/checkout");
  };

  // Verificar métodos de pago disponibles
  const availablePaymentMethods = [
    metodosPago.efectivo && {
      id: "efectivo",
      name: "Efectivo",
      icon: DollarSign,
    },
    metodosPago.tarjeta && { id: "tarjeta", name: "Tarjeta", icon: CreditCard },
    metodosPago.yape.activo && { id: "yape", name: "Yape", icon: Smartphone },
    metodosPago.plin.activo && { id: "plin", name: "Plin", icon: Smartphone },
    metodosPago.transferencia.activo && {
      id: "transferencia",
      name: "Transferencia",
      icon: Building2,
    },
  ].filter(Boolean);

  // Cálculos
  const totalPrice = getTotalPrice();
  const deliveryCost = Number(pedidosWeb.costoDelivery) || 0;
  const finalTotal = Number(totalPrice) + deliveryCost;
  const meetsMinimum = totalPrice >= (Number(pedidosWeb.montoMinimo) || 0);

  // ✅ ESTADO DE DISPONIBILIDAD COMPLETO
  const pedidosDesactivados = !pedidosWeb.activos;
  const fueraDeHorario = !pedidosWeb.dentroDeHorario;
  const pedidoNoDisponible = pedidosDesactivados || fueraDeHorario;

  if (configLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center px-4 py-16 min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center px-4 py-16 min-h-screen">
          <div className="max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Carrito vacío
            </h2>
            <p className="text-gray-600 mb-8 text-sm">
              Agrega productos deliciosos a tu pedido
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              <ShoppingBag size={16} />
              Explorar Menú
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header compacto */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/menu"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Volver al menú
            </Link>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Tu Pedido</h1>
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

          {/* ✅ ALERTAS DE DISPONIBILIDAD COMPLETAS */}
          {pedidosDesactivados && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <XCircle className="text-red-500 shrink-0" size={20} />
              <div>
                <p className="text-red-800 font-medium">Pedidos desactivados</p>
                <p className="text-red-700 text-sm">
                  Los pedidos online están temporalmente desactivados. Por favor, intenta más tarde.
                </p>
              </div>
            </div>
          )}

          {fueraDeHorario && !pedidosDesactivados && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-orange-500 shrink-0" size={20} />
              <div>
                <p className="text-orange-800 font-medium">Fuera de horario</p>
                <p className="text-orange-700 text-sm">
                  Horario de atención: {pedidosWeb.horario?.inicio} - {pedidosWeb.horario?.fin}
                </p>
                <p className="text-orange-600 text-xs mt-1">
                  Hora actual: {pedidosWeb.horaActual}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Productos */}
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
                          {formatCurrency(Number(item.precio))}
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
                            {formatCurrency(Number(item.precio) * item.cantidad)}
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

            {/* Resumen del Pedido CON MÉTODOS DE PAGO */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 border border-gray-200 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Resumen
                </h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Subtotal ({getTotalItems()})</span>
                    <span className="font-semibold">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>

                  {/* Costo de Delivery */}
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Envío</span>
                    {deliveryCost > 0 ? (
                      <span className="font-semibold">
                        {formatCurrency(deliveryCost)}
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
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Alerta de Monto Mínimo */}
                  {!meetsMinimum && pedidosWeb.montoMinimo > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>
                          Monto mínimo: {formatCurrency(Number(pedidosWeb.montoMinimo))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selector de Método de Pago */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Método de Pago
                  </label>
                  <div className="space-y-2">
                    {availablePaymentMethods.length > 0 ? (
                      availablePaymentMethods.map((method: any) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            disabled={pedidoNoDisponible}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              selectedPaymentMethod === method.id
                                ? "border-blue-600 bg-blue-50"
                                : pedidoNoDisponible
                                ? "border-gray-100 bg-gray-50 cursor-not-allowed"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Icon
                              size={20}
                              className={
                                selectedPaymentMethod === method.id
                                  ? "text-blue-600"
                                  : pedidoNoDisponible
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }
                            />
                            <span
                              className={`font-medium text-sm ${
                                selectedPaymentMethod === method.id
                                  ? "text-blue-600"
                                  : pedidoNoDisponible
                                  ? "text-gray-400"
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

                {/* Info rápida */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-700 text-xs">
                    <Clock size={12} />
                    <span className="font-medium">
                      Preparación: {pedidosWeb.tiempoPrep || 30} min aprox.
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="space-y-2">
                  <button
                    onClick={handleConfirmOrder}
                    disabled={
                      pedidoNoDisponible || 
                      !selectedPaymentMethod || 
                      !meetsMinimum ||
                      isChecking
                    }
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChecking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Wallet size={16} />
                        Continuar con el Pedido
                      </>
                    )}
                  </button>

                  <Link
                    to="/menu"
                    className="w-full bg-transparent border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-center block text-sm"
                  >
                    Agregar más productos
                  </Link>
                </div>

                {/* Garantías */}
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield size={12} className="text-green-500" />
                    <span>Pago seguro al recibir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-blue-500" />
                    <span>Preparación rápida</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}