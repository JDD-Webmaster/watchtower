"use client";
import { useState } from "react";
import Script from "next/script";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Wallet } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { openPaystackCheckout, PAYSTACK_SCRIPT_URL } from "@/lib/paystack";
import { BalanceTrendChart } from "@/components/charts/BalanceTrendChart";
import type { PaymentInitiation, Wallet as WalletData, WalletTransaction } from "@/lib/types";

const PRESETS = [500, 1000, 2000, 5000];

export default function WalletPage() {
  const { activeOrg } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<"test" | "live" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["wallet", activeOrg?.id],
    queryFn: () =>
      api
        .get<{ data: { wallet: WalletData; transactions: WalletTransaction[] } }>(
          `/organizations/${activeOrg!.id}/wallet`,
        )
        .then((r) => r.data),
    enabled: !!activeOrg,
  });

  const verifyMut = useMutation({
    mutationFn: (reference: string) =>
      api.post(`/organizations/${activeOrg!.id}/wallet/verify`, { reference }),
    onSuccess: () => {
      toast.success("Wallet funded successfully.");
      qc.invalidateQueries({ queryKey: ["wallet", activeOrg?.id] });
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiError
          ? e.message
          : "Payment went through but we could not confirm it yet. It will be credited automatically.",
      ),
  });

  const fundMut = useMutation({
    mutationFn: () =>
      api.post<{ data: PaymentInitiation }>(
        `/organizations/${activeOrg!.id}/wallet/fund`,
        { amount: Number(custom) || amount },
      ),
    onSuccess: (res) => {
      const init = res.data;
      setMode(init.mode);

      const opened = openPaystackCheckout({
        publicKey: init.public_key,
        email: init.email,
        amountCents: init.amount_cents,
        currency: init.currency,
        reference: init.reference,
        onSuccess: (response) => {
          verifyMut.mutate(response.reference || init.reference);
        },
        onCancel: () => {
          toast.info("Payment cancelled. Your wallet was not charged.");
        },
      });

      if (!opened) {
        toast.error("The Paystack checkout could not be loaded. Check your connection and try again.");
      }
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to initialize payment"),
  });

  if (!activeOrg) return null;

  const wallet = data?.wallet;
  const txns = data?.transactions || [];
  const balance = ((wallet?.available_cents || 0) / 100).toFixed(2);
  const trendPoints = [...txns]
    .reverse()
    .map((t) => ({ date: t.created_at, balance: t.balance_after_cents / 100 }));

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Wallet & Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fund your organization wallet to cover SMS charges. Funds only become available after
          successful payment verification.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Wallet className="h-4 w-4" />
              Balance
            </h2>
          </div>
          <div className="p-6">
            <p className="text-4xl font-bold tracking-tight text-slate-900">₦{balance}</p>
            <p className="mt-1 text-sm text-slate-500">
              {wallet?.currency || "NGN"} · Available balance
            </p>
            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">How it works</p>
              <ul className="mt-2 space-y-1.5">
                <li>• SMS is charged from your wallet on successful delivery</li>
                <li>• We never use the platform owner&apos;s account</li>
                <li>• If balance is insufficient, SMS is skipped until you fund</li>
                <li>• Funds are only credited after payment confirmation</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <CreditCard className="h-4 w-4" />
                Fund wallet
              </h2>
              <p className="mt-1 text-sm text-slate-500">Paystack (NGN) · Stripe ready</p>
            </div>
            {mode && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                  mode === "live"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {mode} mode
              </span>
            )}
          </div>
          <div className="p-6">
            <p className="text-sm font-medium text-slate-900">Quick amounts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setAmount(p);
                    setCustom("");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    amount === p && !custom
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  ₦{p}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-900">Custom amount (NGN)</label>
              <input
                type="number"
                min={100}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Enter amount"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <button
              onClick={() => fundMut.mutate()}
              disabled={fundMut.isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              <ArrowUpCircle className="h-4 w-4" />
              {fundMut.isPending ? "Initializing…" : "Fund with Paystack"}
            </button>
            <p className="mt-3 text-xs text-slate-500">
              You will be taken to Paystack to complete the payment. Funds are credited only after
              Paystack confirms the transaction.
            </p>
          </div>
        </section>

      </div>

      {trendPoints.length >= 2 && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Balance trend</h2>
          <BalanceTrendChart points={trendPoints} />
        </section>
      )}

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent transactions</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : txns.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No transactions yet.</div>
          ) : (
            txns.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      tx.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tx.type === "credit" ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {tx.reason.replace("_", " ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tx.reference || "—"} · {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${tx.type === "credit" ? "text-emerald-600" : "text-slate-900"}`}>
                  {tx.type === "credit" ? "+" : "-"}₦{(Math.abs(tx.amount_cents) / 100).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <Script
        src={PAYSTACK_SCRIPT_URL}
        strategy="afterInteractive"
        onError={() => toast.error("Could not load the Paystack checkout script. Refresh and try again.")}
      />
    </div>
  );
}

