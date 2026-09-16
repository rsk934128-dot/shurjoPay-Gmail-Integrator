import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  LogOut, 
  LayoutDashboard, 
  CreditCard, 
  Mail, 
  Wallet,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logout } from './lib/auth';
import { subscribeToUserSettings } from './lib/firestore';
import ShurjoPay from './components/ShurjoPay';
import GmailIntegrator from './components/GmailIntegrator';
import PaymentHistory from './components/PaymentHistory';
import SettingsPanel from './components/SettingsPanel';
import PaymentDebugger from './components/PaymentDebugger';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useToast } from './components/Toast';
import { UserSettings } from './types';
import { formatCurrency } from './lib/formatters';
import { fetchWithRetry } from './lib/api-utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'gmail'>('dashboard');
  const { showToast } = useToast();

  useEffect(() => {
    let unsubscribeSettings: (() => void) | undefined;

    const unsubscribeAuth = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
        
        // Subscribe to real-time settings updates
        unsubscribeSettings = subscribeToUserSettings(user.uid, (newSettings) => {
          setSettings(newSettings);
          setLoading(false);
        });

        checkPaymentStatus();
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, []);

  const checkPaymentStatus = async () => {
    const params = new URLSearchParams(window.location.search);
    const order_id = params.get('order_id');
    
    if (order_id) {
      // Clear URL params to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);
      
      try {
        const response = await fetchWithRetry('/api/shurjopay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id }),
        });
        const data = await response.json();
        
        if (data && data[0] && data[0].sp_code === '1000') {
          showToast(`Payment verified successfully! Amount: ${formatCurrency(Number(data[0].amount), data[0].currency)}`, 'success');
        } else {
          showToast('Payment verification failed or was cancelled.', 'error');
        }
      } catch (err) {
        console.error('Verification error:', err);
        showToast('Error verifying payment status.', 'error');
      }
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('The login popup was closed before completion. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('The login popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to sign in. Please ensure popups are allowed and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">shurjoPay & Gmail</h1>
          <p className="text-neutral-500 mb-8">Securely manage your payments and communications in one place.</p>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-xl transition-all shadow-sm group"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span className="text-neutral-700 font-medium group-hover:text-neutral-900">Sign in with Google</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${settings?.theme === 'dark' ? 'dark bg-neutral-950' : 'bg-neutral-50'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r p-6 flex flex-col fixed h-full transition-colors ${
        settings?.theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className={`font-bold text-lg transition-colors ${
            settings?.theme === 'dark' ? 'text-white' : 'text-neutral-900'
          }`}>shurjoPay v2</span>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'dashboard' 
                ? (settings?.theme === 'dark' ? 'bg-blue-900/30 text-blue-400 shadow-sm' : 'bg-blue-50 text-blue-600 shadow-sm') 
                : (settings?.theme === 'dark' ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900')
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'payments' 
                ? (settings?.theme === 'dark' ? 'bg-blue-900/30 text-blue-400 shadow-sm' : 'bg-blue-50 text-blue-600 shadow-sm') 
                : (settings?.theme === 'dark' ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900')
            }`}
          >
            <Wallet className="w-4 h-4" />
            Payments
          </button>
          <button 
            onClick={() => setActiveTab('gmail')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'gmail' 
                ? (settings?.theme === 'dark' ? 'bg-blue-900/30 text-blue-400 shadow-sm' : 'bg-blue-50 text-blue-600 shadow-sm') 
                : (settings?.theme === 'dark' ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900')
            }`}
          >
            <Mail className="w-4 h-4" />
            Gmail
          </button>
        </nav>

        <div className={`pt-6 border-t transition-colors ${
          settings?.theme === 'dark' ? 'border-neutral-800' : 'border-neutral-100'
        }`}>
          <div className="px-2 mb-6">
            <PWAInstallButton />
          </div>
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full bg-neutral-200" />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate transition-colors ${
                settings?.theme === 'dark' ? 'text-white' : 'text-neutral-900'
              }`}>{user.displayName}</p>
              <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              settings?.theme === 'dark' ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 max-w-6xl">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-8">
                {(!settings || settings.visibleCards.payments) && (
                  <ShurjoPay customerName={user.displayName || ''} customerEmail={user.email || ''} />
                )}
                <SettingsPanel />
                {(!settings || settings.visibleCards.history) && (
                  <PaymentHistory />
                )}
              </div>
              <div className="h-[calc(100vh-8rem)]">
                {(!settings || settings.visibleCards.gmail) && (
                  <GmailIntegrator accessToken={token} />
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ShurjoPay customerName={user.displayName || ''} customerEmail={user.email || ''} />
                <PaymentHistory />
              </div>
            </motion.div>
          )}

          {activeTab === 'gmail' && (
            <motion.div
              key="gmail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-[calc(100vh-8rem)]"
            >
              <GmailIntegrator accessToken={token} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Developer Tooling */}
      <PaymentDebugger />
    </div>
  );
}
