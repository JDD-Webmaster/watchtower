// Thin wrapper around Paystack's inline checkout script
// (https://js.paystack.co/v1/inline.js). The script is loaded once with
// next/script and exposes a global `PaystackPop` constructor.

export const PAYSTACK_SCRIPT_URL = "https://js.paystack.co/v1/inline.js";

export interface PaystackResponse {
  reference: string;
  transaction_id?: number;
  status: string;
  message?: string;
}

interface PaystackHandler {
  openIframe: () => void;
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: Record<string, unknown>;
  onSuccess: (response: PaystackResponse) => void;
  onCancel: () => void;
  onClose?: () => void;
}

interface PaystackPopConstructor {
  setup: (options: PaystackOptions) => PaystackHandler;
}

declare global {
  interface Window {
    PaystackPop?: PaystackPopConstructor;
  }
}

export function isPaystackLoaded(): boolean {
  return typeof window !== "undefined" && typeof window.PaystackPop !== "undefined";
}

/**
 * Opens the Paystack checkout iframe. Returns false when the script has not
 * loaded yet, so the caller can tell the user to retry.
 */
export function openPaystackCheckout(options: {
  publicKey: string;
  email: string;
  amountCents: number;
  currency: string;
  reference: string;
  onSuccess: (response: PaystackResponse) => void;
  onCancel: () => void;
}): boolean {
  if (!isPaystackLoaded() || !window.PaystackPop) return false;

  const handler = window.PaystackPop.setup({
    key: options.publicKey,
    email: options.email,
    amount: options.amountCents,
    currency: options.currency,
    ref: options.reference,
    onSuccess: options.onSuccess,
    onCancel: options.onCancel,
  });

  handler.openIframe();

  return true;
}
