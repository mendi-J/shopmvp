'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrackLens } from '../../../hooks/useTrackLens';
import { Eye, EyeOff, Package } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { track, page, identify } = useTrackLens();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { page('Login', { url: window.location.href }); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const isPhone = (val) => /^\+?[\d\s\-()]{7,}$/.test(val.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier) {
      toast.error('Please enter your email or phone number');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        password: form.password,
        ...(isPhone(form.identifier)
          ? { phone: form.identifier.trim() }
          : { email: form.identifier.trim() }),
      };
      const res = await authAPI.login(payload);
      const { token, user } = res.data.data;
      login(user, token);
      identify(user.id, { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role });
      track('Login Success', { userId: user.id, method: isPhone(form.identifier) ? 'phone' : 'email' });
      toast.success(`Welcome back, ${user.firstName}!`);
      router.push('/dashboard');
    } catch (error) {
      const err = error.response?.data;
      if (err?.data?.requiresVerification) {
        track('Login Failed', { reason: 'unverified_account' });
        toast.error('Please verify your account first');
        router.push(`/auth/verify-otp?userId=${err.data.userId}`);
        return;
      }
      track('Login Failed', { reason: err?.message || 'invalid_credentials' });
      toast.error(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-xl">ShopMVP</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Phone Number
              </label>
              <input
                type="text"
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                required
                placeholder="john@example.com or +1234567890"
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Your password"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-xs font-semibold text-indigo-700 mb-1">Demo Account</p>
            <p className="text-xs text-indigo-600">Email: test@example.com</p>
            <p className="text-xs text-indigo-600">Password: password123</p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
