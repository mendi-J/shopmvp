'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { profileAPI, settingsAPI } from '../../lib/api';
import { useTrackLens } from '../../hooks/useTrackLens';
import {
  User, Lock, Save, Loader, Package, Eye, EyeOff,
  Camera, Trash2, AlertTriangle, Bell, Settings,
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile Info', icon: User },
  { id: 'password', label: 'Change Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

export default function ProfilePage() {
  const { isAuthenticated, loading: authLoading, updateUser, logout } = useAuth();
  const router = useRouter();
  const { track, page } = useTrackLens();
  const avatarInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifSettings, setNotifSettings] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      page('Profile', { url: window.location.href });
      track('Page Viewed', { page: 'profile' });
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      profileAPI.get(),
      settingsAPI.get(),
    ]).then(([profileRes, settingsRes]) => {
      const data = profileRes.data.data;
      setProfile(data);
      setProfileForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
      });
      setNotifSettings(settingsRes.data.data);
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoadingProfile(false));
  }, [isAuthenticated]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const res = await profileAPI.uploadAvatar(formData);
      setProfile((prev) => ({ ...prev, avatar: res.data.data.avatar }));
      track('Avatar Uploaded', { success: true });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.firstName || !profileForm.lastName) {
      toast.error('First and last name are required');
      return;
    }
    try {
      setSavingProfile(true);
      const res = await profileAPI.update(profileForm);
      updateUser(res.data.data);
      track('Profile Updated', { fieldsChanged: Object.keys(profileForm).filter(Boolean) });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    try {
      setSavingPassword(true);
      await profileAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      track('Password Changed', { success: true });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifSettings = async () => {
    if (!notifSettings) return;
    setSavingNotif(true);
    try {
      await settingsAPI.update({
        emailNotifications: notifSettings.emailNotifications,
        pushNotifications: notifSettings.pushNotifications,
        marketingEmails: notifSettings.marketingEmails,
      });
      track('Notification Preferences Updated');
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSavingNotif(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Enter your password to confirm');
      return;
    }
    setDeletingAccount(true);
    try {
      await profileAPI.deleteAccount(deletePassword);
      track('Account Deleted');
      toast.success('Account deleted. Goodbye!');
      logout();
      router.push('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  const togglePassword = (field) => setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  // Avatar URL is now a full Cloudinary https:// URL — no prefix needed
  const avatarSrc = profile?.avatar || null;

  if (authLoading || loadingProfile) {
    return <div className="flex justify-center py-24"><Loader className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Avatar section */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden">
            {avatarSrc ? (
              <Image src={avatarSrc} alt="Avatar" width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </span>
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg"
          >
            {uploadingAvatar ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg">{profile?.firstName} {profile?.lastName}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{profile?.email || profile?.phone}</p>
          {profile && (
            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              {profile._count?.orders || 0} order{profile._count?.orders !== 1 ? 's' : ''} · Member since{' '}
              {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
              activeTab === id ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            } ${id === 'danger' && activeTab !== 'danger' ? 'hover:text-red-500' : ''}`}
          >
            <Icon className={`w-4 h-4 ${id === 'danger' ? 'text-red-500' : ''}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                <input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                <input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} required className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="john@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+1 234 567 8900" className="input-field" />
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold">
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Password tab */}
      {activeTab === 'password' && (
        <div className="card p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {[
              { field: 'current', label: 'Current Password', key: 'currentPassword', placeholder: 'Your current password' },
              { field: 'new', label: 'New Password', key: 'newPassword', placeholder: 'Min. 8 characters' },
              { field: 'confirm', label: 'Confirm New Password', key: 'confirmPassword', placeholder: 'Repeat new password' },
            ].map(({ field, label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={showPasswords[field] ? 'text' : 'password'}
                    value={passwordForm[key]}
                    onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                    required
                    placeholder={placeholder}
                    className="input-field pr-10"
                  />
                  <button type="button" onClick={() => togglePassword(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPasswords[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={savingPassword} className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold">
              <Lock className="w-4 h-4" />
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && notifSettings && (
        <div className="card p-6">
          <div className="space-y-4 mb-6">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Order updates, shipping alerts, and account info' },
              { key: 'pushNotifications', label: 'Push Notifications', desc: 'Real-time alerts in your browser' },
              { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Deals, new products, and promotions' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${notifSettings[key] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifSettings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSaveNotifSettings} disabled={savingNotif} className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold">
            <Save className="w-4 h-4" />
            {savingNotif ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* Danger zone tab */}
      {activeTab === 'danger' && (
        <div className="card p-6 border border-red-200 dark:border-red-900/50">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-red-600 dark:text-red-400">Delete Account</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold text-sm rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete my account
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                This will permanently delete all your orders, cart, profile data, and account. Type your password to confirm.
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Enter your password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  className="input-field"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }} className="btn-secondary flex-1 py-2.5">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || !deletePassword}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
