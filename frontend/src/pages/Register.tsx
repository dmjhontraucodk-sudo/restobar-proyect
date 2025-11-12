import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Asumiendo que usas react-router-dom

// El componente del icono SVG ha sido eliminado

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    subdominio: '',
    email_admin: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado de carga

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Limpieza de subdominio: minúsculas y sin espacios
    if (name === 'subdominio') {
      setFormData({
        ...formData,
        [name]: value.toLowerCase().replace(/\s+/g, '-'),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true); // Iniciar carga

    if (!formData.password) {
      setError('La contraseña es requerida');
      setIsLoading(false); // Detener carga
      return;
    }

    try {
      const API_URL = 'http://localhost:3000/api/auth/register-tenant';
      const response = await axios.post(API_URL, formData);

      console.log('Respuesta del servidor:', response.data);

      // En src/pages/Register.tsx - Asegúrate de que redirige correctamente
      // Busca esta parte y déjala así (ya está correcta):

      const subdominio = formData.subdominio.toLowerCase();
      const currentPort = window.location.port;
      const ROOT_DOMAIN = 'localhost'; 
      const newLoginUrl = `http://${subdominio}.${ROOT_DOMAIN}:${currentPort}/login`;

      // Redirección
      window.location.href = newLoginUrl;
    } catch (err) {
      console.error('Error al registrar:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Ocurrió un error desconocido');
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } finally {
      setIsLoading(false); // Detener carga
    }
  };

  return (
    // Contenedor principal que centra el formulario
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-slate-100 font-sans">
      
      <div className="w-full max-w-md p-8 space-y-6 bg-white border rounded-xl shadow-lg border-slate-200">
        
        {/* Encabezado con logo y título */}
        <div className="flex flex-col items-center space-y-4">
          {/* El <LogoIcon /> ha sido eliminado de aquí */}
          <h2 className="text-3xl font-bold text-center text-slate-900">
            Crea tu espacio de trabajo
          </h2>
          <p className="text-sm text-center text-slate-600">
            Comienza gratis y organiza tu empresa.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
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
                className="block w-full rounded-md border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
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
                className="block w-full rounded-md border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {formData.subdominio ? `Tu URL será: ${formData.subdominio}.localhost:puerto` : "Tu URL de acceso única."}
            </p>
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
                className="block w-full rounded-md border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
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
                className="block w-full rounded-md border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Botón de envío con estado de carga y CORRECCIÓN de focus-visible */}
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

          {/* Mensajes de error o éxito */}
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

        {/* Link para iniciar sesión */}
        <p className="text-sm text-center text-slate-600">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Inicia sesión aquí
          </Link>
        </p>

      </div>
    </div>
  );
}

