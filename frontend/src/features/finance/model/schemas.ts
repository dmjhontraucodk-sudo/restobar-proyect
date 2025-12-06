import { z } from 'zod';

export const pagarNominaSchema = z.object({
    tipo_gasto_id: z.number().min(1, { message: 'El tipo de gasto es requerido' }),
    fecha: z.string().min(1, { message: 'La fecha es requerida' }),
    monto: z.number().min(0.01, { message: 'El monto debe ser mayor a 0' }),
    descripcion: z.string().min(3, { message: 'La descripción es requerida' }),
    metodo_pago: z.string().min(3, { message: 'El método de pago es requerido' }),
    descuentos_ids: z.array(z.number()).optional(),
});

export type PagarNominaSchema = z.infer<typeof pagarNominaSchema>;
