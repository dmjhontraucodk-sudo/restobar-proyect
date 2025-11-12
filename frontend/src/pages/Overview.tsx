// Esta es la nueva página principal del dashboard
export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Visión General
      </h1>
      
      {/* Aquí irán tus estadísticas (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card de Ejemplo 1 */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Ventas de Hoy</h3>
          <p className="text-4xl font-extrabold text-gray-900 mt-2">$0.00</p>
          <p className="text-sm text-gray-500 mt-2">+0% vs ayer</p>
        </div>
        
        {/* Card de Ejemplo 2 */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Pedidos Recibidos</h3>
          <p className="text-4xl font-extrabold text-gray-900 mt-2">0</p>
          <p className="text-sm text-gray-500 mt-2">0 en curso</p>
        </div>

        {/* Card de Ejemplo 3 */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Mesas Ocupadas</h3>
          <p className="text-4xl font-extrabold text-gray-900 mt-2">0 / 10</p>
          <p className="text-sm text-gray-500 mt-2">0% de ocupación</p>
        </div>

        {/* Card de Ejemplo 3 */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Mesas No Ocupadas</h3>
          <p className="text-4xl font-extrabold text-gray-900 mt-2">4 / 20</p>
          <p className="text-sm text-gray-500 mt-2">20% de ocupación</p>
        </div>

      </div>
    </div>
  );
}

