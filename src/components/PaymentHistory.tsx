import React, { useState, useEffect, useMemo } from 'react';
import { History, Clock, CheckCircle2, XCircle, AlertCircle, BarChart3, ShieldCheck, Terminal, X, RefreshCw, Download } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { getUserPayments, updatePaymentStatus, getUserSettings } from '../lib/firestore';
import { Payment, UserSettings } from '../types';
import { formatCurrency } from '../lib/formatters';
import { fetchWithRetry } from '../lib/api-utils';
import { sendEmail } from '../lib/gmail';
import { replaceTemplates } from '../lib/template-utils';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentHistoryProps {
  accessToken?: string;
}

export default function PaymentHistory({ accessToken }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      const data = await getUserPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (payment: Payment) => {
    if (!payment.spOrderId) return;
    setVerifyingId(payment.id!);
    
    try {
      const response = await fetchWithRetry('/api/shurjopay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: payment.spOrderId }),
      });

      const data = await response.json();
      setDiagnosticInfo({
        orderId: payment.orderId,
        spOrderId: payment.spOrderId,
        ...data
      });

      // If success, update Firestore
      if (data[0]?.bank_status === 'Success') {
        await updatePaymentStatus(payment.id!, payment.spOrderId, 'success');
        
        // Auto-send Gmail notification if enabled
        try {
          const settings = await getUserSettings();
          if (settings.emailNotificationsEnabled && accessToken) {
            const templateData = {
              orderId: payment.orderId,
              amount: payment.amount,
              currency: payment.currency,
              customerName: payment.customerName
            };
            
            const subject = replaceTemplates(settings.emailSubjectTemplate || 'Payment Confirmation - Order #{orderId}', templateData);
            const body = replaceTemplates(settings.emailBodyTemplate || 'Dear Customer,\n\nWe have successfully received your payment of {amount} {currency} for Order #{orderId}.\n\nThank you for choosing shurjoPay v2.\n\nBest regards,\nYour Support Team', templateData);
            
            await sendEmail(accessToken, payment.customerEmail, subject, body);
            console.log('Confirmation email sent manually via Gmail');
          }
        } catch (emailErr) {
          console.error('Failed to auto-send email during manual verification:', emailErr);
        }

        fetchPayments();
      }
    } catch (error: any) {
      setDiagnosticInfo({
        error: error.message,
        orderId: payment.orderId,
        spOrderId: payment.spOrderId
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const chartData = useMemo(() => {
    if (!payments.length) return [];
    
    // Group payments by date and sum amounts
    const groups: Record<string, number> = {};
    
    // Sort payments by date ascending for the chart
    const sortedPayments = [...payments].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
      return dateA.getTime() - dateB.getTime();
    });

    sortedPayments.forEach(p => {
      if (p.status !== 'success' && p.status !== 'pending') return;
      const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      groups[dateStr] = (groups[dateStr] || 0) + p.amount;
    });

    return Object.entries(groups).map(([date, amount]) => ({
      date,
      amount
    }));
  }, [payments]);

  const exportToCSV = () => {
    if (!payments.length) return;

    const headers = ['Date', 'Order ID', 'Amount', 'Currency', 'Customer', 'Status', 'SP Order ID'];
    const rows = payments.map(p => {
      const date = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString() : new Date().toLocaleString();
      return [
        `"${date}"`,
        `"${p.orderId}"`,
        p.amount,
        `"${p.currency}"`,
        `"${p.customerName}"`,
        `"${p.status.toUpperCase()}"`,
        `"${p.spOrderId || ''}"`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-neutral-400" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusClass = (status: Payment['status']) => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled': return 'bg-neutral-50 text-neutral-700 border-neutral-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <History className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Transaction History</h2>
        </div>
        
        {payments.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl transition-all border border-neutral-200 dark:border-neutral-700 active:scale-95"
          >
            <Download className="w-4 h-4" />
            EXPORT CSV
          </button>
        )}
      </div>

      {!loading && chartData.length > 0 && (
        <div className="h-48 w-full mb-8 bg-neutral-50 rounded-xl p-4 border border-neutral-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Volume Trend (BDT)</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                dy={10}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }} 
                formatter={(value: number) => [formatCurrency(value), 'Volume']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
          </div>
        ) : payments.length > 0 ? (
          payments.map((payment) => (
            <div 
              key={payment.id} 
              className="p-4 rounded-xl border border-neutral-100 bg-neutral-50 flex items-center justify-between hover:bg-white hover:border-neutral-200 transition-all group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                  <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${getStatusClass(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    {payment.status.toUpperCase()}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400">
                  ID: {payment.orderId}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {payment.createdAt?.toDate ? payment.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className="text-[10px] font-medium text-neutral-600 block">
                  {payment.customerName}
                </span>
                {payment.status === 'pending' && payment.spOrderId && (
                  <button
                    onClick={() => handleVerify(payment)}
                    disabled={verifyingId === payment.id}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {verifyingId === payment.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3 h-3" />
                    )}
                    VERIFY
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-neutral-400 text-sm">No transactions yet.</p>
        )}
      </div>

      <AnimatePresence>
        {diagnosticInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-bold text-neutral-200">Verification Diagnostic Console</h3>
                </div>
                <button 
                  onClick={() => setDiagnosticInfo(null)}
                  className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-4">
                <div className="space-y-2">
                  <p className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Request Context</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-neutral-800/50 p-2 rounded-lg border border-neutral-700/50">
                      <p className="text-neutral-500 mb-1">Local Order ID</p>
                      <p className="text-neutral-200">{diagnosticInfo.orderId}</p>
                    </div>
                    <div className="bg-neutral-800/50 p-2 rounded-lg border border-neutral-700/50">
                      <p className="text-neutral-500 mb-1">SP Order ID</p>
                      <p className="text-neutral-200">{diagnosticInfo.spOrderId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Server Debug Trace</p>
                  <pre className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-green-400 overflow-x-auto">
                    {JSON.stringify(diagnosticInfo._debug || { status: 'Pending Verification...' }, null, 2)}
                  </pre>
                </div>

                <div className="space-y-2">
                  <p className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Gateway Payload</p>
                  <pre className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-blue-400 overflow-x-auto">
                    {JSON.stringify(diagnosticInfo[0] || diagnosticInfo, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
                <button 
                  onClick={() => setDiagnosticInfo(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
                >
                  DISMISS
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  PRINT LOG
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
