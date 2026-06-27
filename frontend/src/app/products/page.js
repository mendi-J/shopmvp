'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsAPI } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import { useTrackLens } from '../../hooks/useTrackLens';
import { Search, ChevronLeft, ChevronRight, Loader, PackageSearch } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { track, page } = useTrackLens();

  const q = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false });

  const fetchProducts = async (page = 1, category = selectedCategory, query = q) => {
    try {
      setLoading(true);
      if (query) {
        const res = await productsAPI.search(query, category ? { category } : {});
        setProducts(res.data.data.products);
        setPagination({ page: 1, totalPages: 1, total: res.data.data.total, hasNext: false, hasPrev: false });
      } else {
        const res = await productsAPI.getAll({
          page,
          limit: 12,
          ...(category ? { category } : {}),
        });
        setProducts(res.data.data.products);
        setCategories(res.data.data.categories || []);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    page('Products', { url: window.location.href, query: q, category: categoryParam });
    if (q) track('Search Executed', { query: q, source: 'products_page' });
    if (categoryParam) track('Filter Applied', { filter: categoryParam, source: 'products_page' });
    setSearchInput(q);
    setSelectedCategory(categoryParam);
    fetchProducts(1, categoryParam, q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryParam]);

  const navigate = (newQ, newCategory) => {
    const params = new URLSearchParams();
    if (newQ) params.set('q', newQ);
    if (newCategory) params.set('category', newCategory);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) track('Search Executed', { query: searchInput.trim(), source: 'search_bar' });
    navigate(searchInput.trim(), selectedCategory);
  };

  const handleCategory = (cat) => {
    const next = selectedCategory === cat ? '' : cat;
    if (next) track('Filter Applied', { filter: next, source: 'category_filter' });
    navigate(q, next);
  };

  const handlePage = (page) => {
    fetchProducts(page, selectedCategory, q);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {q ? `Results for "${q}"` : selectedCategory || 'All Products'}
        </h1>
        {!loading && (
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products by name or category..."
            className="input-field pl-10"
          />
        </div>
        <button type="submit" className="btn-primary px-5">
          Search
        </button>
      </form>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => handleCategory('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              !selectedCategory
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <PackageSearch className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No products found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
          {(q || selectedCategory) && (
            <button
              onClick={() => navigate('', '')}
              className="mt-4 text-indigo-600 text-sm hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => handlePage(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                const isActive = pagination.page === page;
                const isNear = Math.abs(pagination.page - page) <= 2;
                const isEdge = page === 1 || page === pagination.totalPages;
                if (!isNear && !isEdge) return null;
                return (
                  <button
                    key={page}
                    onClick={() => handlePage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePage(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
