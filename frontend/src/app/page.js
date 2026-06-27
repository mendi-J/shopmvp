'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ShieldCheck, Truck, RefreshCw, Star, Package,
  Zap, ChevronDown, CheckCircle, Mail, Users, BarChart3,
  Globe, HeartHandshake, MessageSquare,
} from 'lucide-react';
import { useTrackLens } from '../hooks/useTrackLens';
import { newsletterAPI } from '../lib/api';
import toast from 'react-hot-toast';

const BLOG_POSTS = [
  { slug: 'top-10-gadgets-2025', title: 'Top 10 Gadgets You Need in 2025', category: 'Electronics', date: 'Jun 10, 2025', read: '4 min read', excerpt: 'From AI-powered earbuds to foldable displays, here are the gadgets reshaping how we live and work.' },
  { slug: 'sustainable-fashion-guide', title: 'The Complete Guide to Sustainable Fashion', category: 'Fashion', date: 'Jun 5, 2025', read: '6 min read', excerpt: 'How to build a wardrobe that looks great, feels great, and does good for the planet.' },
  { slug: 'home-office-setup', title: 'Build the Perfect Home Office on a Budget', category: 'Home', date: 'May 28, 2025', read: '5 min read', excerpt: 'Ergonomics, lighting, and organisation tips that boost productivity without breaking the bank.' },
];

