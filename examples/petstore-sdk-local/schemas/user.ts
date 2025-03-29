import { z } from "zod";

export const UserSchema = z.object({
  id: z.number().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.number().optional(),
});

export type User = z.infer<typeof UserSchema>;
