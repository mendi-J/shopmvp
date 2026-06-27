'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  CreditCard,
  Loader,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  RefreshCw,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SHIPPED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const TIMELINE = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

function StatusTimeline({ current }) {
  if (current === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 py-3">
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <span className="text-sm text-red-400 font-semibold">Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = TIMELINE.indexOf(current);

  return (
    <div className="flex items-center gap-0 w-full">
      {TIMELINE.map((step, i) => {
        const isDone = i <= currentIndex;
        const isLast = i === TIMELINE.length - 1;
        const icons = [Clock, Package, Truck, CheckCircle];
        const Icon = icons[i];

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                isDone
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-600'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs mt-1.5 font-medium capitalize hidden sm:block ${isDone ? 'text-indigo-400' : 'text-gray-600'}`}>
                {step.toLowerCase()}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${isDone && i < currentIndex ? 'bg-indigo-600' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FulfillmentActions({ order, onStatusUpdate, updating }) {
  const { status } = order;

  if (status === 'DELIVERED' || status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl text-sm text-gray-500">
        {status === 'DELIVERED'
          ? <><CheckCircle className="w-4 h-4 text-green-400" /> This order has been delivered.</>
          : <><XCircle className="w-4 h-4 text-red-400" /> This order was cancelled.</>
        }
      </div>
    );
  }

  const actions = [];

  if (status === 'PENDING') {
    actions.push({
      label: 'Mark as Processing',
      status: 'PROCESSING',
      icon: Package,
      style: 'bg-blue-600 hover:bg-blue-700 text-white',
    });
  }

  if (status === 'PENDING' || status === 'PROCESSING') {
    actions.push({
      label: 'Mark as Shipped',
      status: 'SHIPPED',
      icon: Truck,
      style: 'bg-purple-600 hover:bg-purple-700 text-white',
    });
  }

  if (status === 'SHIPPED') {
    actions.push({
      label: 'Mark as Delivered',
      status: 'DELIVERED',
      icon: CheckCircle,
      style: 'bg-green-600 hover:bg-green-700 text-white',
    });
  }

  if (status !== 'DELIVERED') {
    actions.push({
      label: 'Cancel Order',
      status: 'CANCELLED',
      icon: XCircle,
      style: 'bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20',
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fulfillment Actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ label, status: newStatus, icon: Icon, style }) => (
          <button
            key={newStatus}
            onClick={() => onStatusUpdate(newStatus)}
            disabled={updating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${style}`}
          >
            {updating ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`${API_URL}/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data.data);
    } catch {
      toast.error('Order not found');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('admin_token');
      await axios.patch(
        `${API_URL}/admin/orders/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order marked as ${newStatus.toLowerCase()}`);
      await fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-7 h-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">{order.orderNumber}</h1>
            <p className="text-gray-500 text-sm">
              {new Date(order.createdAt).toLocaleString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_STYLES[order.status]}`}>
            {order.status}
          </span>
          <button
            onClick={fetchOrder}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-500 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Order Progress</p>
        <StatusTimeline current={order.status} />
      </div>

      {/* Fulfillment actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <FulfillmentActions order={order} onStatusUpdate={handleStatusUpdate} updating={updating} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-300">Customer</h2>
          </div>
          <p className="text-white font-semibold">{order.user.firstName} {order.user.lastName}</p>
          <p className="text-gray-400 text-sm mt-0.5">{order.user.email}</p>
          {order.user.phone && <p className="text-gray-400 text-sm">{order.user.phone}</p>}
        </div>

        {/* Shipping address */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-300">Shipping Address</h2>
          </div>
          <p className="text-white font-semibold">{order.shippingName}</p>
          <p className="text-gray-400 text-sm mt-0.5">{order.shippingAddress}</p>
          <p className="text-gray-400 text-sm">{order.shippingCity}</p>
          <p className="text-gray-400 text-sm">{order.shippingPhone}</p>
          {order.notes && (
            <div className="mt-3 p-2 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 font-semibold mb-0.5">NOTES</p>
              <p className="text-xs text-gray-400">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-300">Payment</h2>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Method</p>
            <p className="text-white capitalize">{order.paymentMethod || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Status</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              order.paymentStatus === 'COMPLETED'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <Package className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-300">
            Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
          </h2>
        </div>

        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-800">
          <span>Product</span>
          <span className="text-right">Unit Price</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Total</span>
        </div>

        <div className="divide-y divide-gray-800">
          {order.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4 items-center">
              <div className="flex items-center gap-3">
                {item.product?.image ? (
                  <img
                    src={item.product.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover bg-gray-800"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-lg">
                    📦
                  </div>
                )}
                <div>
                  <p className="text-sm text-white font-medium">{item.name}</p>
                  {item.product?.category && (
                    <p className="text-xs text-gray-500">{item.product.category}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400 text-right">${item.price.toFixed(2)}</p>
              <p className="text-sm text-gray-400 text-right">×{item.quantity}</p>
              <p className="text-sm font-bold text-white text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Price summary */}
        <div className="px-5 py-4 border-t border-gray-800 bg-gray-800/40">
          <div className="ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax (10%)</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery</span>
              <span>{order.deliveryFee === 0 ? <span className="text-green-400">Free</span> : `$${order.deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-gray-700">
              <span>Total</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
