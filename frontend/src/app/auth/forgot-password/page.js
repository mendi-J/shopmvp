'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, CheckCircle, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import { useTrackLens } from '../../../hooks/useTrackLens';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { track, page } = useTrackLens();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    page('Forgot Password', { url: window.location.href });
    track('Password Reset Requested', { step: 'page_viewed' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authAPI.forgotPassword(email);
      track('Password Reset Requested', { step: 'email_submitted', email_domain: email.split('@')[1] });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot your password?</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No worries — we&apos;ll send you a reset link</p>
        </div>

        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                If <strong>{email}</strong> is registered, we&apos;ve sent a reset link. It expires in 30 minutes.
              </p>
              <p className="text-xs text-gray-400 mb-4">Didn&apos;t receive it? Check your spam folder or try again.</p>
              <button
                onClick={() => setSent(false)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="john@example.com"
                  className="input-field"
                  autoComplete="email"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending reset link...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
