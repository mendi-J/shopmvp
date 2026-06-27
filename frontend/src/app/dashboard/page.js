'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useTrackLens } from '../../hooks/useTrackLens';
import { dashboardAPI } from '../../lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ShoppingBag, Package, User, ArrowRight, Loader, TrendingUp,
  DollarSign, Heart, ShoppingCart, Download, Bell, Search,
  Settings, RefreshCw, FolderKanban,
} from 'lucide-react';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {loading ? (
          <div className="h-7 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.dataKey === 'revenue' ? `$${p.value.toFixed(2)}` : `${p.value} orders`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { track, page } = useTrackLens();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login');
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      page('Dashboard', { url: window.location.href });
      track('Dashboard Viewed', { userId: user.id });
    }
  }, [isAuthenticated, user]);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingStats(true);
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.data);
    } catch {
      // silently fail — dashboard still renders
    } finally {
      setLoadingStats(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExport = () => {
    if (!stats) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Orders', stats.totalOrders],
      ['Total Spend', `$${stats.totalSpend?.toFixed(2) ?? stats.totalRevenue?.toFixed(2)}`],
      ['Wishlist Items', stats.wishlistCount ?? '-'],
      ['Cart Items', stats.cartCount ?? '-'],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    track('Dashboard Exported', { format: 'csv' });
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const chartData = stats?.revenueChart?.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders,
  })) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your account</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Package}
          label="Total Orders"
          value={stats?.totalOrders ?? '-'}
          color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          loading={loadingStats}
        />
        <StatCard
          icon={DollarSign}
          label="Total Spend"
          value={stats ? `$${(stats.totalSpend ?? stats.totalRevenue ?? 0).toFixed(2)}` : '-'}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          loading={loadingStats}
        />
        <StatCard
          icon={Heart}
          label="Wishlist"
          value={stats?.wishlistCount ?? '-'}
          color="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
          loading={loadingStats}
        />
        <StatCard
          icon={ShoppingCart}
          label="Cart Items"
          value={stats?.cartCount ?? '-'}
          color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          loading={loadingStats}
        />
      </div>

      {/* Chart + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Activity — Last 7 Days
            </h2>
          </div>
          {loadingStats ? (
            <div className="h-48 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No order data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  dot={{ fill: '#6366f1', r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick links */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { icon: FolderKanban, label: 'Projects', desc: 'Tasks & Kanban boards', href: '/projects', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
              { icon: ShoppingBag, label: 'Browse Products', desc: 'Discover new arrivals', href: '/products', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
              { icon: Package, label: 'My Orders', desc: 'Track your purchases', href: '/orders', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
              { icon: Heart, label: 'Wishlist', desc: 'Saved for later', href: '/wishlist', color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
              { icon: Search, label: 'Search', desc: 'Find anything', href: '/search', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
              { icon: Bell, label: 'Notifications', desc: 'Stay updated', href: '/notifications', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
              { icon: Settings, label: 'Settings', desc: 'Manage account', href: '/settings', color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
            ].map(({ icon: Icon, label, desc, href, color }) => (
              <Link
                key={href}
                href={href}
                onClick={() => track('Dashboard Quick Link Clicked', { destination: href, label })}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-10">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : !stats?.recentOrders?.length ? (
          <div className="text-center py-10">
            <Package className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-1">No orders yet</p>
            <Link href="/products" className="text-indigo-600 text-sm font-medium hover:underline">Start shopping →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                onClick={() => track('Recent Order Clicked', { orderId: order.id })}
                className="flex items-center justify-between p-3.5 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
              >
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.items?.length} item(s) · <span className="font-medium">${parseFloat(order.totalAmount).toFixed(2)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
