import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import adminRoutes from './routes';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();

  // Trust proxy for Vercel deployment
  app.set('trust proxy', 1);

  // CORS configuration for both development and production
  const corsOptions = {
    origin: [
      // Development URLs
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      // Production URLs (Vercel)
      'https://invitation-landing.vercel.app',
      'https://invitation-user-dashboard.vercel.app',
      'https://invitation-admin-dashboard.vercel.app',
      // VPS production URLs (replace with your domain)
      'https://your-domain.com',
      // Allow any localhost for development
      /^http:\/\/localhost:\d+$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
  };

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allow for development
    crossOriginEmbedderPolicy: false
  }));

  // CORS
  app.use(cors(corsOptions));

  // Handle preflight requests
  app.options('*', cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/admin', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Admin routes
  app.use('/admin', adminRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      message: 'Route not found',
      path: req.originalUrl 
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
}

// Environment detection helpers
export const isVercel = process.env.VERCEL === '1';
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

// Logging for debugging
logger.info(`App initialized for ${isVercel ? 'Vercel' : 'Traditional'} deployment`, {
  environment: process.env.NODE_ENV,
  isVercel,
  isProduction
});
