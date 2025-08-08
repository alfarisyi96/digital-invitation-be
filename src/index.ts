import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './utils/logger';
import { testSupabaseConnection } from './utils/supabase';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/error';
import adminRoutes from './routes';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Enhanced origins list for both development and production
        const allowedOrigins = [
          ...config.cors.allowedOrigins,
          // Vercel production URLs
          'https://invitation-landing.vercel.app',
          'https://invitation-user-dashboard.vercel.app', 
          'https://invitation-admin-dashboard.vercel.app',
          // VPS production URLs (replace with your domain)
          'https://your-domain.com',
          // Allow any localhost for development
          /^https?:\/\/localhost:\d+$/
        ];
        
        // Check if origin matches any allowed origin
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') {
            return allowed === origin;
          } else if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return false;
        });
        
        if (isAllowed) {
          return callback(null, true);
        }
        
        const msg = `CORS policy violation: Origin ${origin} is not allowed`;
        return callback(new Error(msg), false);
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      exposedHeaders: ['Set-Cookie']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        data: null,
        error: 'Too many requests from this IP, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // General middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser()); // Add cookie parser middleware
    this.app.use(requestLogger);

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Mount admin routes
    this.app.use('/admin', adminRoutes);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        data: {
          message: 'Invitation Admin Backend API',
          version: '1.0.0',
          documentation: '/admin/health',
          timestamp: new Date().toISOString()
        },
        error: null
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler (must be before error handler)
    this.app.use(notFoundHandler);
    
    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      logger.info('Testing database connection...');
      const isConnected = await testSupabaseConnection();
      
      if (!isConnected) {
        throw new Error('Failed to connect to Supabase');
      }

      // Only start server if not in Vercel environment
      if (process.env.VERCEL !== '1') {
        // Start server
        this.app.listen(config.port, () => {
          logger.info(`🚀 Admin Backend Server started`, {
            port: config.port,
            environment: config.nodeEnv,
            url: `http://localhost:${config.port}`,
            deployment: 'traditional'
          });
          
          logger.info('📋 Available routes:');
          logger.info('  GET  /                    - API info');
          logger.info('  GET  /admin/health        - Health check');
          logger.info('  POST /admin/auth/login    - Admin login');
          logger.info('  GET  /admin/users         - List users');
          logger.info('  GET  /admin/resellers     - List resellers');
          logger.info('  GET  /admin/invites       - List invites');
        });
      } else {
        logger.info('🔶 Vercel environment detected - serverless mode');
      }

    } catch (error) {
      logger.error('Failed to start server:', error);
      if (process.env.VERCEL !== '1') {
        process.exit(1);
      }
    }
  }

  // Export the Express app for Vercel
  public getExpressApp(): express.Application {
    return this.app;
  }
}

// Create and start the application
const app = new App();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  app.start();
}

// Export both the app instance and the Express app for different deployment methods
export default app;
export { app as appInstance };
