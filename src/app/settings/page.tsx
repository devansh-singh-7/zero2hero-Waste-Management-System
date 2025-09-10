'use client';
import { useState, useEffect } from 'react';
import { 
  User, Lock, Eye, BarChart3, Trash2, Save, 
  Shield, Globe, Database, History, Share2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';

type UserSettings = {
  // Privacy & Visibility
  publicProfileVisible: boolean;
  profileSearchable: boolean;
  showRealName: boolean;
  
  // Data & Analytics
  personalStatsVisible: boolean;
  dataSharing: 'none' | 'anonymous' | 'full';
  environmentalTracking: boolean;
  collectionHistoryRetention: '3months' | '1year' | '2years' | 'forever';
  
  // Security
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    // Privacy & Visibility
    publicProfileVisible: true,
    profileSearchable: true,
    showRealName: false,
    
    // Data & Analytics
    personalStatsVisible: true,
    dataSharing: 'anonymous',
    environmentalTracking: true,
    collectionHistoryRetention: '1year',
    
    // Security
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/user/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { currentPassword, newPassword, confirmPassword, ...settingsToSave } = settings;
      
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.newPassword !== settings.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (settings.newPassword.length < 6) {
      alert('New password must be at least 6 characters long!');
      return;
    }

    setPasswordChanging(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: settings.currentPassword,
          newPassword: settings.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }

      alert('Password changed successfully!');
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error instanceof Error ? error.message : 'Failed to change password. Please try again.');
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to delete account');
      
      alert('Account deleted successfully. You will be redirected to the homepage.');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-semibold mb-8 text-gray-800">Settings & Privacy</h1>

      <div className="space-y-8">
        {/* Privacy & Visibility Section */}
        <div className="border-b border-gray-200 pb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-blue-600" />
            Public Profile Visibility
          </h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="publicProfileVisible"
                name="publicProfileVisible"
                checked={settings.publicProfileVisible}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="publicProfileVisible" className="ml-3 block text-sm text-gray-700">
                Make my profile visible to other users
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="profileSearchable"
                name="profileSearchable"
                checked={settings.profileSearchable}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="profileSearchable" className="ml-3 block text-sm text-gray-700">
                Allow others to find my profile in search
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showRealName"
                name="showRealName"
                checked={settings.showRealName}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="showRealName" className="ml-3 block text-sm text-gray-700">
                Show my real name on public profile (otherwise username will be shown)
              </label>
            </div>
          </form>
        </div>

        {/* Data & Analytics Section */}
        <div className="border-b border-gray-200 pb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Data & Analytics
          </h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="personalStatsVisible"
                name="personalStatsVisible"
                checked={settings.personalStatsVisible}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="personalStatsVisible" className="ml-3 block text-sm text-gray-700">
                Show personal statistics on my profile
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="environmentalTracking"
                name="environmentalTracking"
                checked={settings.environmentalTracking}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="environmentalTracking" className="ml-3 block text-sm text-gray-700">
                Track my environmental impact (CO2 saved, waste collected, etc.)
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="dataSharing" className="block text-sm font-medium text-gray-700">
                Data Sharing Preferences
              </label>
              <select
                id="dataSharing"
                name="dataSharing"
                value={settings.dataSharing}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="none">Don't share my data</option>
                <option value="anonymous">Share anonymous data for research</option>
                <option value="full">Share all data to help improve the platform</option>
              </select>
              <p className="text-xs text-gray-500">
                Anonymous data helps us improve waste management insights while protecting your privacy
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="collectionHistoryRetention" className="block text-sm font-medium text-gray-700">
                Collection History Retention
              </label>
              <select
                id="collectionHistoryRetention"
                name="collectionHistoryRetention"
                value={settings.collectionHistoryRetention}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="3months">Keep for 3 months</option>
                <option value="1year">Keep for 1 year</option>
                <option value="2years">Keep for 2 years</option>
                <option value="forever">Keep forever</option>
              </select>
              <p className="text-xs text-gray-500">
                How long to keep your waste collection history for analytics and reports
              </p>
            </div>

            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="border-b border-gray-200 pb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-orange-600" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={settings.currentPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={settings.newPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                minLength={6}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={settings.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                minLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={passwordChanging}
            >
              <Shield className="w-4 h-4 mr-2" />
              {passwordChanging ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </div>

        {/* Account Deletion Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-red-600" />
            Account Deletion
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800 mb-4">
              <strong>Warning:</strong> Deleting your account will permanently remove all your data, 
              including your collection history, rewards, and profile information. This action cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-800">
                  Are you absolutely sure? This will permanently delete your account.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Yes, Delete Forever
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}