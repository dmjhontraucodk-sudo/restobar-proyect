import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Asumiendo que usas react-router-dom
import { registerSchema } from '../schemas/auth.schema';
import type { ZodIssue } from 'zod';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    subdominio: '',
    email_admin: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'subdominio') {
      processedValue = value.toLowerCase().replace(/\s+/g, '-');
    }
    
    setFormData({
      ...formData,
      [name]: processedValue,
    });

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const validationResult = registerSchema.safeParse(formData);
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
    setIsLoading(true);

    try {
      const API_URL = 'http://localhost:3000/api/auth/register-tenant';
      const response = await axios.post(API_URL, validationResult.data);

      console.log('Respuesta del servidor:', response.data);

      const subdominio = validationResult.data.subdominio.toLowerCase();
      const currentPort = window.location.port;
      const ROOT_DOMAIN = 'localhost'; 
      const newLoginUrl = `http://${subdominio}.${ROOT_DOMAIN}:${currentPort}/login`;

      window.location.href = newLoginUrl;
    } catch (err) {
      console.error('Error al registrar:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Ocurrió un error desconocido');
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-slate-100 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white border rounded-xl shadow-lg border-slate-200">
        
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-3xl font-bold text-center text-slate-900">
            Crea tu espacio de trabajo
          </h2>
          <p className="text-sm text-center text-slate-600">
            Comienza gratis y organiza tu empresa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label
              htmlFor="nombre_empresa"
              className="block text-sm font-medium leading-6 text-slate-700"
            >
              Nombre de la Empresa
            </label>
            <div className="mt-2">
              <input
                type="text"
                id="nombre_empresa"
                name="nombre_empresa"
                value={formData.nombre_empresa}
                onChange={handleChange}
                required
                className={`block w-full rounded-md border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${formErrors.nombre_empresa ? 'ring-red-500' : 'ring-slate-300 focus:ring-blue-600'}`}
              />
            </div>
            {formErrors.nombre_empresa && <p className="text-red-500 text-xs mt-1">{formErrors.nombre_empresa}</p>}
          </div>

          <div>
            <label
              htmlFor="subdominio"
              className="block text-sm font-medium leading-6 text-slate-700"
            >
              Subdominio
            </label>
            <div className="mt-2">
              <input
                type="text"
                id="subdominio"
                name="subdominio"
                placeholder="ej: mi-empresa"
                value={formData.subdominio}
                onChange={handleChange}
                required
                className={`block w-full rounded-md border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${formErrors.subdominio ? 'ring-red-500' : 'ring-slate-300 focus:ring-blue-600'}`}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {formData.subdominio ? `Tu URL será: ${formData.subdominio}.localhost:${window.location.port}` : "Tu URL de acceso única."}
            </p>
            {formErrors.subdominio && <p className="text-red-500 text-xs mt-1">{formErrors.subdominio}</p>}
          </div>

          <div>
            <label
              htmlFor="email_admin"
              className="block text-sm font-medium leading-6 text-slate-700"
            >
              Email del Administrador
            </label>
            <div className="mt-2">
              <input
                type="email"
                id="email_admin"
                name="email_admin"
                autoComplete='email'
                value={formData.email_admin}
                onChange={handleChange}
                required
                className={`block w-full rounded-md border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${formErrors.email_admin ? 'ring-red-500' : 'ring-slate-300 focus:ring-blue-600'}`}
              />
            </div>
            {formErrors.email_admin && <p className="text-red-500 text-xs mt-1">{formErrors.email_admin}</p>}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium leading-6 text-slate-700"
            >
              Contraseña
            </label>
            <div className="mt-2">
              <input
                type="password"
                id="password"
                name="password"
                autoComplete='new-password'
                value={formData.password}
                onChange={handleChange}
                required
                className={`block w-full rounded-md border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${formErrors.password ? 'ring-red-500' : 'ring-slate-300 focus:ring-blue-600'}`}
              />
            </div>
            {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Registrar mi empresa'
            )}
          </button>

          {message && (
            <p className="text-sm text-center text-green-600">
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-center text-red-600">
              {error}
            </p>
          )}

        </form>

        <p className="text-sm text-center text-slate-600 mt-6 pt-4 border-t border-slate-100">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Inicia sesión aquí
          </Link>
        </p>

      </div>
    </div>
  );
}
