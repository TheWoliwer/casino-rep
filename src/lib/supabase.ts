import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(url, anon);
export const supabaseAdmin = createClient(url, service);

export type Casino = {
  id: number;
  name: string;
  fee_type: 'percent' | 'fixed' | 'none';
  fee_rate: number;
  fee_currency: string;
  sort_order: number;
  created_at: string;
};

export type CasinoCol = {
  id: number;
  casino_id: number;
  name: string;
  amount: number;
  currency: string;
  monthly: number; // 0=tek seferlik, 1=aylık, 2=yıllık
  sort_order: number;
  created_at?: string;
};

export type Transaction = {
  id: number;
  fee_row_id: number;
  paid_amount: number;
  note: string;
  created_at: string;
};

export type DebtItem = { name: string; amount: number; currency: string; paid?: boolean; paid_amount?: number; };

export type FeeRow = {
  id: number;
  casino_id: number;
  year: number;
  month: number;
  turnover: number;
  fee_amount: number;
  paid_amount: number;
  status: number;
  note: string;
  debt_items?: DebtItem[];
};

export type ColEntry = {
  id: number;
  col_id: number;
  year: number | null;
  month: number | null;
  amount: number | null;
  status: number;
  note: string;
  updated_at?: string;
};

export type Expense = {
  id: number;
  year: number;
  month: number;
  name: string;
  amount: number;
  currency: string;
  note: string;
  created_at: string;
};
