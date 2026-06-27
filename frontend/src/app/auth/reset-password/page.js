'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import { useTrackLens } from '../../../hooks/useTrackLens';
import toast from 'react-hot-toast';

function ResetForm() {
  const { track, page } = useTrackLens();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    page('Reset Password', { url: window.location.href, hasToken: !!token });
    if (!token) track('Password Reset Error', { reason: 'missing_token' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      setLoading(true);
      await authAPI.resetPassword(token, form.password);
      track('Password Reset Completed', { success: true });
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. The link may have expired.';
      toast.error(msg);
      track('Password Reset Error', { reason: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Invalid reset link</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">This link is missing or malformed.</p>
        <Link href="/auth/forgot-password" className="btn-primary text-sm">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Password reset!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            placeholder="Minimum 8 characters"
            className="input-field pr-10"
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
        <input
          type={showPw ? 'text' : 'password'}
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          required
          placeholder="Repeat your new password"
          className="input-field"
          autoComplete="new-password"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-xl">ShopMVP</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set a new password</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose a strong password you haven&apos;t used before</p>
        </div>
        <div className="card p-6 sm:p-8">
          <Suspense fallback={<div className="text-center text-gray-500 py-8">Loading...</div>}>
            <ResetForm />
          </Suspense>
          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
