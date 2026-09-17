import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2, ShieldCheck, AlertCircle, Clock, Search, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  method: string;
  endpoint: string;
  payload?: any;
  status?: number;
  duration?: number;
}

export default function PaymentDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = (id: string, content: any) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  useEffect(() => {
    // Intercept fetch calls to capture payment status requests
    let isSubscribed = true;
    const originalFetch = window.fetch;
    
    const interceptedFetch = async (...args: any[]) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : (args[0] as Request).url;
      
      if (url.includes('/api/shurjopay/verify') || url.includes('/api/payment-status')) {
        const startTime = Date.now();
        const requestId = Math.random().toString(36).substring(7);
        let requestBody = null;

        try {
          if (args[1]?.body) {
            requestBody = JSON.parse(args[1].body as string);
          }
        } catch (e) {
          requestBody = args[1]?.body;
        }

        if (isSubscribed) {
          const requestLog: LogEntry = {
            id: `${requestId}-req`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'request',
            method: args[1]?.method || 'GET',
            endpoint: url,
            payload: requestBody
          };
          setLogs(prev => [requestLog, ...prev].slice(0, 50));
        }

        try {
          const response = await originalFetch(...(args as [any]));
          const clone = response.clone();
          const duration = Date.now() - startTime;
          let responseData;
          
          try {
            responseData = await clone.json();
          } catch (e) {
            responseData = await clone.text();
          }

          if (isSubscribed) {
            const responseLog: LogEntry = {
              id: `${requestId}-res`,
              timestamp: new Date().toLocaleTimeString(),
              type: response.ok ? 'response' : 'error',
              method: args[1]?.method || 'GET',
              endpoint: url,
              payload: responseData,
              status: response.status,
              duration
            };
            setLogs(prev => [responseLog, ...prev].slice(0, 50));
          }
          return response;
        } catch (error: any) {
          const duration = Date.now() - startTime;
          if (isSubscribed) {
            const errorLog: LogEntry = {
              id: `${requestId}-err`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'error',
              method: args[1]?.method || 'GET',
              endpoint: url,
              payload: { message: error.message, stack: error.stack },
              duration
            };
            setLogs(prev => [errorLog, ...prev].slice(0, 50));
          }
          throw error;
        }
      }
      return originalFetch(...(args as [any]));
    };

    try {
      // Some environments protect window.fetch. If it fails, we just don't intercept.
      Object.defineProperty(window, 'fetch', {
        value: interceptedFetch,
        configurable: true,
        writable: true
      });
    } catch (e) {
      console.warn('PaymentDebugger: Could not intercept fetch. Logging might be limited.', e);
      // Fallback for some browsers
      try {
        window.fetch = interceptedFetch;
      } catch (err) {
        console.error('PaymentDebugger: Fatal error intercepting fetch.', err);
      }
    }

    return () => {
      isSubscribed = false;
      try {
        window.fetch = originalFetch;
      } catch (e) {
        // Ignore errors during cleanup
      }
    };
  }, []);

  const filteredLogs = logs.filter(log => 
    log.endpoint.toLowerCase().includes(filter.toLowerCase()) ||
    JSON.stringify(log.payload).toLowerCase().includes(filter.toLowerCase())
  );

  const handleManualTest = async () => {
    try {
      await fetch('/api/shurjopay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: `TEST-${Math.random().toString(36).substring(7).toUpperCase()}`,
          is_manual_test: true
        }),
      });
    } catch (err) {
      console.error('Manual test failed:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md sm:max-w-lg">
      <div className={`bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'h-[500px]' : 'h-12'}`}>
        {/* Header */}
        <div 
          className="h-12 px-4 flex items-center justify-between cursor-pointer hover:bg-neutral-800/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Terminal className={`w-4 h-4 ${logs.some(l => l.type === 'error') ? 'text-red-400' : 'text-green-400'}`} />
              {logs.length > 0 && !isOpen && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-xs font-bold text-neutral-200 uppercase tracking-widest">Payment Debugger</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.5 bg-neutral-800 text-[9px] font-bold text-neutral-400 rounded">
                {logs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setLogs([]); }}
              className="p-1.5 hover:bg-neutral-700 rounded-lg text-neutral-500 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {isOpen ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronUp className="w-4 h-4 text-neutral-500" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[452px]">
          {/* Search Bar & Actions */}
          <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-950/50 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input 
                type="text"
                placeholder="Filter logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={handleManualTest}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              MANUAL TEST
            </button>
          </div>

          {/* Logs List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2 font-mono scrollbar-thin scrollbar-thumb-neutral-800">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2 opacity-50">
                <Clock className="w-8 h-8 stroke-1" />
                <p className="text-[10px] uppercase tracking-widest">Waiting for payment requests...</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className={`p-3 rounded-xl border ${
                  log.type === 'request' ? 'bg-neutral-900/50 border-neutral-800' :
                  log.type === 'response' ? 'bg-green-500/5 border-green-500/20' :
                  'bg-red-500/5 border-red-500/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        log.type === 'request' ? 'bg-neutral-800 text-neutral-400' :
                        log.type === 'response' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-[10px] text-neutral-500">{log.timestamp}</span>
                    </div>
                    {log.duration && (
                      <span className="text-[10px] text-neutral-600">{log.duration}ms</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-neutral-300">{log.method}</span>
                    <span className="text-[10px] text-neutral-400 truncate flex-1">{log.endpoint.replace(window.location.origin, '')}</span>
                    {log.status && (
                      <span className={`text-[10px] font-bold ${log.status >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                        {log.status}
                      </span>
                    )}
                  </div>

                  {log.payload && (
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(log.id, log.payload)}
                        className="absolute right-2 top-2 p-1.5 bg-neutral-800/80 hover:bg-neutral-700 rounded-md text-neutral-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-neutral-700/50"
                        title="Copy to clipboard"
                      >
                        {copiedId === log.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <pre className="text-[10px] bg-neutral-950 p-2 rounded-lg border border-neutral-800 overflow-x-auto text-neutral-400 max-h-32">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-tighter">API Live</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-tighter">Proxy Mode</span>
              </div>
            </div>
            <p className="text-[9px] text-neutral-600 font-mono italic">v2.1.0-debug</p>
          </div>
        </div>
      </div>
    </div>
  );
}
