'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { paymentAPI } from '../../lib/api';
import { CreditCard, Lock, ArrowLeft, Loader, CheckCircle } from 'lucide-react';

function PaymentContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { summary, fetchCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const shipping = {
    shippingName: searchParams.get('shippingName') || '',
    shippingPhone: searchParams.get('shippingPhone') || '',
    shippingAddress: searchParams.get('shippingAddress') || '',
    shippingCity: searchParams.get('shippingCity') || '',
    notes: searchParams.get('notes') || '',
  };

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
    if (!authLoading && !shipping.shippingName) router.push('/checkout');
  }, [authLoading, isAuthenticated, shipping.shippingName, router]);

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    if (name === 'number') setCard({ ...card, number: formatCardNumber(value) });
    else if (name === 'expiry') setCard({ ...card, expiry: formatExpiry(value) });
    else if (name === 'cvv') setCard({ ...card, cvv: value.replace(/\D/g, '').slice(0, 3) });
    else setCard({ ...card, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'card') {
      const cardNum = card.number.replace(/\s/g, '');
      if (cardNum.length < 13) { toast.error('Please enter a valid card number'); return; }
      if (!card.name) { toast.error('Please enter the cardholder name'); return; }
      if (card.expiry.length < 5) { toast.error('Please enter a valid expiry date'); return; }
      if (card.cvv.length < 3) { toast.error('Please enter a valid CVV'); return; }
    }

    try {
      setProcessing(true);
      const payload = {
        ...shipping,
        paymentMethod,
        ...(paymentMethod === 'card' && {
          cardDetails: {
            number: card.number.replace(/\s/g, ''),
            expiry: card.expiry,
            cvv: card.cvv,
            name: card.name,
          },
        }),
      };

      const res = await paymentAPI.process(payload);
      await fetchCart();
      toast.success('Payment successful! Order placed.');
      router.push(`/orders/${res.data.data.orderId}?new=true`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment</h1>
      <p className="text-gray-500 text-sm mb-6 flex items-center gap-1.5">
        <Lock className="w-4 h-4 text-green-600" />
        <span>256-bit SSL encrypted & secure</span>
      </p>

      {/* Total summary */}
      <div className="card p-5 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <p className="text-indigo-200 text-sm mb-1">Amount to Pay</p>
        <p className="text-4xl font-extrabold">${summary.total.toFixed(2)}</p>
        <p className="text-indigo-200 text-xs mt-1">
          Incl. ${summary.tax.toFixed(2)} tax
          {summary.deliveryFee > 0 ? ` + $${summary.deliveryFee.toFixed(2)} delivery` : ' · Free delivery'}
        </p>
      </div>

      {/* Payment method selector */}
      <div className="card p-6 mb-4">
        <h2 className="font-bold text-gray-900 mb-3">Payment Method</h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { value: 'card', label: 'Card', icon: '💳' },
            { value: 'paypal', label: 'PayPal', icon: '🅿️' },
          ].map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentMethod(value)}
              className={`p-3.5 border-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                paymentMethod === value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-xl">{icon}</span> {label}
              {paymentMethod === value && <CheckCircle className="w-4 h-4 ml-auto text-indigo-600" />}
            </button>
          ))}
        </div>

        {paymentMethod === 'card' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Number</label>
              <div className="relative">
                <input
                  name="number"
                  value={card.number}
                  onChange={handleCardChange}
                  placeholder="1234 5678 9012 3456"
                  className="input-field pr-10 font-mono tracking-wide"
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cardholder Name</label>
              <input
                name="name"
                value={card.name}
                onChange={handleCardChange}
                placeholder="John Doe"
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry</label>
                <input
                  name="expiry"
                  value={card.expiry}
                  onChange={handleCardChange}
                  placeholder="MM/YY"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CVV</label>
                <input
                  name="cvv"
                  value={card.cvv}
                  onChange={handleCardChange}
                  placeholder="123"
                  className="input-field"
                  type="password"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
              <strong>Test mode:</strong> Use any valid-looking card number. Cards ending in <strong>0000</strong> will be declined.
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-lg shadow-indigo-100"
            >
              <Lock className="w-4 h-4" />
              {processing ? 'Processing Payment...' : `Pay $${summary.total.toFixed(2)}`}
            </button>
          </form>
        )}

        {paymentMethod === 'paypal' && (
          <form onSubmit={handleSubmit}>
            <div className="text-center py-8 bg-yellow-50 border border-yellow-100 rounded-xl mb-4">
              <div className="text-5xl mb-2">🅿️</div>
              <p className="text-sm text-gray-600">
                You&apos;ll be charged <strong>${summary.total.toFixed(2)}</strong> via PayPal
              </p>
              <p className="text-xs text-gray-400 mt-1">(Simulated in dev mode)</p>
            </div>
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {processing ? 'Processing...' : `Pay with PayPal — $${summary.total.toFixed(2)}`}
            </button>
          </form>
        )}
      </div>

      {/* Shipping summary */}
      <div className="card p-4 text-sm">
        <p className="font-semibold text-gray-700 mb-2">Delivering to:</p>
        <p className="text-gray-600 font-medium">{shipping.shippingName}</p>
        <p className="text-gray-500">{shipping.shippingAddress}, {shipping.shippingCity}</p>
        <p className="text-gray-500">{shipping.shippingPhone}</p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
