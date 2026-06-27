'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { useTrackLens } from '../../hooks/useTrackLens';

const POSTS = [
  { slug: 'top-10-gadgets-2025', title: 'Top 10 Gadgets You Need in 2025', category: 'Electronics', date: 'Jun 10, 2025', read: '4 min read', excerpt: 'From AI-powered earbuds to foldable displays, here are the gadgets reshaping how we live and work this year.', author: 'Jordan Lee', authorAvatar: 'JL' },
  { slug: 'sustainable-fashion-guide', title: 'The Complete Guide to Sustainable Fashion', category: 'Fashion', date: 'Jun 5, 2025', read: '6 min read', excerpt: 'How to build a wardrobe that looks great, feels great, and does good for the planet — without breaking the bank.', author: 'Mia Okafor', authorAvatar: 'MO' },
  { slug: 'home-office-setup', title: 'Build the Perfect Home Office on a Budget', category: 'Home', date: 'May 28, 2025', read: '5 min read', excerpt: 'Ergonomics, lighting, and organisation tips that boost productivity without costing a fortune.', author: 'Sam Chen', authorAvatar: 'SC' },
  { slug: 'sports-gear-beginners', title: 'Best Sports Gear for Absolute Beginners', category: 'Sports', date: 'May 20, 2025', read: '5 min read', excerpt: 'Starting a new sport can be overwhelming. Here\'s the essential gear you actually need — and what you can skip.', author: 'Alex Rivera', authorAvatar: 'AR' },
  { slug: 'smart-home-devices', title: 'Smart Home Devices That Actually Work', category: 'Electronics', date: 'May 15, 2025', read: '7 min read', excerpt: 'Cutting through the hype to find smart home products that deliver real value and don\'t require a computer science degree.', author: 'Jordan Lee', authorAvatar: 'JL' },
  { slug: 'fashion-colour-trends', title: 'Colour Trends Dominating Fashion This Season', category: 'Fashion', date: 'May 8, 2025', read: '3 min read', excerpt: 'The palette experts say you\'ll be reaching for all season — and how to work each colour into your existing wardrobe.', author: 'Mia Okafor', authorAvatar: 'MO' },
];

const CATEGORIES = ['All', ...new Set(POSTS.map((p) => p.category))];

const CATEGORY_COLORS = {
  Electronics: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Fashion: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  Home: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Sports: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function BlogPage() {
  const { track, page } = useTrackLens();
  const [category, setCategory] = useState('All');

  useEffect(() => {
    page('Blog', { url: window.location.href });
    track('Blog Viewed', { source: 'direct' });
  }, []);

  const filtered = category === 'All' ? POSTS : POSTS.filter((p) => p.category === category);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold mb-4">ShopMVP Blog</h1>
          <p className="text-indigo-200 text-lg">Tips, guides, trends and inspiration from our team</p>
        </div>
      </section>

      <section className="py-12 max-w-6xl mx-auto px-4">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); track('Filter Applied', { filter: cat, source: 'blog' }); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              onClick={() => track('Article Viewed', { slug: post.slug, title: post.title, category: post.category })}
              className="card p-6 hover:shadow-md transition-all duration-200 group flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>{post.category}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {post.read}
                </span>
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug flex-1">{post.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">{post.authorAvatar}</div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{post.author}</span>
                </div>
                <span className="text-xs text-gray-400">{post.date}</span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No posts in this category yet.</div>
        )}
      </section>
    </div>
  );
}
