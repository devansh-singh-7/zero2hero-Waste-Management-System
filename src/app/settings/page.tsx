'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Eye, BarChart3, Trash2, Save, 
  Shield, Globe, Database, History, Share2, CheckCircle, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useAlert } from '@/hooks/useAlert';
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
};

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (authLoading) return;
      
      setLoading(true);
      try {
        console.log('Loading user settings...');
        
        const res = await fetch('/api/user/settings', {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('Settings response:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('Loaded settings:', data);
          setSettings(prev => ({ ...prev, ...data }));
        } else {
          console.warn('Failed to load settings, using defaults');
          alert('⚠️ Unable to load your settings. Using default values.\n\nYou can still modify and save your preferences.');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        alert('⚠️ Failed to load settings due to a connection error.\n\nUsing default values. You can still modify your preferences.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [authLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSwitchChange = (name: keyof UserSettings, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      console.log('Saving settings:', settings);
      
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(settings),
      });

      console.log('Settings save response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Settings save failed:', errorData);
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const responseData = await res.json();
      console.log('Settings saved successfully:', responseData);

      setSuccessMessage('✅ Settings saved successfully!');
      
      // Show custom success alert
      showCustomAlert(
        'Settings Saved',
        'Your privacy and data settings have been updated successfully!',
        'success'
      );
      
      // Clear success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      
    } catch (error) {
      console.error('Error updating settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setSuccessMessage('');
      showCustomAlert(
        'Settings Save Failed',
        `Error: ${errorMessage}. Please try again.`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Password is required to delete your account');
      return;
    }

    try {
      console.log('Verifying password and initiating account deletion...');
      setSaving(true);
      setDeleteError('');
      
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      console.log('Delete account response status:', res.status);
      
      if (!res.ok) {
        const responseData = await res.json();
        console.error('Delete account failed:', responseData);
        
        if (res.status === 401) {
          setDeleteError('Incorrect password. Please try again.');
          return;
        }
        
        throw new Error(responseData.error || `Server error: ${res.status}`);
      }
      
      const responseData = await res.json();
      console.log('Account deletion successful:', responseData);
      
      // Show success and redirect
      setShowDeleteModal(false);
      
      // Custom success alert
      showCustomAlert(
        'Account Deleted Successfully',
        'Your account and all associated data have been permanently deleted. You will be redirected to the homepage.',
        'success'
      );
      
      // Clear any stored auth data
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      
      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDeleteError(`Failed to delete account: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error') => {
    // Create a custom styled alert overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const alertBox = document.createElement('div');
    alertBox.className = `bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 ${
      type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
    }`;
    
    alertBox.innerHTML = `
      <div class="flex items-center mb-4">
        <div class="w-6 h-6 mr-3">
          ${type === 'success' 
            ? '<svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
            : '<svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
          }
        </div>
        <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
      </div>
      <p class="text-gray-700 mb-4">${message}</p>
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200">
        OK
      </button>
    `;
    
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
    
    // Add click handler to close
    const closeBtn = alertBox.querySelector('button');
    const closeAlert = () => document.body.removeChild(overlay);
    
    closeBtn?.addEventListener('click', closeAlert);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAlert();
    });
    
    // Auto close after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(closeAlert, 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-semibold mb-8 text-gray-800">Settings & Privacy</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Privacy & Visibility Section */}
        <div className="border-b border-gray-200 pb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-blue-600" />
            Public Profile Visibility
          </h2>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="publicProfileVisible" className="block text-sm font-medium text-gray-700">
                  Make my profile visible to other users
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Other users will be able to see your profile and waste collection achievements
                </p>
              </div>
              <Switch
                id="publicProfileVisible"
                checked={settings.publicProfileVisible}
                onCheckedChange={(checked) => handleSwitchChange('publicProfileVisible', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="profileSearchable" className="block text-sm font-medium text-gray-700">
                  Allow others to find my profile in search
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Your profile will appear in user search results when enabled
                </p>
              </div>
              <Switch
                id="profileSearchable"
                checked={settings.profileSearchable}
                onCheckedChange={(checked) => handleSwitchChange('profileSearchable', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="showRealName" className="block text-sm font-medium text-gray-700">
                  Show my real name on public profile
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Display your real name instead of username on your public profile
                </p>
              </div>
              <Switch
                id="showRealName"
                checked={settings.showRealName}
                onCheckedChange={(checked) => handleSwitchChange('showRealName', checked)}
              />
            </div>
          </form>
        </div>

        {/* Data & Analytics Section */}
        <div className="border-b border-gray-200 pb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Data & Analytics
          </h2>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="personalStatsVisible" className="block text-sm font-medium text-gray-700">
                  Show personal statistics on my profile
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Display your collection stats, rewards earned, and environmental impact
                </p>
              </div>
              <Switch
                id="personalStatsVisible"
                checked={settings.personalStatsVisible}
                onCheckedChange={(checked) => handleSwitchChange('personalStatsVisible', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="environmentalTracking" className="block text-sm font-medium text-gray-700">
                  Track my environmental impact
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Monitor CO2 saved, waste collected, and other environmental metrics
                </p>
              </div>
              <Switch
                id="environmentalTracking"
                checked={settings.environmentalTracking}
                onCheckedChange={(checked) => handleSwitchChange('environmentalTracking', checked)}
              />
            </div>

            <div className="space-y-4">
              <label htmlFor="dataSharing" className="block text-sm font-medium text-gray-700">
                Data Sharing Preferences
              </label>
              <select
                id="dataSharing"
                name="dataSharing"
                value={settings.dataSharing}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="none">Don't share my data</option>
                <option value="anonymous">Share anonymous data for research</option>
                <option value="full">Share all data to help improve the platform</option>
              </select>
              <p className="text-xs text-gray-500">
                Anonymous data helps us improve waste management insights while protecting your privacy
              </p>
            </div>

            <div className="space-y-4">
              <label htmlFor="collectionHistoryRetention" className="block text-sm font-medium text-gray-700">
                Collection History Retention
              </label>
              <select
                id="collectionHistoryRetention"
                name="collectionHistoryRetention"
                value={settings.collectionHistoryRetention}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

            <div className="pt-4">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </div>

        {/* Account Deletion Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-red-600" />
            Account Deletion
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-sm text-red-800 mb-4">
              <strong>Warning:</strong> Deleting your account will permanently remove all your data, 
              including your collection history, rewards, and profile information. This action cannot be undone.
            </p>
            <Button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
              disabled={saving}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {saving ? 'Processing Deletion...' : 'Delete My Account'}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 border-l-4 border-red-500">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 mr-3 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Account Deletion</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-3">
                This action will permanently delete your account and all associated data:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• All waste reports and collection records</li>
                <li>• Your achievements and badges</li>
                <li>• Account settings and preferences</li>
                <li>• Environmental impact data</li>
              </ul>
              <p className="text-red-700 font-medium text-sm">
                This action cannot be undone.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to confirm:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Your account password"
                autoFocus
              />
              {deleteError && (
                <p className="text-red-600 text-sm mt-2">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={saving || !deletePassword.trim()}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}