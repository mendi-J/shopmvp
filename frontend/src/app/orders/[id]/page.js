'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { CheckCircle, Package, MapPin, Loader, ArrowLeft } from 'lucide-react';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const PAYMENT_COLORS = {
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-gray-50 text-gray-700 border-gray-200',
};

function OrderContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      ordersAPI
        .getById(id)
        .then((res) => setOrder(res.data.data))
        .catch(() => router.push('/dashboard'))
        .finally(() => setLoading(false));
    }
  }, [id, isAuthenticated, router]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {!isNew && (
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      )}

      {/* Success banner */}
      {isNew && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-11 h-11 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500">
            Thank you for your purchase. We&apos;re processing your order now.
          </p>
        </div>
      )}

      {!isNew && (
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h1>
      )}

      {/* Order meta */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Order Number</p>
            <p className="font-bold text-gray-900 text-lg">{order.orderNumber}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-0.5">Order Date</p>
            <p className="font-semibold text-gray-900">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">Payment Status</p>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block ${PAYMENT_COLORS[order.paymentStatus]}`}>
              {order.paymentStatus}
            </span>
          </div>
          {order.paymentMethod && (
            <div>
              <p className="text-gray-500 mb-0.5">Payment Method</p>
              <p className="font-semibold text-gray-900 capitalize">{order.paymentMethod}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <Package className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-gray-900">Items Ordered ({order.items.length})</h2>
        </div>

        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  📦
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="font-bold text-gray-900 text-sm">
                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>${parseFloat(order.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery</span>
            <span>
              {parseFloat(order.deliveryFee) === 0 ? (
                <span className="text-green-600 font-semibold">Free</span>
              ) : (
                `$${parseFloat(order.deliveryFee).toFixed(2)}`
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
            <span>Total Paid</span>
            <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <MapPin className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-gray-900">Shipping Address</h2>
        </div>
        <p className="font-semibold text-gray-900">{order.shippingName}</p>
        <p className="text-gray-600 text-sm">{order.shippingAddress}</p>
        <p className="text-gray-600 text-sm">{order.shippingCity}</p>
        <p className="text-gray-500 text-sm">{order.shippingPhone}</p>
        {order.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-semibold mb-1">NOTES</p>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div className="flex gap-3">
        <Link href="/products" className="flex-1 btn-secondary text-center py-3 font-semibold">
          Continue Shopping
        </Link>
        <Link href="/orders" className="flex-1 btn-primary text-center py-3">
          All Orders
        </Link>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
