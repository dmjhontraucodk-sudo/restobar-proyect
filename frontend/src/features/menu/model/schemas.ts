import { z } from 'zod';

export const addPlatoSchema = z.object({
  itemName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
  itemPrice: z.number().min(0.01, { message: 'El precio debe ser mayor a 0' }),
  itemDescription: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres' }),
  selectedInsumoId: z.number().nullable().optional(),
});

export type AddPlatoSchema = z.infer<typeof addPlatoSchema>;

export const addCategorySchema = z.object({
    categoryName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
});

export type AddCategorySchema = z.infer<typeof addCategorySchema>;
