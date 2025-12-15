export type TransactionType = "income" | "expense";

export const DEFAULT_CATEGORIES = [
  "Foods and Beverages",
  "Transportations",
  "Shopping",
  "Recreation",
  "Health",
  "Education",
  "Salary",
  "Gifts",
  "Investments",
  "Others",
] as const;

export const DEFAULT_ACCOUNTS = [
  "Cash",
  "BCA",
  "Mandiri",
  "BRI",
  "BNI",
  "Gopay",
  "OVO",
  "Dana",
  "ShopeePay",
  "Others",
] as const;

export interface TransactionResponse {
  amount: number;
  category: string;
  account: string;
  type: TransactionType;
  note: string;
  date: string;
}

export interface TransactionRequest {
  userText: string;
  currentDate?: string;
}
