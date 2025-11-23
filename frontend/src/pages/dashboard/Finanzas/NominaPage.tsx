import React, { useEffect } from 'react';
import { useTeamManagement } from '../../../hooks/useTeamManagement';
import { NominaTab } from '../../../components/team/NominaTab';
import { 
  DollarSignIcon 
} from '../../../components/dashboard/Sidebar/icons';

const NominaPage = () => {
  // Reutilizamos el hook de equipo que ya trae la lógica de nómina
  const { 
    nomina, 
    isLoading, 
    error, 
    puedeVerSalarios,
    // Si tu hook tiene una función para recargar, úsala aquí, si no, no pasa nada
    reloadEmpleados 
  } = useTeamManagement();

  // Forzar recarga de datos al entrar para asegurar salarios actualizados
  useEffect(() => {
     reloadEmpleados();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg text-green-600">
            <DollarSignIcon className="w-6 h-6" />
          </div>
          Gestión de Nómina
        </h1>
        <p className="text-gray-500 mt-1 ml-12">
          Control de salarios, adelantos y pagos al personal.
        </p>
      </div>

      {/* Contenido Principal */}
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
           Error al cargar la nómina: {error}
        </div>
      ) : (
        // Reutilizamos tu componente NominaTab que ya está perfecto
        <NominaTab 
          nomina={nomina} 
          puedeVerSalarios={puedeVerSalarios} 
          isLoading={isLoading} 
        />
      )}
    </div>
  );
};

export default NominaPage;