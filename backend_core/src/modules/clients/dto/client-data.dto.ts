
import { z } from 'zod';

export const clientDataSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cliente_email: z.string().email("Email inválido").optional().nullable(),
  cliente_telefono: z.string().min(1, "El teléfono es requerido"),
  tipo_documento: z.string().optional().nullable(),
  documento_identidad: z.string().optional().nullable(),
});

export type ClientDataDto = z.infer<typeof clientDataSchema>;
