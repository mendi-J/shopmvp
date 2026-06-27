'use client';

import { useEffect, useState } from 'react';
import { Mail, MessageSquare, Clock, MapPin, CheckCircle } from 'lucide-react';
import { useTrackLens } from '../../hooks/useTrackLens';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const { track, page } = useTrackLens();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    page('Contact', { url: window.location.href });
    track('Page Viewed', { page: 'contact' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission (no backend endpoint needed for demo)
    await new Promise((r) => setTimeout(r, 800));
    track('Contact Submitted', { subject: form.subject, hasMessage: !!form.message });
    setSubmitted(true);
    setLoading(false);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <MessageSquare className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold mb-4">Get in Touch</h1>
          <p className="text-indigo-200 text-lg">We typically respond within 24 hours</p>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info */}
          <div className="space-y-6">
            <div className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">Email</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">support@shopmvp.local</p>
              </div>
            </div>
            <div className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">Support Hours</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">24/7 — we never sleep</p>
              </div>
            </div>
            <div className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">Headquarters</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">San Francisco, CA, USA</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            {submitted ? (
              <div className="card p-10 text-center">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message received!</h2>
                <p className="text-gray-500 dark:text-gray-400">We&apos;ll get back to you at <strong>{form.email}</strong> within 24 hours.</p>
              </div>
            ) : (
              <div className="card p-6 sm:p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                    <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what's on your mind..." className="input-field resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
