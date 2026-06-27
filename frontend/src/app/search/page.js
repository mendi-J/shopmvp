'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTrackLens } from '../../hooks/useTrackLens';
import { searchAPI } from '../../lib/api';
import {
  Search, Bookmark, BookmarkCheck, Trash2, Package, ShoppingBag,
  Loader, X, Clock, ArrowRight,
} from 'lucide-react';

function SearchContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { track, page } = useTrackLens();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [savingSearch, setSavingSearch] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      page('Search', { url: window.location.href });
      fetchSavedSearches();
      if (initialQ) performSearch(initialQ);
    }
  }, [authLoading, isAuthenticated]);

  const fetchSavedSearches = async () => {
    try {
      const res = await searchAPI.getSaved();
      setSavedSearches(res.data.data);
    } catch { /* ignore */ }
  };

  const performSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await searchAPI.search(q.trim(), ['products', 'orders']);
      setResults(res.data.data.results);
      track('Search Executed', { query: q.trim(), source: 'global_search' });
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) {
      toast.error('Enter at least 2 characters');
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query.trim())}`, { scroll: false });
    performSearch(query.trim());
  };

  const handleSaveSearch = async () => {
    if (!query.trim()) return;
    setSavingSearch(true);
    try {
      await searchAPI.save(query.trim());
      track('Search Saved', { query: query.trim() });
      toast.success('Search saved');
      fetchSavedSearches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save search');
    } finally {
      setSavingSearch(false);
    }
  };

  const handleDeleteSaved = async (id, savedQuery) => {
    try {
      await searchAPI.deleteSaved(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      track('Saved Search Deleted', { query: savedQuery });
    } catch {
      toast.error('Failed to delete saved search');
    }
  };

  const handleSavedClick = (savedQuery) => {
    setQuery(savedQuery);
    router.push(`/search?q=${encodeURIComponent(savedQuery)}`, { scroll: false });
    performSearch(savedQuery);
    track('Saved Search Clicked', { query: savedQuery });
  };

  const totalResults = (results?.products?.length ?? 0) + (results?.orders?.length ?? 0);
  const isAlreadySaved = savedSearches.some((s) => s.query.toLowerCase() === query.trim().toLowerCase());

  if (authLoading) {
    return <div className="flex justify-center py-24"><Loader className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Search</h1>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, anything..."
            className="input-field pl-10 pr-4 py-3 text-base"
            autoFocus
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary px-5 py-3">Search</button>
      </form>

      {/* Save search button */}
      {query.trim().length >= 2 && results && (
        <div className="mb-6">
          <button
            onClick={isAlreadySaved ? undefined : handleSaveSearch}
            disabled={savingSearch || isAlreadySaved}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isAlreadySaved ? 'text-green-600 dark:text-green-400 cursor-default' : 'text-indigo-600 dark:text-indigo-400 hover:underline'
            }`}
          >
            {isAlreadySaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {isAlreadySaved ? 'Search saved' : savingSearch ? 'Saving...' : 'Save this search'}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalResults} result{totalResults !== 1 ? 's' : ''} for <strong className="text-gray-700 dark:text-gray-300">"{query.trim()}"</strong>
          </p>

          {/* Products */}
          {results.products?.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Products ({results.products.length})
              </h2>
              <div className="space-y-2">
                {results.products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    onClick={() => track('Search Result Clicked', { type: 'product', id: p.id, name: p.name, query: query.trim() })}
                    className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">${parseFloat(p.price).toFixed(2)}</p>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors ml-auto mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {results.orders?.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Orders ({results.orders.length})
              </h2>
              <div className="space-y-2">
                {results.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    onClick={() => track('Search Result Clicked', { type: 'order', id: o.id, query: query.trim() })}
                    className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{o.orderNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">${parseFloat(o.totalAmount).toFixed(2)}</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="text-center py-16">
              <Search className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No results found</p>
              <p className="text-gray-400 text-sm mt-1">Try different keywords or check your spelling</p>
            </div>
          )}
        </div>
      )}

      {/* Saved searches */}
      {!loading && !results && savedSearches.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Saved Searches
          </h2>
          <div className="space-y-2">
            {savedSearches.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                <button
                  onClick={() => handleSavedClick(s.query)}
                  className="flex items-center gap-2 flex-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {s.query}
                </button>
                <button
                  onClick={() => handleDeleteSaved(s.id, s.query)}
                  className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 ml-2 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !results && savedSearches.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Search className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Search for products, orders, and more</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
