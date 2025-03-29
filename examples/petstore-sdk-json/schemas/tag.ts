import { z } from "zod";

export const TagSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
});

export type Tag = z.infer<typeof TagSchema>;
