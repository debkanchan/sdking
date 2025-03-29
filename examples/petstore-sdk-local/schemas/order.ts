import { z } from "zod";

export const OrderSchema = z.object({
  id: z.number().optional(),
  petId: z.number().optional(),
  quantity: z.number().optional(),
  shipDate: z.string().datetime().optional(),
  status: z.string().optional(),
  complete: z.boolean().optional()
});

export type Order = z.infer<typeof OrderSchema>;
