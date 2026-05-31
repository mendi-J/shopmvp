'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ShoppingBag,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const STATUS_TABS = [
  { key: 'ALL', label: 'All', icon: ShoppingBag },
  { key: 'PENDING', label: 'Pending', icon: Clock },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

const STATUS_STYLES = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SHIPPED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PAYMENT_STYLES = {
  COMPLETED: 'text-green-400',
  PENDING: 'text-yellow-400',
  FAILED: 'text-red-400',
  REFUNDED: 'text-gray-400',
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async (page = 1, status = activeStatus, search = searchQuery) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const params = { page, limit: 20 };
      if (status !== 'ALL') params.status = status;
      if (search) params.search = search;

      const res = await axios.get(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setOrders(res.data.data.orders);
      setPagination(res.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, initialStatus, '');
    setActiveStatus(initialStatus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus]);

  const handleStatusChange = (status) => {
    setActiveStatus(status);
    setSearchInput('');
    setSearchQuery('');
    const params = status !== 'ALL' ? `?status=${status}` : '';
    router.push(`/admin/orders${params}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    fetchOrders(1, activeStatus, searchInput);
  };

  const handlePage = (page) => {
    fetchOrders(page, activeStatus, searchQuery);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Orders</h1>
          <p className="text-gray-500 text-sm">{pagination.total} total orders</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleStatusChange(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              activeStatus === key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order #, customer name, or email..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); setSearchQuery(''); fetchOrders(1, activeStatus, ''); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Orders table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-7 h-7 animate-spin text-indigo-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_1fr_1fr_0.5fr] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Order</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Payment</span>
              <span></span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-800">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_1fr_1fr_0.5fr] gap-4 px-5 py-4 hover:bg-gray-800/60 transition-colors items-center group"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white">{order.user.firstName} {order.user.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{order.user.email}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} items
                  </div>
                  <div className="text-sm font-bold text-white">
                    ${order.totalAmount.toFixed(2)}
                  </div>
                  <div>
                    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className={`text-xs font-semibold ${PAYMENT_STYLES[order.paymentStatus]}`}>
                    {order.paymentStatus}
                  </div>
                  <div className="flex justify-end">
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePage(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400 px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePage(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader className="w-7 h-7 animate-spin text-indigo-400" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
