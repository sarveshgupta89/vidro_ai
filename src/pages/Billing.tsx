import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Zap, ExternalLink, Check, Loader2,
  Receipt, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { cn } from '../components/Sidebar';
import { Breadcrumb } from '../components/Breadcrumb';

type Transaction = {
  id: string;
  amount_paid: number;
  credits_added: number;
  stripe_session_id: string;
  created_at: { toDate: () => Date } | null;
};

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$10',
    credits: 500,
    features: ['500 Credits', '~70 Long-Form Videos', 'Standard Support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$25',
    credits: 1500,
    features: ['1,500 Credits', '~214 Long-Form Videos', 'Priority Support', 'Custom Watermarks'],
    popular: true,
  },
];

export const Billing = () => {
  const { user, userData } = useUserStore();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user || !isFirebaseConfigured) { setTxLoading(false); return; }
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          orderBy('created_at', 'desc'),
          limit(10),
        );
        const snap = await getDocs(q);
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      } catch {
        // Firestore index may not exist yet — silently skip
      } finally {
        setTxLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  const handleBillingPortal = async () => {
    if (!user) return;
    setLoadingPortal(true);
    setError('');
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, customerId: userData?.stripe_customer_id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not open billing portal.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleBuyCredits = async (tier: string) => {
    if (!user) return;
    setLoadingCheckout(tier);
    setError('');
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          userId: user.uid,
          customerId: userData?.stripe_customer_id,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoadingCheckout(null);
    }
  };

  const currentTier = userData?.subscription_tier || 'Starter';
  const credits = userData?.credits_balance ?? 0;

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8">
      <div>
        <Breadcrumb crumbs={[
          { label: 'Profile', path: '/profile' },
          { label: 'Billing & Subscription', path: '/billing' },
        ]} />
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your plan, credits, and payment methods.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Current Plan + Credits */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Plan</p>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-medium">
              {currentTier}
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{currentTier}</p>
            <p className="text-sm text-gray-400 mt-1">
              {currentTier === 'Pro' ? 'Priority support + Custom watermarks' : 'Standard support'}
            </p>
          </div>
          <button
            onClick={handleBillingPortal}
            disabled={loadingPortal || !userData?.stripe_customer_id}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors',
              userData?.stripe_customer_id
                ? 'bg-white/10 hover:bg-white/15 text-white'
                : 'bg-white/5 text-gray-500 cursor-not-allowed',
            )}
            title={!userData?.stripe_customer_id ? 'No Stripe customer linked yet' : undefined}
          >
            {loadingPortal
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><CreditCard className="w-4 h-4" /><span>Manage Payment Methods</span><ExternalLink className="w-3 h-3" /></>
            }
          </button>
          {!userData?.stripe_customer_id && (
            <p className="text-xs text-gray-600 text-center -mt-2">Purchase a plan to link a payment method</p>
          )}
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Credits Balance</p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-bold text-white">{credits}</p>
            <p className="text-gray-400 mb-1.5 text-sm">credits remaining</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Long-form videos (~7 credits each)</span>
              <span>~{Math.floor(credits / 7)} videos</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (credits / 1500) * 100)}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => navigate('/upgrade')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold transition-colors"
          >
            <Zap className="w-4 h-4" /><span>Buy More Credits</span>
          </button>
        </div>
      </div>

      {/* Credit Packs */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Credit Packs</h2>
        <div className="grid grid-cols-2 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={cn(
                'bg-[#111111] border rounded-2xl p-6 flex flex-col relative',
                plan.popular ? 'border-indigo-500/40' : 'border-white/10',
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </span>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-white">{plan.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {plan.price} <span className="text-sm font-normal text-gray-400">one-time</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-indigo-400">{plan.credits.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">credits</p>
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleBuyCredits(plan.id)}
                disabled={!!loadingCheckout}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                  plan.popular
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-white/10 hover:bg-white/15 text-white',
                  !!loadingCheckout && 'opacity-50 cursor-not-allowed',
                )}
              >
                {loadingCheckout === plan.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : `Buy ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Payment History</h2>
        <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
          {txLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Receipt className="w-8 h-8 text-gray-600" />
              <p className="text-sm text-gray-500">No payments yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Credits</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {tx.created_at ? tx.created_at.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-indigo-400">+{tx.credits_added} credits</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      ${((tx.amount_paid || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://dashboard.stripe.com/test/payments/${tx.stripe_session_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <ShieldCheck className="w-4 h-4 text-gray-500" />
        <span>Payments are processed securely by Stripe. We never store your card details.</span>
      </div>
    </div>
  );
};
