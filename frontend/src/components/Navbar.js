'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, Search, Package, Menu, X, LayoutDashboard, Sun, Moon, Bell, Heart, FolderKanban } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTrackLens } from '../hooks/useTrackLens';
import { notificationsAPI } from '../lib/api';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { track } = useTrackLens();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return; }
    const fetchUnread = () => {
      notificationsAPI.list({ unreadOnly: 'true', limit: '1' })
        .then((res) => setUnreadCount(res.data.data.unreadCount))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    track('Logout', { userId: user?.id });
    logout();
    setMobileOpen(false);
    router.push('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const handleThemeToggle = () => {
    track('Theme Changed', { from: theme, to: theme === 'light' ? 'dark' : 'light' });
    toggleTheme();
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ShopMVP</span>
          </Link>

          {/* Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/products" className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Products</Link>
            <Link href="/pricing" className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Pricing</Link>
            <Link href="/blog" className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Blog</Link>

            {/* Theme toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/projects" className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4" />
                  Projects
                </Link>
                <Link href="/wishlist" className="p-2 text-gray-500 dark:text-gray-400 hover:text-pink-500 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors" title="Wishlist">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link href="/notifications" className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" title="Notifications">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/cart" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className="flex items-center gap-1.5 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <User className="w-4 h-4" />
                  <span>{user?.firstName}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Login</Link>
                <Link href="/auth/register" className="btn-primary text-sm">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile: icons + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <button onClick={handleThemeToggle} className="p-2 text-gray-500 dark:text-gray-400 rounded-lg">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {isAuthenticated && (
              <Link href="/cart" className="relative p-2 text-gray-600 dark:text-gray-300">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600 dark:text-gray-300">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-700 py-3 space-y-1 animate-fade-in">
            <form onSubmit={handleSearch} className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </form>
            <Link href="/products" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Products</Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Pricing</Link>
            <Link href="/blog" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Blog</Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Dashboard</Link>
                <Link href="/projects" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Projects</Link>
                <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unreadCount}</span>}
                </Link>
                <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Wishlist</Link>
                <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <span>Cart</span>
                  {itemCount > 0 && <span className="bg-indigo-600 text-white text-xs font-bold rounded-full px-2 py-0.5">{itemCount}</span>}
                </Link>
                <Link href="/orders" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">My Orders</Link>
                <Link href="/settings" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Settings</Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Profile</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Login</Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-indigo-600 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
