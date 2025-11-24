// frontend/src/types/caja-types.ts - TIPOS ADICIONALES PARA CAJA

// ✨ NUEVOS TIPOS PARA ESTADÍSTICAS DE CAJA ✨

export interface EstadisticasPorMetodo {
  metodo: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface ResumenCajaExtendido {
  inicial: number;
  ingresos: number;
  egresos: number;
  saldo_teorico: number;
  
  // Nuevos campos
  por_metodo: EstadisticasPorMetodo[];
  total_transacciones: number;
  ticket_promedio: number;
}

// Estos tipos ya existen en tu index.ts, pero los incluyo aquí para referencia

export interface Caja {
  id: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial: number;
  monto_esperado: number;
  monto_real?: number;
  diferencia?: number;
  estado: 'Abierta' | 'Cerrada';
  observaciones?: string;
}

export interface CajaMovimiento {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  metodo_pago: string;
  fecha_hora: string;
}

export interface EstadoCajaResponse {
  caja: Caja & { movimientos: CajaMovimiento[] };
  resumen: {
    inicial: number;
    ingresos: number;
    egresos: number;
    saldo_teorico: number;
  };
}

export interface AbrirCajaData {
  monto_inicial: number;
  observaciones?: string;
}

export interface RegistrarMovimientoData {
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  metodo_pago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';
  notas?: string;
}

export interface CerrarCajaData {
  monto_real: number;
  observaciones?: string;
}

export interface CajaHistorialItem {
  id: number;
  fecha_apertura: string;
  fecha_cierre: string;
  monto_inicial: number;
  monto_esperado: number;
  monto_real: number;
  diferencia: number;
  empleados: { nombre: string | null };
  _count: { movimientos: number };
}