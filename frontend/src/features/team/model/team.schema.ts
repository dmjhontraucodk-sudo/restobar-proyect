import { z } from 'zod';

export const addIncidenciaSchema = z.object({
    monto: z.number().min(0.01, { message: 'El monto debe ser mayor a 0' }),
    motivo: z.string().min(3, { message: 'El motivo debe tener al menos 3 caracteres' }),
    es_adelanto: z.boolean(),
});

export type AddIncidenciaSchema = z.infer<typeof addIncidenciaSchema>;
