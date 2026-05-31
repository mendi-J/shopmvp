'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { ordersAPI } from '../../lib/api';
import { ShoppingBag, Package, User, ArrowRight, Loader } from 'lucide-react';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login');
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      ordersAPI.getAll({ limit: 5 })
        .then((res) => setOrders(res.data.data.orders || []))
        .catch(() => {})
        .finally(() => setLoadingOrders(false));
    }
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your account</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: ShoppingBag,
            label: 'Browse Products',
            desc: 'Discover new arrivals',
            href: '/products',
            color: 'bg-indigo-50 text-indigo-600',
          },
          {
            icon: Package,
            label: 'My Orders',
            desc: 'Track your purchases',
            href: '/orders',
            color: 'bg-green-50 text-green-600',
          },
          {
            icon: User,
            label: 'My Profile',
            desc: 'Manage your account',
            href: '/profile',
            color: 'bg-purple-50 text-purple-600',
          },
        ].map(({ icon: Icon, label, desc, href, color }) => (
          <Link
            key={href}
            href={href}
            className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{label}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 font-medium">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-10">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No orders yet</p>
            <Link href="/products" className="text-indigo-600 text-sm font-medium hover:underline">
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all group"
              >
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.items?.length} item(s) ·{' '}
                    <span className="font-medium">${parseFloat(order.totalAmount).toFixed(2)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
