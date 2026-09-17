import React from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Wallet, 
  ArrowRight, 
  Zap, 
  BarChart3, 
  Lock, 
  CheckCircle2,
  Globe,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-neutral-900 tracking-tight">shurjoPay v2</span>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-full hover:bg-neutral-800 transition-all hover:scale-105 active:scale-95"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Zap className="w-3 h-3 fill-current" />
            Next Generation Payment Dashboard
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-7xl font-black text-neutral-900 mb-8 tracking-tighter leading-[1.1]"
          >
            Simplify your <span className="text-blue-600">Payments</span> & <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Communications</span>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The ultimate bridge between shurjoPay v2 and Gmail. 
            Track transactions, verify status, and automate email receipts in one unified workspace.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 group"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-5 bg-white text-neutral-600 font-bold rounded-2xl border border-neutral-200 hover:bg-neutral-50 transition-all flex items-center justify-center gap-3"
            >
              View Documentation
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">Everything you need to scale</h2>
            <p className="text-neutral-500">Powerful tools designed for developers and business owners.</p>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={item} className="p-8 bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all group">
              <div className="p-4 bg-blue-50 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Unified Checkout</h3>
              <p className="text-neutral-500 leading-relaxed">Seamless shurjoPay v2 integration for high-conversion payments across all Bangladeshi gateways.</p>
            </motion.div>

            <motion.div variants={item} className="p-8 bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all group">
              <div className="p-4 bg-indigo-50 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Smart Notifications</h3>
              <p className="text-neutral-500 leading-relaxed">Automate professional payment receipts directly from your Gmail account using custom templates.</p>
            </motion.div>

            <motion.div variants={item} className="p-8 bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all group">
              <div className="p-4 bg-purple-50 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Analytics Dashboard</h3>
              <p className="text-neutral-500 leading-relaxed">Real-time visualization of your transaction volume, success rates, and customer trends.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-8 tracking-tight">Security at the core of <span className="text-blue-600">every</span> transaction.</h2>
              <div className="space-y-6">
                {[
                  { title: "Bank-Grade Encryption", desc: "Your payment data is protected by industry-standard protocols.", icon: Lock },
                  { title: "Firebase Authentication", desc: "Secure Google-powered login ensures only you access your data.", icon: ShieldCheck },
                  { title: "PWA Support", desc: "Install on any device for a native, lightning-fast experience.", icon: Smartphone },
                  { title: "Real-time Verification", desc: "Instant IPN and verification to prevent fraudulent orders.", icon: CheckCircle2 }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="p-2 bg-neutral-50 rounded-lg h-fit mt-1">
                      <item.icon className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900">{item.title}</h4>
                      <p className="text-sm text-neutral-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-2xl opacity-10 animate-pulse"></div>
              <div className="relative bg-neutral-900 rounded-3xl p-10 border border-neutral-800 shadow-2xl">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="text-blue-400"># Initializing shurjoPay engine...</div>
                  <div className="text-neutral-400">Connecting to secure gateway... [OK]</div>
                  <div className="text-neutral-400">Authenticating Gmail API... [OK]</div>
                  <div className="text-green-400">Ready to process transactions.</div>
                  <div className="mt-8 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
                    <div className="flex justify-between mb-2">
                      <span className="text-neutral-500">Status</span>
                      <span className="text-green-400 font-bold">SUCCESS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Order ID</span>
                      <span className="text-neutral-300">SP-1726584000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-neutral-100 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 grayscale opacity-50">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold text-neutral-900">shurjoPay v2</span>
          </div>
          <div className="text-sm text-neutral-400">
            © 2026 shurjoPay Workspace. All rights reserved. Built for Bangladesh.
          </div>
          <div className="flex gap-6 text-sm font-bold text-neutral-400">
            <a href="#" className="hover:text-neutral-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
