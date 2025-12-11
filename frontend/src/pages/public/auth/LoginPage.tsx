// src/pages/Login.tsx
import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';
import { loginSchema } from '@features/auth/model/schemas'; // Schemas might still be in src/schemas for now
import type { ZodIssue } from 'zod';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { login } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Limpiar el error del campo cuando el usuario empieza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Limpiar errores globales
    setError('');
    
    // --- VALIDACIÓN CON ZOD ---
    const validationResult = loginSchema.safeParse(formData);
    
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
    
    // Limpiar errores de formulario si la validación es exitosa
    setFormErrors({});
    setIsLoading(true);

    try {
      const hostname = window.location.hostname;
      const API_URL = `http://${hostname}:3000/api/auth/login`;
      
      // Usar `validationResult.data` que tiene los tipos correctos
      const response = await axios.post(API_URL, validationResult.data);
      const { token, user } = response.data;
      
      login(token, user);
      navigate('/dashboard');

    } catch (err) {
      const error = err as Error;
      console.error('❌ [DEBUG] Error en login:', error);
      
      if (!error.message?.includes('tenant')) {
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data.error || 'Credenciales incorrectas');
        } else {
          setError('Error de conexión con el servidor');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        
        {/* Header Minimalista */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          
          <p className="text-sm text-gray-500">
            {window.location.hostname}
          </p>
        </div>

        {/* Formulario Compacto */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:border-blue-500 transition duration-150 disabled:opacity-50 ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:border-blue-500 transition duration-150 disabled:opacity-50 ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="••••••••"
                />
              </div>
              {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
            </div>

            {/* Enlace Olvidé Contraseña */}
            <div className="text-right">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500 transition-colors">
                ¿Olvidaste tu contrraseña?
              </a>
            </div>

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accediendo...
                </>
              ) : (
                'Acceder al Panel'
              )}
            </button>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

          </form>

          
        </div>

        {/* Footer Mínimo */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Sistema de Gestión
          </p>
        </div>

      </div>
    </div>
  );
}