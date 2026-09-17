import type { User } from '@/features/auth';

export interface ProfileInput {
  displayName: string;
  email: string;
  /** Required by the API only when the email changes (re-authentication). */
  currentPassword?: string;
}

export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountInput {
  currentPassword: string;
  /** Must be exactly "ELIMINAR" (checked by the API). */
  confirmation: string;
}

export interface AccountUserResponse {
  user: User;
  csrfToken?: string;
}

export type PlanCode = 'standard' | 'annual' | 'education';
export type BillingInterval = 'month' | 'year';

/** Mirrors backend BillingRepository. Money = integer minor units + ISO 4217. */
export interface Plan {
  code: PlanCode | string;
  interval: BillingInterval | string;
  amountMinor: number;
  currency: string;
  requiresCode: boolean;
}

export interface Subscription {
  status: string;
  plan: Plan;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  nextPaymentAt: string | null;
  nextPaymentAmountMinor: number | null;
}

export interface Payment {
  id: string;
  planCode: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export interface BillingOverview {
  subscription: Subscription | null;
  payments: Payment[];
  plans: Plan[];
  /** false until a payment provider is integrated (docs/decisions/0011). */
  checkoutAvailable: boolean;
}

export const DELETE_CONFIRMATION_WORD = 'ELIMINAR';
