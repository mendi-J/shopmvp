'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SHIPPED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-7 h-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  const { stats, recentOrders, topProducts } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm">Live overview of your store</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
          sub="All time"
          color="bg-green-500/10 text-green-400"
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={`$${stats?.monthRevenue?.toFixed(2) || '0.00'}`}
          sub="Revenue"
          color="bg-indigo-500/10 text-indigo-400"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats?.totalOrders || 0}
          sub={`${stats?.todayOrders || 0} today`}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={stats?.totalCustomers || 0}
          sub="Verified accounts"
          color="bg-purple-500/10 text-purple-400"
        />
      </div>

      {/* Order status breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Pending', key: 'pending', icon: Clock, color: 'text-yellow-400' },
            { label: 'Processing', key: 'processing', icon: Package, color: 'text-blue-400' },
            { label: 'Shipped', key: 'shipped', icon: Truck, color: 'text-purple-400' },
            { label: 'Delivered', key: 'delivered', icon: CheckCircle, color: 'text-green-400' },
            { label: 'Cancelled', key: 'cancelled', icon: XCircle, color: 'text-red-400' },
          ].map(({ label, key, icon: Icon, color }) => (
            <Link
              key={key}
              href={`/admin/orders?status=${key.toUpperCase()}`}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center hover:border-gray-600 transition-colors group"
            >
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
              <p className="text-xl font-bold text-white">{stats?.[key] || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders?.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-6">No orders yet</p>
            )}
            {recentOrders?.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-750 border border-transparent hover:border-gray-700 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 truncate">{order.customer} · {order.itemCount} item(s)</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-bold text-white">${order.totalAmount.toFixed(2)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Top Products Sold</h2>
          {topProducts?.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-6">No data yet</p>
          )}
          <div className="space-y-3">
            {topProducts?.map((product, i) => (
              <div key={product.productId} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 w-4 flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, (product.totalSold / (topProducts[0]?.totalSold || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{product.totalSold} sold</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
