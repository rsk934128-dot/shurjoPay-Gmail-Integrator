import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// shurjoPay Auth Token Cache
let spToken: string | null = null;
let spTokenExpiry: number = 0;

async function getShurjopayToken() {
  const now = Date.now();
  if (spToken && now < spTokenExpiry) {
    return spToken;
  }

  const response = await fetch(`${process.env.SHURJOPAY_BASE_URL}/api/get_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      username: process.env.SHURJOPAY_USERNAME,
      password: process.env.SHURJOPAY_PASSWORD,
    }),
  });

  const data: any = await response.json();
  if (data.token) {
    spToken = data.token;
    spTokenExpiry = now + (data.expires_in || 900) * 1000 - 60000; // Buffer of 1 min
    return spToken;
  }
  throw new Error('Failed to obtain shurjoPay token');
}

// shurjoPay API Proxies
app.post('/api/shurjopay/initiate', async (req, res) => {
  try {
    const token = await getShurjopayToken();
    const { amount, orderId, customerName, customerAddress, customerPhone, customerCity } = req.body;

    const payload = {
      prefix: process.env.SHURJOPAY_PREFIX,
      token: token,
      return_url: `${process.env.APP_URL}/payment/response`,
      cancel_url: `${process.env.APP_URL}/payment/response`,
      store_id: process.env.SHURJOPAY_STORE_ID,
      amount: amount,
      order_id: orderId,
      currency: 'BDT',
      customer_name: customerName,
      customer_address: customerAddress,
      customer_phone: customerPhone,
      customer_city: customerCity,
      client_ip: process.env.SHURJOPAY_CLIENT_IP,
    };

    const response = await fetch(`${process.env.SHURJOPAY_BASE_URL}/api/secret-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shurjopay/verify', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Payment Verification Started for order_id: ${req.body.order_id}`);
  
  try {
    const token = await getShurjopayToken();
    console.log(`[${requestId}] ShurjoPay Token obtained successfully`);
    
    const { order_id } = req.body;
    const verifyUrl = `${process.env.SHURJOPAY_BASE_URL}/api/verification`;
    
    console.log(`[${requestId}] Sending request to ShurjoPay: POST ${verifyUrl}`);
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id }),
    });

    const status = response.status;
    console.log(`[${requestId}] ShurjoPay Response Status: ${status}`);

    const data: any = await response.json();
    console.log(`[${requestId}] ShurjoPay Response Body:`, JSON.stringify(data, null, 2));

    if (status !== 200) {
      console.error(`[${requestId}] Non-200 response from ShurjoPay API`);
    }

    res.json({
      ...data,
      _debug: {
        requestId,
        timestamp: new Date().toISOString(),
        httpStatus: status,
        rawResponse: data
      }
    });
  } catch (error: any) {
    console.error(`[${requestId}] Verification Error:`, error.message);
    res.status(500).json({ 
      error: error.message,
      _debug: {
        requestId,
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      }
    });
  }
});

// Gmail Proxy (Server-side to handle Gemini/AI if needed, though Workspace skill allows client-side)
// We'll stick to client-side Gmail calls for simplicity unless AI processing is needed.

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
