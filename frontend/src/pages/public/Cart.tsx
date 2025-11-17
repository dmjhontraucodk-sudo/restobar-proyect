// src/pages/public/Cart.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, clearCart } = useCart();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Scroll al top cuando el componente se monta
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);scroll
    // Forzar re-render después de actualizar la cantidad
    setForceUpdate(prev => prev + 1);
  };

  const handleRemoveItem = (productId: number) => {
    removeFromCart(productId);
    // Forzar re-render después de eliminar
    setForceUpdate(prev => prev + 1);
  };

  const handleClearCart = () => {
    clearCart();
    // Forzar re-render después de vaciar el carrito
    setForceUpdate(prev => prev + 1);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center px-4 py-16 min-h-screen">
          <div className="max-w-md w-full text-center">
            <div className="text-gray-400 text-6xl mb-6">🛒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
            <p className="text-gray-600 text-lg mb-8">
              Descubre nuestros deliciosos platos y agrega algunos a tu pedido
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full text-lg transition-all transform hover:scale-105"
            >
              <ShoppingBag size={20} />
              Explorar Menú
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header del Carrito */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={20} />
                Volver al menú
              </Link>
            </div>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tu Pedido</h1>
              <p className="text-gray-600">{getTotalItems()} productos</p>
            </div>

            <button
              onClick={handleClearCart}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={20} />
              Vaciar todo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Productos */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.cantidad}-${forceUpdate}`} // Forzar re-render con key única
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-500/50 transition-all shadow-lg"
                >
                  <div className="flex gap-4">
                    {/* Imagen del Producto */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                      {item.foto_url ? (
                        <img
                          src={item.foto_url}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>

                    {/* Información del Producto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                        {item.nombre}
                      </h3>
                      <p className="text-2xl font-bold text-blue-600 mb-4">
                        S/ {Number(item.precio).toFixed(2)}
                      </p>

                      {/* Controles de Cantidad */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-300">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                            className="p-2 hover:text-blue-600 text-gray-700 transition-colors"
                          >
                            <Minus size={18} />
                          </button>
                          
                          <span className="text-gray-900 font-semibold min-w-[2rem] text-center">
                            {item.cantidad}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                            className="p-2 hover:text-blue-600 text-gray-700 transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            S/ {(Number(item.precio) * item.cantidad).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-600 text-sm font-medium mt-1 transition-colors"
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

            {/* Resumen del Pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({getTotalItems()} productos)</span>
                    <span className="font-semibold">S/ {getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-700">
                    <span>Costo de envío</span>
                    <span className="text-green-600 font-semibold">¡Gratis!</span>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between text-gray-900 text-xl">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-blue-600">S/ {getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Información de envío */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-blue-700 text-sm">
                    🚚 <strong>Envío gratis</strong> en todos los pedidos
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Tiempo estimado: 35-45 minutos
                  </p>
                </div>

                {/* Acciones */}
                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-full text-lg transition-all transform hover:scale-[1.02] text-center block shadow-lg shadow-blue-500/20"
                  >
                    Continuar al Pago
                  </Link>
                  
                  <Link
                    to="/"
                    className="w-full bg-transparent border border-gray-300 hover:border-blue-500 text-gray-700 font-semibold py-3 rounded-full transition-colors text-center block"
                  >
                    Seguir Explorando
                  </Link>
                </div>

                {/* Garantías */}
                <div className="mt-6 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>🔒</span>
                    <span>Pago seguro al recibir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Preparación en 20-30 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>Soporte: 987 654 321</span>
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