'use client';

import { useState } from 'react';
import { X, UserPlus, Crown, Shield, Eye, Trash2 } from 'lucide-react';
import { projectsAPI } from '../../../lib/api';
import { useTrackLens } from '../../../hooks/useTrackLens';

const ROLE_CONFIG = {
  OWNER: { label: 'Owner', icon: Crown, color: 'text-yellow-500' },
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-indigo-500' },
  MEMBER: { label: 'Member', icon: null, color: 'text-gray-500' },
  VIEWER: { label: 'Viewer', icon: Eye, color: 'text-gray-400' },
};

const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER', 'VIEWER'];

export default function MembersPanel({ projectId, members, currentUserId, currentRole, onClose, onChange }) {
  const { track } = useTrackLens();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN';

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError('');
    setSuccess('');
    try {
      await projectsAPI.inviteMember(projectId, { email: email.trim(), role });
      setSuccess(`${email.trim()} added as ${role.toLowerCase()}`);
      setEmail('');
      track('Member Invited', { projectId, email: email.trim(), role });
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite member');
    } finally { setInviting(false); }
  };

  const handleRemove = async (member) => {
    if (!confirm(`Remove ${member.user.firstName} ${member.user.lastName} from this project?`)) return;
    try {
      await projectsAPI.removeMember(projectId, member.user.id);
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (member, newRole) => {
    try {
      await projectsAPI.updateMemberRole(projectId, member.user.id, newRole);
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Invite form */}
          {canManage && (
            <form onSubmit={handleInvite} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                Invite Member
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              {success && <p className="text-xs text-green-600">{success}</p>}
              <button type="submit" disabled={inviting || !email.trim()} className="btn-primary text-sm disabled:opacity-50">
                {inviting ? 'Inviting...' : 'Invite'}
              </button>
            </form>
          )}

          {/* Members list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{members.length} {members.length === 1 ? 'Member' : 'Members'}</h3>
            {members.map((m) => {
              const cfg = ROLE_CONFIG[m.role] || ROLE_CONFIG.MEMBER;
              const Icon = cfg.icon;
              const isSelf = m.user.id === currentUserId;
              const canChangeRole = currentRole === 'OWNER' && m.role !== 'OWNER';
              const canRemove = (canManage && m.role !== 'OWNER') || isSelf;

              return (
                <div key={m.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase flex-shrink-0">
                    {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {m.user.firstName} {m.user.lastName} {isSelf && <span className="text-gray-400 font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                  </div>
                  {canChangeRole ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                      {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                    </select>
                  ) : (
                    <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                      {Icon && <Icon className="w-3 h-3" />}
                      {cfg.label}
                    </span>
                  )}
                  {canRemove && (
                    <button onClick={() => handleRemove(m)} className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
