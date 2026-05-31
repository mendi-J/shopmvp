import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Star, Package, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDB2Nmg2di02aC02em02IDZoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center relative">
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
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Shop Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: 'Free Delivery',
                desc: 'Free shipping on all orders over $50. Express delivery available.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: ShieldCheck,
                title: 'Secure Checkout',
                desc: 'Your payment information is encrypted and always protected.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: RefreshCw,
                title: '30-Day Returns',
                desc: 'Not happy? Return any product within 30 days, no questions asked.',
                color: 'bg-purple-50 text-purple-600',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${color} rounded-2xl mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Shop by Category</h2>
            <p className="text-gray-500">Find exactly what you&apos;re looking for</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Electronics', emoji: '💻', color: 'from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100', border: 'border-blue-100' },
              { name: 'Fashion', emoji: '👗', color: 'from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100', border: 'border-pink-100' },
              { name: 'Home & Kitchen', emoji: '🏠', color: 'from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100', border: 'border-amber-100' },
              { name: 'Sports', emoji: '⚽', color: 'from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100', border: 'border-green-100' },
            ].map(({ name, emoji, color, border }) => (
              <Link
                key={name}
                href={`/products?category=${encodeURIComponent(name)}`}
                className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-8 text-center transition-all duration-200 group hover:shadow-md`}
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{emoji}</div>
                <h3 className="font-bold text-gray-800 group-hover:text-gray-900 text-sm">{name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Products' },
              { value: '50,000+', label: 'Happy Customers' },
              { value: '4.8 / 5', label: 'Average Rating' },
              { value: '24 / 7', label: 'Customer Support' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl md:text-4xl font-extrabold mb-1">{value}</div>
                <div className="text-indigo-200 text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-amber-400 fill-current" />
            ))}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Join thousands of happy shoppers
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Create your free account today and start shopping with exclusive deals,
            fast delivery, and a seamless experience.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">ShopMVP</span>
          </div>
          <p className="text-sm">© 2024 ShopMVP. All rights reserved. Built with ❤️</p>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <Link href="/auth/register" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
