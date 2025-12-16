import { DateType } from "@/types";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  incomes: any;
  expenses: any;
  goals: any;
  balance: number;
  currency: string;
  totalIncomes: number;
  totalExpenses: number;
  createdAt: DateType;
  updatedAt: DateType;
};
