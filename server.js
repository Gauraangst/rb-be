import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import productRoutes from './routes/products.js';
import reviewRoutes from './routes/reviews.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import paymentRoutes from './routes/payments.js';
import {
  checkSupabaseConnection,
  isDatabaseReady,
  isSupabaseConfigured,
} from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const getAllowedOrigins = () => {
  const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length) {
    return configuredOrigins;
  }

  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
  ];
};

const startServer = (modeLabel = '') => {
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}${modeLabel}`);
  });

  server.on('error', (error) => {
    console.error('Server startup error:', error.message);
  });
};

// Middleware
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Radhe Boutique API is running',
    database: isDatabaseReady() ? 'connected' : 'fallback-demo-mode'
  });
});

const initializeServer = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase environment variables are missing. Starting in demo fallback mode.');
    startServer(' (without DB)');
    return;
  }

  try {
    const connected = await checkSupabaseConnection();
    if (connected) {
      console.log('✨ Connected to Supabase');
      startServer();
      return;
    }

    console.warn('Supabase connection unavailable. Starting in demo fallback mode.');
    startServer(' (without DB)');
  } catch (error) {
    console.error('Supabase connection error:', error.message);
    startServer(' (without DB)');
  }
};

initializeServer();

export default app;
