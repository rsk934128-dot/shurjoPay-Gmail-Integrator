import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, DollarSign, CheckCircle2 } from 'lucide-react';
import { getUserPayments } from '../lib/firestore';
import { Payment } from '../types';
import { formatCurrency } from '../lib/formatters';
import { motion } from 'motion/react';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

export default function PaymentVisualization() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await getUserPayments();
        setPayments(data);
      } catch (error) {
        console.error('Error fetching payments for visualization:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const stats = useMemo(() => {
    const totalTransactions = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'success');
    const totalVolume = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
    const successRate = totalTransactions > 0 ? (successfulPayments.length / totalTransactions) * 100 : 0;

    return {
      totalTransactions,
      totalVolume,
      successRate: successRate.toFixed(1)
    };
  }, [payments]);

  const dailyVolumes = useMemo(() => {
    const groups: Record<string, number> = {};
    const sortedPayments = [...payments].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
      return dateA.getTime() - dateB.getTime();
    });

    sortedPayments.forEach(p => {
      if (p.status !== 'success') return;
      const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      groups[dateStr] = (groups[dateStr] || 0) + p.amount;
    });

    return Object.entries(groups).map(([date, volume]) => ({
      date,
      volume
    }));
  }, [payments]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    payments.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));
  }, [payments]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 flex items-center justify-center min-h-[300px]">
        <Activity className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Volume</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{formatCurrency(stats.totalVolume)}</p>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Success Rate</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats.successRate}%</p>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Transactions</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats.totalTransactions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Volume Line Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest">Daily Payment Volume</h3>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyVolumes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333333" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#737373' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#737373' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: '#171717',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    fontSize: '12px',
                    color: '#fff'
                  }} 
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest">Status Dist.</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: '#171717',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', color: '#737373' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
