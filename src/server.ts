import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db'; // Boots database and logs fallback status
import { authRouter } from './routes/auth';
import { kycRouter } from './routes/kyc';
import { marketplaceRouter } from './routes/marketplace';
import { learningRouter } from './routes/learning';
import { aiRouter } from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with global origin flexibility for development sandbox
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📡 ${req.method} ${req.originalUrl}`);
  next();
});

// Bind core API routers
app.use('/api/auth', authRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/learning', learningRouter);
app.use('/api/advisor', aiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'FARMORA-AGRI-ENGINE-API',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔥 Critical Express Exception:', err);
  res.status(500).json({
    error: 'Critical server error.',
    message: err.message || 'An unexpected exception occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Farmora AgriTech Backend API Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🟢 Health: http://localhost:${PORT}/health`);
  console.log(`======================================================\n`);
});
