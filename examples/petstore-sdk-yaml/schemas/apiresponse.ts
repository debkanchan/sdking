import { z } from "zod";

export const ApiResponseSchema = z.object({
  code: z.number().optional(),
  type: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
