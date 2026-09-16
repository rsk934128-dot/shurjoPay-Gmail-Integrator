import React, { useState, useEffect } from 'react';
import { Settings, Bell, Loader2, BellOff, CreditCard, History, Mail, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { subscribeToUserSettings, updateUserSettings } from '../lib/firestore';
import { auth } from '../lib/firebase';
import { UserSettings } from '../types';
import { useToast } from './Toast';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const unsubscribe = subscribeToUserSettings(auth.currentUser.uid, (newSettings) => {
      setSettings(newSettings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleNotifications = async () => {
    if (!settings) return;
    
    setSaving(true);
    const newValue = !settings.emailNotificationsEnabled;
    
    try {
      await updateUserSettings({ emailNotificationsEnabled: newValue });
      setSettings({ ...settings, emailNotificationsEnabled: newValue });
      showToast(
        newValue 
          ? 'Email notifications enabled' 
          : 'Email notifications disabled', 
        'info'
      );
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleCardVisibility = async (card: keyof UserSettings['visibleCards']) => {
    if (!settings) return;
    
    setSaving(true);
    const newVisibleCards = {
      ...settings.visibleCards,
      [card]: !settings.visibleCards[card]
    };
    
    try {
      await updateUserSettings({ visibleCards: newVisibleCards });
      setSettings({ ...settings, visibleCards: newVisibleCards });
      showToast(`${card.charAt(0).toUpperCase() + card.slice(1)} card ${newVisibleCards[card] ? 'shown' : 'hidden'}`, 'info');
    } catch (error) {
      console.error('Error updating visibility:', error);
      showToast('Failed to update visibility settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = async () => {
    if (!settings) return;
    
    setSaving(true);
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    
    try {
      await updateUserSettings({ theme: newTheme });
      setSettings({ ...settings, theme: newTheme });
      showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`, 'info');
    } catch (error) {
      console.error('Error updating theme:', error);
      showToast('Failed to update theme', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-neutral-100 rounded mb-4" />
        <div className="h-10 w-full bg-neutral-50 rounded" />
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl border shadow-sm transition-all duration-300 ${
      settings?.theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg transition-colors ${
          settings?.theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-50'
        }`}>
          <Settings className={`w-5 h-5 transition-colors ${
            settings?.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
          }`} />
        </div>
        <h2 className={`text-xl font-semibold transition-colors ${
          settings?.theme === 'dark' ? 'text-white' : 'text-neutral-900'
        }`}>User Settings</h2>
      </div>

      <div className="space-y-4">
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
          settings?.theme === 'dark' ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${
              settings?.emailNotificationsEnabled 
                ? (settings?.theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-50') 
                : (settings?.theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200')
            }`}>
              {settings?.emailNotificationsEnabled ? (
                <Bell className={`w-4 h-4 transition-colors ${
                  settings?.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              ) : (
                <BellOff className="w-4 h-4 text-neutral-500" />
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold transition-colors ${
                settings?.theme === 'dark' ? 'text-white' : 'text-neutral-900'
              }`}>Gmail Notifications</p>
              <p className="text-xs text-neutral-500">Auto-send receipts after payment</p>
            </div>
          </div>

          <button
            onClick={toggleNotifications}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings?.emailNotificationsEnabled ? 'bg-blue-600' : 'bg-neutral-300'
            }`}
          >
            <span className="sr-only">Toggle notifications</span>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            {saving && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              </div>
            )}
          </button>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
          settings?.theme === 'dark' ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${settings?.theme === 'dark' ? 'bg-indigo-900/40' : 'bg-amber-100'}`}>
              {settings?.theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-600" />
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold transition-colors ${
                settings?.theme === 'dark' ? 'text-white' : 'text-neutral-900'
              }`}>Visual Theme</p>
              <p className="text-xs text-neutral-500">{settings?.theme === 'dark' ? 'Dark' : 'Light'} mode enabled</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings?.theme === 'dark' ? 'bg-indigo-600' : 'bg-amber-400'
            }`}
          >
            <span className="sr-only">Toggle theme</span>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className={`pt-4 border-t transition-colors ${
          settings?.theme === 'dark' ? 'border-neutral-800' : 'border-neutral-100'
        }`}>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 px-1">Dashboard Layout</h3>
          
          <div className="space-y-3">
            {[
              { id: 'payments' as const, label: 'Payment Gateway', icon: CreditCard },
              { id: 'history' as const, label: 'Transaction History', icon: History },
              { id: 'gmail' as const, label: 'Gmail Communication', icon: Mail },
            ].map((card) => (
              <div key={card.id} className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <card.icon className="w-4 h-4 text-neutral-400" />
                  <span className={`text-sm transition-colors ${
                    settings?.theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'
                  }`}>{card.label}</span>
                </div>
                <button
                  onClick={() => toggleCardVisibility(card.id)}
                  disabled={saving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    settings?.visibleCards[card.id] 
                      ? (settings?.theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600') 
                      : (settings?.theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-300')
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings?.visibleCards[card.id] ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
