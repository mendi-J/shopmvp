'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Users, Loader, ChevronLeft, ChevronRight, Shield, ShieldOff, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function UserRow({ user, onToggleRole }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    const action = user.role === 'ADMIN' ? 'demote to User' : 'promote to Admin';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.firstName} ${user.lastName}?`)) return;
    setToggling(true);
    try {
      await onToggleRole(user.id);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.8fr_auto] gap-4 px-5 py-4 items-center hover:bg-gray-800/40 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center text-sm font-bold text-indigo-400 uppercase flex-shrink-0">
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-gray-500 truncate">{user.email || user.phone || '—'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
          user.role === 'ADMIN'
            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            : 'bg-gray-700/50 text-gray-400 border-gray-700'
        }`}>
          {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
          {user.role}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {user.isVerified
          ? <CheckCircle className="w-4 h-4 text-green-400" />
          : <XCircle className="w-4 h-4 text-gray-600" />}
        <span className={`text-xs ${user.isVerified ? 'text-green-400' : 'text-gray-600'}`}>
          {user.isVerified ? 'Verified' : 'Unverified'}
        </span>
      </div>
      <span className="text-sm text-gray-400">{user._count?.orders || 0} orders</span>
      <span className="text-xs text-gray-500">
        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
      <button
        onClick={handleToggle}
        disabled={toggling}
        title={user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 ${
          user.role === 'ADMIN'
            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
        }`}
      >
        {toggling ? <Loader className="w-3 h-3 animate-spin" /> : user.role === 'ADMIN' ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
        {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
      </button>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = useCallback(async (page = 1, search = searchQuery, role = roleFilter) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (role !== 'all') params.role = role;
      const res = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` }, params });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    fetchUsers(1, searchInput, roleFilter);
  };

  const handleRoleFilter = (val) => {
    setRoleFilter(val);
    fetchUsers(1, searchQuery, val);
  };

  const handleToggleRole = async (userId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.patch(`${API_URL}/admin/users/${userId}/role`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const newRole = res.data.data.role;
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`User ${newRole === 'ADMIN' ? 'promoted to Admin' : 'demoted to User'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm">{pagination.total} registered users</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {[{ val: 'all', label: 'All' }, { val: 'ADMIN', label: 'Admins' }, { val: 'USER', label: 'Users' }].map(({ val, label }) => (
            <button key={val} onClick={() => handleRoleFilter(val)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${roleFilter === val ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Search</button>
          {searchQuery && (
            <button type="button" onClick={() => { setSearchInput(''); setSearchQuery(''); fetchUsers(1, '', roleFilter); }}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors">Clear</button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="w-7 h-7 animate-spin text-indigo-400" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.8fr_auto] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>User</span><span>Role</span><span>Status</span><span>Orders</span><span>Joined</span><span></span>
            </div>
            <div className="divide-y divide-gray-800">
              {users.map((user) => (
                <UserRow key={user.id} user={user} onToggleRole={handleToggleRole} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchUsers(pagination.page - 1)} disabled={!pagination.hasPrev}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400 px-2">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => fetchUsers(pagination.page + 1)} disabled={!pagination.hasNext}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
