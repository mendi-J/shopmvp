'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';
import { useTrackLens } from '../../hooks/useTrackLens';

const FAQS = [
  { category: 'Orders & Delivery', q: 'How fast is delivery?', a: 'Standard delivery takes 3–5 business days. Express delivery (1–2 days) is available at checkout for Pro members. Orders over $50 qualify for free standard shipping.' },
  { category: 'Orders & Delivery', q: 'Can I track my order?', a: 'Yes! Once your order ships, you\'ll receive an email with a tracking number. You can also track in real time from your Dashboard under "My Orders".' },
  { category: 'Orders & Delivery', q: 'Can I change or cancel an order?', a: 'You can cancel or modify within 1 hour of placing the order. After that, if it\'s already shipped, you\'ll need to initiate a return.' },
  { category: 'Returns & Refunds', q: 'What is your return policy?', a: 'We offer a 30-day no-questions-asked return policy. Initiate a return from your Orders page and ship it back within 30 days. Refunds are processed within 5–7 business days.' },
  { category: 'Returns & Refunds', q: 'What if my item arrives damaged?', a: 'We\'re sorry to hear that! Contact our support team within 48 hours with photos of the damage. We\'ll send a replacement or issue a full refund immediately.' },
  { category: 'Payments & Security', q: 'Are my payment details secure?', a: 'Absolutely. All transactions use end-to-end encryption. We never store your full card number — only the last 4 digits for reference.' },
  { category: 'Payments & Security', q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay. More options coming soon.' },
  { category: 'Account', q: 'How do I reset my password?', a: 'Go to the login page and click "Forgot password?" — we\'ll email you a secure reset link within 1 minute.' },
  { category: 'Account', q: 'Can I have multiple addresses?', a: 'Currently you can enter a shipping address at each checkout. Saved address profiles are on our roadmap.' },
  { category: 'Pricing & Plans', q: 'What\'s included in the Free plan?', a: 'The Free plan includes up to 50 orders per month, standard delivery, and basic email support. Perfect for casual shoppers.' },
  { category: 'Pricing & Plans', q: 'Can I cancel my Pro subscription?', a: 'Yes, any time — no penalty. You keep Pro benefits until the end of your billing period.' },
];

const CATEGORIES = ['All', ...new Set(FAQS.map((f) => f.category))];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const { track } = useTrackLens();

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => { if (!open) track('FAQ Opened', { question: q }); setOpen(!open); }}
        className="w-full flex items-center justify-between p-5 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800">{a}</div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { track, page } = useTrackLens();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    page('FAQ', { url: window.location.href });
    track('Page Viewed', { page: 'faq' });
  }, []);

  const filtered = FAQS.filter((f) => {
    const matchCat = category === 'All' || f.category === category;
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSearch = (val) => {
    setSearch(val);
    if (val.length > 2) track('Search Executed', { query: val, source: 'faq_page' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold mb-4">Help Centre</h1>
          <p className="text-indigo-200 text-lg mb-8">Find answers to the most common questions</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="py-12 max-w-4xl mx-auto px-4">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); track('Filter Applied', { filter: cat, source: 'faq' }); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No results found for &quot;{search}&quot;</p>
            <Link href="/contact" className="btn-primary text-sm">Ask our support team</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq) => <FAQItem key={faq.q} {...faq} />)}
          </div>
        )}

        <div className="mt-12 card p-6 text-center">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Still need help?</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Our support team is available 24/7.</p>
          <Link href="/contact" onClick={() => track('CTA Clicked', { cta: 'Contact Support', location: 'faq_bottom' })} className="btn-primary text-sm">Contact Support</Link>
        </div>
      </section>
    </div>
  );
}
