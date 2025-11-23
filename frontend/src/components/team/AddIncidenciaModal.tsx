import React, { useState } from "react";
import Modal from "../ui/Modal";
import { ExclamationIcon, DollarSignIcon } from "../icons"; // Ajusta tus imports de iconos

interface Props {
  isOpen: boolean;
  onClose: () => void;
  empleado: { id: number; nombre: string | null } | null;
  onConfirm: (data: {
    id: number;
    monto: number;
    motivo: string;
    es_adelanto: boolean;
  }) => Promise<boolean>;
}

const AddIncidenciaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  empleado,
  onConfirm,
}) => {
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [esAdelanto, setEsAdelanto] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleado || !monto || !motivo) return;

    setLoading(true);
    const success = await onConfirm({
      id: empleado.id,
      monto: Number(monto),
      motivo,
      es_adelanto: esAdelanto,
    });
    setLoading(false);

    if (success) {
      setMonto("");
      setMotivo("");
      setEsAdelanto(false);
      onClose();
    }
  };

  if (!isOpen || !empleado) return null;

  return (
    <Modal
      onClose={onClose}
      title={
        esAdelanto
          ? "Registrar Adelanto de Sueldo"
          : "Registrar Incidencia / Falta"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* TIPO DE REGISTRO (SWITCH) */}
        <div className="flex p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setEsAdelanto(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              !esAdelanto
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Incidencia / Daño
          </button>
          <button
            type="button"
            onClick={() => setEsAdelanto(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              esAdelanto
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Adelanto de Sueldo
          </button>
        </div>

        {/* INFO BOX */}
        <div
          className={`p-4 rounded-xl border flex gap-3 items-start ${
            esAdelanto
              ? "bg-blue-50 border-blue-100"
              : "bg-orange-50 border-orange-100"
          }`}
        >
          <div
            className={`p-2 rounded-full shadow-sm ${
              esAdelanto ? "bg-white text-blue-500" : "bg-white text-orange-500"
            }`}
          >
            {esAdelanto ? (
              <DollarSignIcon className="w-6 h-6" />
            ) : (
              <ExclamationIcon className="w-6 h-6" />
            )}
          </div>
          <div>
            <p
              className={`text-sm font-bold ${
                esAdelanto ? "text-blue-900" : "text-orange-900"
              }`}
            >
              Empleado: {empleado.nombre}
            </p>
            <p
              className={`text-xs mt-1 ${
                esAdelanto ? "text-blue-700" : "text-orange-700"
              }`}
            >
              {esAdelanto
                ? "⚠️ Se generará un EGRESO de tu Caja actual por este monto y se descontará en la nómina."
                : "Este monto se registrará como deuda y se descontará en la próxima nómina. NO afecta la caja hoy."}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {esAdelanto ? "Motivo del Adelanto" : "Motivo de la Falta"}
          </label>
          <input
            type="text"
            placeholder={
              esAdelanto
                ? "Ej. Emergencia familiar"
                : "Ej. Rotura de vajilla, Tardanza"
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Monto (S/)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
              S/
            </span>
            <input
              type="number"
              step="0.10"
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg text-gray-800"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 text-white rounded-lg font-medium shadow-md transition-all disabled:opacity-50 flex items-center gap-2 ${
              esAdelanto
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {loading
              ? "Procesando..."
              : esAdelanto
              ? "Entregar Adelanto"
              : "Registrar Falta"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddIncidenciaModal;
