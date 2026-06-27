'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTrackLens } from '../../hooks/useTrackLens';
import { notificationsAPI } from '../../lib/api';
import { Bell, CheckCheck, Trash2, Loader, Package, ShoppingBag, Info, Tag } from 'lucide-react';

const TYPE_CONFIG = {
  order: { icon: Package, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
  promo: { icon: Tag, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  system: { icon: Info, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  default: { icon: Bell, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
};

function NotifIcon({ type }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
  const Icon = cfg.icon;
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
}

export default function NotificationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { track, page } = useTrackLens();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      page('Notifications', { url: window.location.href });
      track('Page Viewed', { page: 'notifications' });
    }
  }, [authLoading, isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params = filter === 'unread' ? { unreadOnly: 'true' } : {};
      const res = await notificationsAPI.list(params);
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
      track('Notification Read', { notificationId: id });
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      track('All Notifications Read');
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await notificationsAPI.dismiss(id);
      const n = notifications.find((x) => x.id === id);
      setNotifications((prev) => prev.filter((x) => x.id !== id));
      if (!n?.read) setUnreadCount((c) => Math.max(0, c - 1));
      track('Notification Dismissed', { notificationId: id });
    } catch {
      toast.error('Failed to dismiss notification');
    }
  };

  if (authLoading) {
    return <div className="flex justify-center py-24"><Loader className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        {[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setFilter(value); track('Notification Filter Applied', { filter: value }); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              filter === value ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h2>
          <p className="text-gray-400 text-sm">
            {filter === 'unread' ? 'You\'re all caught up!' : 'We\'ll notify you when something important happens.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start gap-3 transition-all ${
                !n.read ? 'border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10' : ''
              }`}
            >
              <NotifIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {n.title}
                    {!n.read && <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full ml-2 align-middle" />}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                <div className="flex items-center gap-3 mt-2">
                  {n.link && (
                    <Link href={n.link} onClick={() => { if (!n.read) handleMarkRead(n.id); track('Notification Link Clicked', { notificationId: n.id, link: n.link }); }} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                      View →
                    </Link>
                  )}
                  {!n.read && (
                    <button onClick={() => handleMarkRead(n.id)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      Mark read
                    </button>
                  )}
                  <button onClick={() => handleDismiss(n.id)} className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
