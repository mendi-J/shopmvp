'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrackLens } from '../../../hooks/useTrackLens';
import { ShieldCheck, RotateCcw } from 'lucide-react';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { track, page } = useTrackLens();

  const userId = searchParams.get('userId');
  const contact = searchParams.get('contact');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!userId) {
      router.push('/auth/register');
      return;
    }
    page('Verify OTP', { url: window.location.href });
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [userId, router]);

  const formatCountdown = () => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    try {
      setLoading(true);
      const res = await authAPI.verifyOTP({ userId, code });
      const { token, user } = res.data.data;
      login(user, token);
      track('OTP Verified', { userId, success: true });
      toast.success('Account verified! Welcome to ShopMVP!');
      router.push('/dashboard');
    } catch (error) {
      track('OTP Verification Failed', { userId, reason: error.response?.data?.message || 'invalid_code' });
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 && countdown < 270) {
      toast.error('Please wait before requesting a new OTP');
      return;
    }
    try {
      setResending(true);
      await authAPI.resendOTP(userId);
      setCountdown(300);
      setOtp(['', '', '', '', '', '']);
      toast.success('New verification code sent!');
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
            <ShieldCheck className="w-9 h-9 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Account</h1>
          <p className="text-gray-500 text-sm mb-1">We sent a 6-digit code to</p>
          <p className="text-indigo-600 font-semibold mb-6 text-sm">
            {contact || 'your contact method'}
          </p>
          <p className="text-xs text-gray-400 mb-6 -mt-4">
            In dev mode, the OTP is printed in the backend server logs.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              className="flex gap-2 justify-center mb-6"
              onPaste={handlePaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  maxLength={1}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-white"
                />
              ))}
            </div>

            <div className="text-sm mb-5">
              {countdown > 0 ? (
                <span className="text-gray-500">
                  Code expires in{' '}
                  <span className="font-bold text-indigo-600">{formatCountdown()}</span>
                </span>
              ) : (
                <span className="text-red-500 font-medium">Code expired. Please resend.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="btn-primary w-full py-3 text-base mb-3"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <button
            onClick={handleResend}
            disabled={resending}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline mx-auto disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
