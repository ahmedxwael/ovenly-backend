import { CURRENCIES } from "@/shared/consts/currencies";
import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z.string().min(1).max(100).nonempty(),
    email: z.string().email().nonempty(),
    password: z.string().min(8).nonempty(),
    role: z.enum(["admin", "user"]).default("user"),
    balance: z.number().min(0).default(0),
    currency: z.enum(CURRENCIES).default("USD"),
    totalIncomes: z.number().min(0).default(0),
    totalExpenses: z.number().min(0).default(0),
  })
  .strict();
