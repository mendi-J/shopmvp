'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTrackLens } from '../../hooks/useTrackLens';
import { ArrowLeft, MapPin, Truck, Loader } from 'lucide-react';

export default function CheckoutPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { cart, summary, loading: cartLoading } = useCart();
  const router = useRouter();
  const { track, page } = useTrackLens();

  const [form, setForm] = useState({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      page('Checkout', { url: window.location.href });
      track('Checkout Started', { itemCount: cart?.items?.length || 0, total: summary?.total || 0 });
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        shippingName: `${user.firstName} ${user.lastName}`,
        shippingPhone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.shippingName || !form.shippingPhone || !form.shippingAddress || !form.shippingCity) {
      toast.error('Please fill in all required shipping fields');
      return;
    }
    const params = new URLSearchParams({
      shippingName: form.shippingName,
      shippingPhone: form.shippingPhone,
      shippingAddress: form.shippingAddress,
      shippingCity: form.shippingCity,
      notes: form.notes,
    });
    router.push(`/payment?${params.toString()}`);
  };

  const items = cart?.items || [];

  if (authLoading || cartLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipping form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Shipping Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="shippingName"
                  value={form.shippingName}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="shippingPhone"
                  value={form.shippingPhone}
                  onChange={handleChange}
                  required
                  placeholder="+1 234 567 8900"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="shippingAddress"
                  value={form.shippingAddress}
                  onChange={handleChange}
                  required
                  placeholder="123 Main St, Apt 4B"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  name="shippingCity"
                  value={form.shippingCity}
                  onChange={handleChange}
                  required
                  placeholder="New York"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Order Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Special delivery instructions..."
                  className="input-field resize-none"
                />
              </div>

              <button type="submit" className="btn-primary w-full py-3.5 text-base font-bold">
                Proceed to Payment →
              </button>
            </form>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="card p-6 sticky top-20">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm text-gray-600">
                  <span className="flex-1 mr-2 line-clamp-1">{item.product.name} ×{item.quantity}</span>
                  <span className="font-semibold flex-shrink-0">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>${summary.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Delivery</span>
                <span>{summary.deliveryFee === 0 ? <span className="text-green-600 font-semibold">Free</span> : `$${summary.deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>${summary.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
