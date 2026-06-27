'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTrackLens } from '../../hooks/useTrackLens';
import { settingsAPI } from '../../lib/api';
import {
  Palette, Globe, Shield, Key, Loader, Save, Plus, Trash2,
  Copy, Eye, EyeOff, CheckCircle, AlertCircle, Moon, Sun,
} from 'lucide-react';

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language & Region', icon: Globe },
  { id: 'privacy', label: 'Privacy & Notifications', icon: Shield },
  { id: 'api', label: 'API Keys', icon: Key },
];

const LANGUAGES = [
  { code: 'en', label: 'English (US)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
];

function ApiKeyRow({ k, onRevoke }) {
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(k.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <div className="flex-1 min-w-0 mr-4">
        <p className="font-semibold text-sm text-gray-900 dark:text-white">{k.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            {k.key}
          </code>
          <button onClick={copyKey} className="text-gray-400 hover:text-indigo-600 transition-colors">
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Created {new Date(k.createdAt).toLocaleDateString()} ·{' '}
          {k.lastUsed ? `Last used ${new Date(k.lastUsed).toLocaleDateString()}` : 'Never used'}
        </p>
      </div>
      <button
        onClick={() => onRevoke(k.id, k.name)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
        title="Revoke"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { track, page } = useTrackLens();

  const [activeTab, setActiveTab] = useState('appearance');
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);

  // API keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [generatingKey, setGeneratingKey] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      page('Settings', { url: window.location.href });
      track('Page Viewed', { page: 'settings' });
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    settingsAPI.get()
      .then((res) => setSettings(res.data.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoadingSettings(false));
  }, [isAuthenticated]);

  const fetchApiKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const res = await settingsAPI.listApiKeys();
      setApiKeys(res.data.data);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'api' && isAuthenticated) fetchApiKeys();
  }, [activeTab, isAuthenticated, fetchApiKeys]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      track('Settings Updated', { section: activeTab });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }
    setGeneratingKey(true);
    try {
      const res = await settingsAPI.generateApiKey(newKeyName.trim());
      setCreatedKey(res.data.data);
      setNewKeyName('');
      track('API Key Generated', { keyName: newKeyName.trim() });
      fetchApiKeys();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate key');
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (id, name) => {
    if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;
    try {
      await settingsAPI.revokeApiKey(id);
      track('API Key Revoked', { keyId: id });
      toast.success('API key revoked');
      fetchApiKeys();
    } catch {
      toast.error('Failed to revoke key');
    }
  };

  if (authLoading || loadingSettings) {
    return (
      <div className="flex justify-center py-24">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <nav className="sm:w-52 flex-shrink-0">
          <ul className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  onClick={() => { setActiveTab(id); setCreatedKey(null); track('Settings Tab Clicked', { tab: id }); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    activeTab === id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Theme</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how ShopMVP looks</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
                    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      onClick={() => {
                        if (theme !== value) {
                          toggleTheme();
                          track('Theme Changed', { from: theme, to: value, source: 'settings' });
                        }
                      }}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        theme === value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${theme === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                      <p className={`font-semibold text-sm ${theme === value ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Language */}
          {activeTab === 'language' && settings && (
            <div className="card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Language</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select your preferred display language</p>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => { setSettings({ ...settings, language: code }); track('Language Changed', { language: code }); }}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                        settings.language === code
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Language'}
              </button>
            </div>
          )}

          {/* Privacy & Notifications */}
          {activeTab === 'privacy' && settings && (
            <div className="card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Notifications</h2>
                <div className="space-y-4">
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
                        onClick={() => { handleToggle(key); track('Notification Setting Changed', { setting: key, value: !settings[key] }); }}
                        className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Privacy</h2>
                <div className="space-y-4">
                  {[
                    { key: 'dataSharing', label: 'Analytics Data Sharing', desc: 'Help improve ShopMVP by sharing anonymous usage data' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => { handleToggle(key); track('Privacy Setting Changed', { setting: key, value: !settings[key] }); }}
                        className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <div className="card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">API Keys</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Generate keys to access the ShopMVP API from external tools or integrations. Max 5 active keys.</p>
              </div>

              {/* One-time key reveal */}
              {createdKey && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-green-800 dark:text-green-400 text-sm">Key created: {createdKey.name}</p>
                      <p className="text-xs text-green-700 dark:text-green-500 mb-2">Copy it now — it won't be shown again.</p>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2">
                        <code className="text-xs font-mono flex-1 overflow-hidden text-ellipsis text-gray-800 dark:text-gray-200">{createdKey.key}</code>
                        <button
                          onClick={() => { navigator.clipboard.writeText(createdKey.key); toast.success('Copied!'); }}
                          className="text-green-600 hover:text-green-700 flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate form */}
              <div className="flex gap-3">
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Production App)"
                  className="input-field flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateKey()}
                />
                <button
                  onClick={handleGenerateKey}
                  disabled={generatingKey || !newKeyName.trim()}
                  className="btn-primary flex items-center gap-2 px-4"
                >
                  <Plus className="w-4 h-4" />
                  {generatingKey ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {/* Key list */}
              {loadingKeys ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Key className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No API keys yet. Generate your first one above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((k) => (
                    <ApiKeyRow key={k.id} k={k} onRevoke={handleRevokeKey} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
