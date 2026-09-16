import React, { useState, useEffect } from 'react';
import { Mail, Send, Loader2, User as UserIcon, Plus, Save, Trash2, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { listEmails, sendEmail } from '../lib/gmail';
import { getEmailTemplates, saveEmailTemplate, deleteEmailTemplate } from '../lib/firestore';
import { GmailMessage, EmailTemplate } from '../types';
import { useToast } from './Toast';

interface GmailIntegratorProps {
  accessToken: string;
}

export default function GmailIntegrator({ accessToken }: GmailIntegratorProps) {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmails();
    fetchTemplates();
  }, [accessToken]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await listEmails(accessToken);
      setEmails(data);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) return;

    setSending(true);
    try {
      await sendEmail(accessToken, to, subject, body);
      setTo('');
      setSubject('');
      setBody('');
      setShowCompose(false);
      fetchEmails();
      showToast('Email sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!subject || !body) {
      showToast('Subject and body are required for templates', 'error');
      return;
    }

    const templateName = window.prompt('Enter a name for this template:');
    if (!templateName) return;

    setSavingTemplate(true);
    try {
      await saveEmailTemplate({
        name: templateName,
        subject,
        body
      });
      fetchTemplates();
      showToast('Template saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Failed to save template', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    setShowTemplateMenu(false);
    showToast(`Template "${template.name}" applied`, 'info');
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this template?')) return;

    try {
      await deleteEmailTemplate(id);
      fetchTemplates();
      showToast('Template deleted', 'info');
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Failed to delete template', 'error');
    }
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm h-full flex flex-col transition-colors duration-300 bg-white border-neutral-200`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <Mail className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Gmail Communication</h2>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showCompose 
              ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' 
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}
        >
          {showCompose ? 'Close' : 'Compose'}
        </button>
      </div>

      {showCompose ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">New Message</h3>
            <div className="relative">
              <button
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-neutral-50 text-neutral-600 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Templates
                <ChevronDown className={`w-3 h-3 transition-transform ${showTemplateMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showTemplateMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl z-20 overflow-hidden"
                  >
                    <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {templates.length > 0 ? (
                        templates.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => applyTemplate(t)}
                            className="flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-lg cursor-pointer group transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-sm font-medium text-neutral-900 truncate">{t.name}</p>
                              <p className="text-[10px] text-neutral-500 truncate">{t.subject}</p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteTemplate(e, t.id!)}
                              className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-xs text-center text-neutral-400 italic">No templates saved yet.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4 flex-1 flex flex-col">
            <div className="relative">
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipient email"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm"
                required
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm"
                required
              />
            </div>
            <div className="relative flex-1">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your receipt or message here..."
                className="w-full h-full min-h-[200px] px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm resize-none"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all disabled:opacity-50"
              >
                {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save as Template
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-[2] py-3 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 shadow-md shadow-red-200 transition-all disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send Message
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
          ) : emails.length > 0 ? (
            emails.map((email) => (
              <div 
                key={email.id} 
                className="p-4 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-white hover:border-neutral-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-neutral-900 truncate pr-4 text-sm">
                    {email.subject || '(No Subject)'}
                  </h3>
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                    {email.date ? new Date(email.date).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-3 h-3 text-neutral-400" />
                  <span className="text-xs text-neutral-500 truncate">{email.from}</span>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                  {email.snippet}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center py-10 text-neutral-400">No recent emails found.</p>
          )}
        </div>
      )}
    </div>
  );
}
