import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Save, Info, RotateCcw, Eye } from 'lucide-react';
import { getUserSettings, updateUserSettings } from '../lib/firestore';
import { UserSettings } from '../types';
import { replaceTemplates } from '../lib/template-utils';
import { motion } from 'motion/react';

const DEFAULT_SUBJECT = 'Payment Confirmation - Order #{orderId}';
const DEFAULT_BODY = 'Dear Customer,\n\nWe have successfully received your payment of {amount} {currency} for Order #{orderId}.\n\nThank you for choosing our service.\n\nBest regards,\nYour Support Team';

const MOCK_DATA = {
  orderId: 'SP-1726584000',
  amount: 1500,
  currency: 'BDT',
  customerName: 'John Doe'
};

export default function EmailTemplates() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const previewSubject = useMemo(() => replaceTemplates(subject, MOCK_DATA), [subject]);
  const previewBody = useMemo(() => replaceTemplates(body, MOCK_DATA), [body]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getUserSettings();
        setSettings(data);
        setSubject(data.emailSubjectTemplate || DEFAULT_SUBJECT);
        setBody(data.emailBodyTemplate || DEFAULT_BODY);
      } catch (error) {
        console.error('Error fetching settings for email templates:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateUserSettings({
        emailSubjectTemplate: subject,
        emailBodyTemplate: body
      });
      setMessage({ type: 'success', text: 'Template saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save template.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSubject(DEFAULT_SUBJECT);
    setBody(DEFAULT_BODY);
  };

  if (!settings) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden transition-colors">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest">Email Templates</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wider"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to Default
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            <p className="font-bold mb-1">Available Variables:</p>
            <div className="flex flex-wrap gap-2">
              <code>{'{orderId}'}</code>
              <code>{'{amount}'}</code>
              <code>{'{currency}'}</code>
              <code>{'{customerName}'}</code>
            </div>
            <p className="mt-2 opacity-80">These will be automatically replaced with transaction details when sending the email.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject template..."
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Email Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body template..."
              rows={6}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-mono resize-none"
            />
          </div>

          {/* Real-time Preview Pane */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-3 h-3 text-blue-500" />
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Live Preview</label>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-inner">
              <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50">
                <p className="text-[10px] text-neutral-400 font-medium mb-1">Subject:</p>
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {previewSubject}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-neutral-900 min-h-[100px]">
                <p className="text-[10px] text-neutral-400 font-medium mb-2">Message:</p>
                <div className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {previewBody}
                </div>
              </div>
              <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Preview Mockup</span>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs font-medium text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
          >
            {message.text}
          </motion.p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'SAVING...' : 'SAVE TEMPLATE'}
        </button>
      </div>
    </div>
  );
}