const FAQS = [
  { q: 'How fast is delivery?', a: 'Standard delivery takes 3–5 business days. Express delivery (1–2 days) is available at checkout. Orders over $50 qualify for free standard shipping.' },
  { q: 'What is your return policy?', a: 'We offer a 30-day no-questions-asked return policy. Simply initiate a return from your orders page and ship it back within 30 days of delivery.' },
  { q: 'How do I track my order?', a: "Once your order ships, you'll receive an email with a tracking number. You can also track it live from your dashboard under 'My Orders'." },
  { q: 'Are my payment details secure?', a: 'Absolutely. All transactions are encrypted end-to-end. We never store your full card number — only the last 4 digits for reference.' },
  { q: 'Can I change or cancel an order?', a: "You can cancel or modify your order within 1 hour of placing it. After that, if it's already shipped, initiate a return instead." },
  { q: 'Do you ship internationally?', a: 'Currently we ship within the US. International shipping is on our roadmap and will be announced soon.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const { track } = useTrackLens();

  const toggle = () => {
    if (!open) track('FAQ Opened', { question: q });
    setOpen(!open);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-5 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { track, page } = useTrackLens();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    page('Landing Page', { url: window.location.href });

    // Scroll depth tracking
    const depths = [25, 50, 75, 100];
    const fired = new Set();
    const onScroll = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      depths.forEach((d) => {
        if (scrolled >= d && !fired.has(d)) {
          fired.add(d);
          track('Scroll Depth', { percent: d, page: 'home' });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Exit intent
    const onMouseLeave = (e) => {
      if (e.clientY <= 0) track('Exit Page', { page: 'home' });
    };
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      setSubscribing(true);
      await newsletterAPI.subscribe(email);
      track('Newsletter Submitted', { email_domain: email.split('@')[1] });
      toast.success("You're subscribed!");
      setEmail('');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.includes('already')) {
        toast('Already subscribed!', { icon: '✓' });
      } else {
        toast.error('Could not subscribe. Try again.');
      }
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="dark:bg-gray-950">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section ref={heroRef} className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDB2Nmg2di02aC02em02IDZoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4 text-yellow-300" />
            New arrivals every week
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Shop Smarter,<br />
            <span className="text-yellow-300">Live Better</span>
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover thousands of products across electronics, fashion, home & sports.
            Fast delivery. Easy returns. Always secure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              onClick={() => track('CTA Clicked', { cta: 'Shop Now', location: 'hero' })}
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Shop Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/register"
              onClick={() => track('CTA Clicked', { cta: 'Create Account', location: 'hero' })}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust badges ─────────────────────────────────────────── */}
      <section className="py-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: 'Free Delivery', desc: 'Free shipping on all orders over $50. Express delivery available.', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
              { icon: ShieldCheck, title: 'Secure Checkout', desc: 'Your payment information is encrypted and always protected.', color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
              { icon: RefreshCw, title: '30-Day Returns', desc: 'Not happy? Return any product within 30 days, no questions asked.', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="text-center p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow dark:bg-gray-800">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${color} rounded-2xl mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Shop by Category</h2>
            <p className="text-gray-500 dark:text-gray-400">Find exactly what you&apos;re looking for</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Electronics', emoji: '💻', href: '/products?category=Electronics' },
              { name: 'Fashion', emoji: '👗', href: '/products?category=Fashion' },
              { name: 'Home & Kitchen', emoji: '🏠', href: '/products?category=Home+%26+Kitchen' },
              { name: 'Sports', emoji: '⚽', href: '/products?category=Sports' },
            ].map(({ name, emoji, href }) => (
              <Link
                key={name}
                href={href}
                onClick={() => track('Category Clicked', { category: name, location: 'home' })}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center transition-all duration-200 group hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{emoji}</div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Products', icon: Package },
              { value: '50,000+', label: 'Happy Customers', icon: Users },
              { value: '4.8 / 5', label: 'Average Rating', icon: Star },
              { value: '24 / 7', label: 'Customer Support', icon: HeartHandshake },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-white">
                <Icon className="w-7 h-7 mx-auto mb-2 text-indigo-200" />
                <div className="text-3xl md:text-4xl font-extrabold mb-1">{value}</div>
                <div className="text-indigo-200 text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">How ShopMVP Works</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">From discovery to doorstep in four simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Browse & Discover', desc: 'Explore thousands of curated products across every category.', icon: Globe },
              { step: '02', title: 'Add to Cart', desc: 'Build your cart with items you love. Update quantities anytime.', icon: ShoppingCartIcon },
              { step: '03', title: 'Secure Checkout', desc: 'Pay with confidence. All transactions are fully encrypted.', icon: ShieldCheck },
              { step: '04', title: 'Fast Delivery', desc: 'Track your order live and receive it within days.', icon: Truck },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-2xl mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                  <Icon className="w-7 h-7" />
                  <span className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 text-indigo-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-indigo-600">{step}</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ───────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">Start free and upgrade as your needs grow. No hidden fees.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Free', price: '$0', period: 'forever', features: ['Up to 50 orders/month', 'Standard delivery', 'Basic support'], cta: 'Get Started', href: '/auth/register', highlight: false },
              { name: 'Pro', price: '$19', period: 'per month', features: ['Unlimited orders', 'Express delivery', 'Priority support', 'Exclusive deals'], cta: 'Start Pro', href: '/pricing', highlight: true },
              { name: 'Enterprise', price: 'Custom', period: 'contact us', features: ['Everything in Pro', 'Dedicated manager', 'Custom integrations', 'SLA guarantee'], cta: 'Contact Sales', href: '/contact', highlight: false },
            ].map(({ name, price, period, features, cta, href, highlight }) => (
              <div key={name} className={`rounded-2xl p-8 border-2 text-left ${highlight ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/30 scale-105' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                <div className={`text-sm font-semibold mb-1 ${highlight ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>{name}</div>
                <div className={`text-4xl font-extrabold mb-0.5 ${highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{price}</div>
                <div className={`text-xs mb-6 ${highlight ? 'text-indigo-200' : 'text-gray-400'}`}>{period}</div>
                <ul className="space-y-2 mb-8">
                  {features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${highlight ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${highlight ? 'text-indigo-200' : 'text-green-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  onClick={() => track('Pricing Viewed', { plan: name, location: 'home' })}
                  className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            onClick={() => track('CTA Clicked', { cta: 'View Full Pricing', location: 'home_pricing_section' })}
            className="inline-flex items-center gap-1 mt-8 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
          >
            View full pricing details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />)}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Loved by Thousands</h2>
            <p className="text-gray-500 dark:text-gray-400">Real reviews from real customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', role: 'Regular Shopper', quote: "ShopMVP has completely changed how I shop online. The delivery is insanely fast and returns are completely hassle-free.", avatar: 'SM' },
              { name: 'James K.', role: 'Tech Enthusiast', quote: "Best prices on electronics I've found anywhere. The product descriptions are accurate and customer support is top-notch.", avatar: 'JK' },
              { name: 'Priya R.', role: 'Fashion Lover', quote: "The fashion selection is incredible. I love how easy it is to filter by size and style. My go-to app for everything fashion.", avatar: 'PR' },
            ].map(({ name, role, quote, avatar }) => (
              <div key={name} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">{avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{name}</div>
                    <div className="text-xs text-gray-400">{role}</div>
                  </div>
                  <div className="ml-auto flex">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" />)}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">&quot;{quote}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog teaser ──────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">From the Blog</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Tips, guides, and inspiration from the ShopMVP team</p>
            </div>
            <Link href="/blog" onClick={() => track('Blog Viewed', { location: 'home' })} className="hidden sm:flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
              All posts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                onClick={() => track('Blog Viewed', { slug: post.slug, title: post.title, location: 'home' })}
                className="card p-6 hover:shadow-md transition-shadow group"
              >
                <span className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full mb-3">{post.category}</span>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">{post.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.read}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-500 dark:text-gray-400">Can&apos;t find an answer?{' '}
              <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">Contact us</Link>
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────── */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Mail className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-3">Stay in the Loop</h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">Get exclusive deals, new arrivals, and insider tips delivered straight to your inbox.</p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white text-sm"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-70 text-sm flex-shrink-0"
            >
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          <p className="text-indigo-300 text-xs mt-3">No spam, ever. Unsubscribe any time.</p>
        </div>
      </section>

      {/* ── Contact strip ────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Have a question?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Our support team is available 24/7 to help you.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                onClick={() => track('CTA Clicked', { cta: 'Contact Support', location: 'home_contact_strip' })}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </Link>
              <Link
                href="/faq"
                onClick={() => track('CTA Clicked', { cta: 'Browse FAQs', location: 'home_contact_strip' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
              >
                Browse FAQs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-lg">ShopMVP</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Your one-stop shop for everything you need, delivered fast.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/products?category=Electronics" className="hover:text-white transition-colors">Electronics</Link></li>
                <li><Link href="/products?category=Fashion" className="hover:text-white transition-colors">Fashion</Link></li>
                <li><Link href="/products?category=Sports" className="hover:text-white transition-colors">Sports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Sign Up Free</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} ShopMVP. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/faq" className="hover:text-white transition-colors">Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ShoppingCartIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
