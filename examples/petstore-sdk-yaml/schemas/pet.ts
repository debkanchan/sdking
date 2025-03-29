import { z } from "zod";
import { CategorySchema } from "./category.js";
import { TagSchema } from "./tag.js";

export const PetSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  category: CategorySchema.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(TagSchema).optional(),
  status: z.string().optional(),
});

export type Pet = z.infer<typeof PetSchema>;
