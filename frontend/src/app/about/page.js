'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Users, Package, Globe, HeartHandshake, ArrowRight } from 'lucide-react';
import { useTrackLens } from '../../hooks/useTrackLens';

const TEAM = [
  { name: 'Alex Rivera', role: 'Co-founder & CEO', avatar: 'AR', bio: 'Former product lead at two YC startups. Passionate about making online shopping accessible.' },
  { name: 'Jordan Lee', role: 'Co-founder & CTO', avatar: 'JL', bio: '10 years building e-commerce infrastructure. Obsessed with performance and reliability.' },
  { name: 'Sam Chen', role: 'Head of Product', avatar: 'SC', bio: 'UX researcher turned PM. Believes great products are built by listening to users first.' },
  { name: 'Mia Okafor', role: 'Head of Operations', avatar: 'MO', bio: 'Supply chain expert with experience across 15 countries and 5 continents.' },
];

export default function AboutPage() {
  const { track, page } = useTrackLens();

  useEffect(() => {
    page('About', { url: window.location.href });
    track('Page Viewed', { page: 'about' });
  }, []);

  return (
    <div className="min-h-screen dark:bg-gray-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Built for Shoppers, by Shoppers</h1>
          <p className="text-indigo-200 text-xl max-w-2xl mx-auto">ShopMVP started as a simple idea: shopping online should be fast, affordable, and enjoyable — for everyone.</p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-1 rounded-full mb-4">OUR MISSION</div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Democratising great shopping</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                We believe everyone deserves access to quality products at fair prices, delivered quickly and reliably. ShopMVP was founded in 2023 to bridge the gap between great products and the people who need them.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Today, we serve over 50,000 customers across the US, with a catalogue of 10,000+ products spanning electronics, fashion, home, and sports.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Package, label: '10,000+', sub: 'Products', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
                { icon: Users, label: '50,000+', sub: 'Customers', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
                { icon: Globe, label: '50 States', sub: 'Coverage', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
                { icon: HeartHandshake, label: '24/7', sub: 'Support', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
              ].map(({ icon: Icon, label, sub, color }) => (
                <div key={sub} className={`${color} rounded-2xl p-5 text-center`}>
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-extrabold text-xl">{label}</div>
                  <div className="text-xs font-medium opacity-80">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">What We Stand For</h2>
            <p className="text-gray-500 dark:text-gray-400">The principles that guide every decision we make</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Customer First', desc: 'Every feature, every policy, and every process starts with one question: does this make things better for our customers?', icon: '❤️' },
              { title: 'Radical Transparency', desc: "No hidden fees. No bait-and-switch pricing. What you see is what you pay — every single time.", icon: '🔍' },
              { title: 'Relentless Quality', desc: 'We personally vet every product and supplier. If it doesn\'t meet our standards, it doesn\'t make the catalogue.', icon: '⭐' },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="card p-6">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Meet the Team</h2>
            <p className="text-gray-500 dark:text-gray-400">The people behind ShopMVP</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, avatar, bio }) => (
              <div key={name} className="card p-6 text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold text-lg mx-auto mb-4">{avatar}</div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-3">{role}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to start shopping?</h2>
          <p className="text-indigo-200 mb-6">Join 50,000+ happy customers today.</p>
          <Link href="/auth/register" onClick={() => track('CTA Clicked', { cta: 'Join Now', location: 'about_page' })} className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
