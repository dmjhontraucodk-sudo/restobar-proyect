// src/pages/public/Cart.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag, CreditCard, Shield, Clock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, clearCart } = useCart();
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
    setForceUpdate(prev => prev + 1);
  };

  const handleRemoveItem = (productId: number) => {
    removeFromCart(productId);
    setForceUpdate(prev => prev + 1);
  };

  const handleClearCart = () => {
    clearCart();
    setForceUpdate(prev => prev + 1);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center px-4 py-16 min-h-screen">
          <div className="max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Carrito vacío</h2>
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
              <p className="text-gray-500 text-sm">{getTotalItems()} producto{getTotalItems() > 1 ? 's' : ''}</p>
            </div>

            <button
              onClick={handleClearCart}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors text-sm"
            >
              <Trash2 size={16} />
              Vaciar
            </button>
          </div>

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
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
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
                            onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                            className="p-1.5 hover:text-blue-600 text-gray-600 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          
                          <span className="text-gray-900 font-semibold text-sm min-w-[1.5rem] text-center">
                            {item.cantidad}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                            className="p-1.5 hover:text-blue-600 text-gray-600 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-base font-bold text-gray-900">
                            S/ {(Number(item.precio) * item.cantidad).toFixed(2)}
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

            {/* Resumen del Pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 border border-gray-200 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Subtotal ({getTotalItems()})</span>
                    <span className="font-semibold">S/ {getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Envío</span>
                    <span className="text-green-600 font-semibold">Gratis</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-gray-900">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-blue-600 text-lg">S/ {getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Info rápida */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-700 text-xs">
                    <Clock size={12} />
                    <span className="font-medium">Entrega: 25-35 min</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="space-y-2">
                  <Link
                    to="/checkout"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
                  >
                    <CreditCard size={16} />
                    Proceder al Pago
                  </Link>
                  
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