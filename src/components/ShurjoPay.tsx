import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { savePayment, updatePaymentStatus } from '../lib/firestore';
import { useToast } from './Toast';
import { formatCurrency } from '../lib/formatters';

interface ShurjoPayProps {
  customerName: string;
  customerEmail: string;
}

export default function ShurjoPay({ customerName, customerEmail }: ShurjoPayProps) {
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderId = `order_${Date.now()}`;
      
      // 1. Save pending payment to Firestore
      const paymentRecord = await savePayment({
        orderId,
        amount: Number(amount),
        currency: 'BDT',
        status: 'pending',
        customerName,
        customerEmail,
      });

      // 2. Initiate shurjoPay through server proxy
      const response = await fetch('/api/shurjopay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          orderId,
          customerName,
          customerAddress: 'Dhaka, Bangladesh',
          customerPhone: '01700000000',
          customerCity: 'Dhaka',
        }),
      });

      const data = await response.json();

      if (data.checkout_url) {
        showToast('Payment session initialized. Redirecting to shurjoPay...', 'success');
        
        // Update with shurjoPay order ID
        if (paymentRecord.id) {
          await updatePaymentStatus(paymentRecord.id, data.sp_order_id, 'pending');
        }

        // Open in new tab or redirect
        window.open(data.checkout_url, '_blank');
      } else {
        throw new Error('Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showToast('Payment initiation failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900">shurjoPay Gateway</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Amount (BDT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Enter amount"
          />
          {amount && !isNaN(Number(amount)) && (
            <p className="mt-2 text-xs font-bold text-blue-600 animate-in fade-in slide-in-from-top-1">
              Confirming: {formatCurrency(Number(amount))}
            </p>
          )}
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !amount}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Initializing...
            </>
          ) : (
            <>Pay Now with shurjoPay</>
          )}
        </button>
      </div>
    </div>
  );
}
