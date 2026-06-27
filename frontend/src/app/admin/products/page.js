'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit3, Trash2, ToggleLeft, ToggleRight, Package, Loader, ChevronLeft, ChevronRight, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Beauty', 'Toys', 'Food', 'Other'];

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category: '', image: '' };

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product ? {
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    image: product.image || '',
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const isEdit = !!product;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0, image: form.image || null };

      if (isEdit) {
        await axios.put(`${API_URL}/admin/products/${product.id}`, payload, { headers });
        toast.success('Product updated');
      } else {
        await axios.post(`${API_URL}/admin/products`, payload, { headers });
        toast.success('Product created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Product name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Product description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Price ($)</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Stock</label>
              <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Image URL (optional)</label>
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | 'create' | product object

  const fetchProducts = useCallback(async (page = 1, search = searchQuery, active = activeFilter) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (active !== 'all') params.active = active;
      const res = await axios.get(`${API_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` }, params });
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => { fetchProducts(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    fetchProducts(1, searchInput, activeFilter);
  };

  const handleFilterChange = (val) => {
    setActiveFilter(val);
    fetchProducts(1, searchQuery, val);
  };

  const handleToggle = async (product) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.patch(`${API_URL}/admin/products/${product.id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
    } catch {
      toast.error('Failed to toggle product');
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/admin/products/${product.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Product deleted');
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-gray-500 text-sm">{pagination.total} total products</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {[{ val: 'all', label: 'All' }, { val: 'true', label: 'Active' }, { val: 'false', label: 'Inactive' }].map(({ val, label }) => (
            <button key={val} onClick={() => handleFilterChange(val)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeFilter === val ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Search</button>
          {searchQuery && (
            <button type="button" onClick={() => { setSearchInput(''); setSearchQuery(''); fetchProducts(1, '', activeFilter); }}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors">Clear</button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="w-7 h-7 animate-spin text-indigo-400" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[2fr_1fr_0.8fr_0.8fr_0.6fr_0.5fr_auto] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Orders</span><span>Status</span><span></span>
            </div>
            <div className="divide-y divide-gray-800">
              {products.map((product) => (
                <div key={product.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_0.8fr_0.8fr_0.6fr_0.5fr_auto] gap-4 px-5 py-4 items-center hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-gray-800 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">📦</div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 truncate">{product.description}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{product.category}</span>
                  <span className="text-sm font-semibold text-white">${product.price.toFixed(2)}</span>
                  <span className={`text-sm font-medium ${product.stock <= 5 ? 'text-red-400' : product.stock <= 20 ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {product.stock}
                  </span>
                  <span className="text-sm text-gray-400">{product._count?.orderItems || 0}</span>
                  <button onClick={() => handleToggle(product)} title={product.isActive ? 'Deactivate' : 'Activate'}>
                    {product.isActive
                      ? <ToggleRight className="w-6 h-6 text-green-400" />
                      : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal(product)}
                      className="p-1.5 text-gray-500 hover:text-indigo-400 rounded-lg hover:bg-gray-800 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchProducts(pagination.page - 1)} disabled={!pagination.hasPrev}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400 px-2">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => fetchProducts(pagination.page + 1)} disabled={!pagination.hasNext}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <ProductModal
          product={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchProducts(pagination.page); }}
        />
      )}
    </div>
  );
}
