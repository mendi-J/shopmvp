'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, X, ArrowRight, Zap } from 'lucide-react';
import { useTrackLens } from '../../hooks/useTrackLens';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for casual shoppers just getting started.',
    features: [
      { text: 'Up to 50 orders/month', included: true },
      { text: 'Standard delivery (3–5 days)', included: true },
      { text: 'Basic email support', included: true },
      { text: 'Order tracking', included: true },
      { text: 'Express delivery', included: false },
      { text: 'Exclusive member deals', included: false },
      { text: 'Priority support', included: false },
      { text: 'Early access to new products', included: false },
    ],
    cta: 'Get Started Free',
    href: '/auth/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For frequent shoppers who want the best experience.',
    badge: 'Most Popular',
    features: [
      { text: 'Unlimited orders', included: true },
      { text: 'Express delivery (1–2 days)', included: true },
      { text: 'Priority support (24/7)', included: true },
      { text: 'Order tracking', included: true },
      { text: 'Exclusive member deals', included: true },
      { text: 'Early access to new products', included: true },
      { text: 'Dedicated account manager', included: false },
      { text: 'Custom integrations', included: false },
    ],
    cta: 'Start Pro Trial',
    href: '/auth/register',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'Tailored solutions for high-volume businesses.',
    features: [
      { text: 'Unlimited orders', included: true },
      { text: 'Same-day delivery available', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Order tracking + analytics', included: true },
      { text: 'Exclusive member deals', included: true },
      { text: 'Early access to new products', included: true },
      { text: 'Custom integrations & API', included: true },
      { text: 'SLA guarantee', included: true },
    ],
    cta: 'Contact Sales',
    href: '/contact',
    highlight: false,
  },
];

export default function PricingPage() {
  const { track, page } = useTrackLens();

  useEffect(() => {
    page('Pricing', { url: window.location.href });
    track('Pricing Viewed', { source: 'direct' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4 text-yellow-300" />
            No hidden fees
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Simple, Honest Pricing</h1>
          <p className="text-indigo-200 text-xl max-w-2xl mx-auto">Start free. Upgrade when you need more. Cancel any time — no lock-in.</p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 relative ${plan.highlight ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/30 md:-mt-4 md:mb-4' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>{plan.name}</div>
                <div className={`text-4xl font-extrabold mb-0.5 ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.price}</div>
                <div className={`text-xs mb-3 ${plan.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>{plan.period}</div>
                <p className={`text-sm mb-6 leading-relaxed ${plan.highlight ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{plan.description}</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f.text} className={`flex items-center gap-2 text-sm ${f.included ? (plan.highlight ? 'text-indigo-100' : 'text-gray-700 dark:text-gray-300') : (plan.highlight ? 'text-indigo-300 line-through opacity-60' : 'text-gray-300 dark:text-gray-600 line-through')}`}>
                      {f.included
                        ? <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-indigo-200' : 'text-green-500'}`} />
                        : <X className="w-4 h-4 flex-shrink-0 opacity-50" />}
                      {f.text}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  onClick={() => track('Plan Selected', { plan: plan.name, location: 'pricing_page' })}
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Questions about pricing?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Check our FAQ or reach out — we're happy to help.</p>
          <div className="flex justify-center gap-4">
            <Link href="/faq" className="btn-secondary flex items-center gap-2 text-sm">Browse FAQ</Link>
            <Link href="/contact" className="btn-primary flex items-center gap-2 text-sm">Contact Us <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
