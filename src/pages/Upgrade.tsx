import React, { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { Check } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';

export const Upgrade = () => {
  const { user, userData } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (tier: 'starter' | 'pro') => {
    if (!user) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          userId: user.uid,
          customerId: userData?.stripe_customer_id,
          email: user.email,
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('An error occurred while trying to upgrade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Breadcrumb crumbs={[
        { label: 'Profile', path: '/profile' },
        { label: 'Billing & Subscription', path: '/billing' },
        { label: 'Buy More Credits', path: '/upgrade' },
      ]} />
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
          Pricing Plans
        </h1>
        <p className="mt-5 text-xl text-gray-400">
          Choose the right plan for your video creation needs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-12">
        {/* Starter Plan */}
        <div className="bg-[#111111] rounded-3xl p-8 border border-white/10 flex flex-col">
          <h3 className="text-2xl font-semibold text-white">Starter</h3>
          <p className="mt-4 text-gray-400">Perfect for individuals and small projects.</p>
          <div className="mt-6 flex items-baseline text-5xl font-extrabold text-white">
            $10
            <span className="ml-1 text-xl font-medium text-gray-400">/one-time</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-start">
              <Check className="flex-shrink-0 w-6 h-6 text-emerald-500" />
              <span className="ml-3 text-gray-300">500 Credits</span>
            </li>
            <li className="flex items-start">
              <Check className="flex-shrink-0 w-6 h-6 text-emerald-500" />
              <span className="ml-3 text-gray-300">~70 Long-Form Videos</span>
            </li>
            <li className="flex items-start">
              <Check className="flex-shrink-0 w-6 h-6 text-emerald-500" />
              <span className="ml-3 text-gray-300">Standard Support</span>
            </li>
          </ul>
          <button
            onClick={() => handleUpgrade('starter')}
            disabled={loading}
            className="mt-8 w-full py-3 px-6 border border-transparent rounded-xl text-center font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Buy Starter'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-indigo-900/40 to-[#111111] rounded-3xl p-8 border border-indigo-500/30 flex flex-col relative">
          <div className="absolute top-0 right-6 transform -translate-y-1/2">
            <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Most Popular
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-white">Pro</h3>
          <p className="mt-4 text-gray-400">For power users and agencies.</p>
          <div className="mt-6 flex items-baseline text-5xl font-extrabold text-white">
            $25
            <span className="ml-1 text-xl font-medium text-gray-400">/one-time</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-start">
              <Check className="flex-shrink-0 w-6 h-6 text-emerald-500" />
              <span className="ml-3 text-gray-300">1500 Credits</span>
            </li>
            <li className="flex items-start">
              <Check className="flex-shrink-0 w-6 h-6 text-emerald-500" />
              <span className="ml-3 text-gray-300">~214 Long-Form Videos</span>
            </li>
            <li className="flex items-start">
              <Check className="flex-shrink-0 w-6 h-6 text-emerald-500" />
              <span className="ml-3 text-gray-300">Priority Support</span>
            </li>
            <li className="flex items-start">
              <Check className="flex-shrink-0 w-6 h-6 text-emerald-500" />
              <span className="ml-3 text-gray-300">Custom Watermarks</span>
            </li>
          </ul>
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={loading}
            className="mt-8 w-full py-3 px-6 border border-transparent rounded-xl text-center font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Buy Pro'}
          </button>
        </div>
      </div>
    </div>
  );
};
