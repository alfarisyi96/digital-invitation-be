import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  
  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Logging Configuration
  logging: {
    logtailToken: process.env.LOGTAIL_TOKEN,
  },
  
  // Validation
  validate() {
    const required = [
      'JWT_SECRET',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // if not development, ensure HTTPS URL
    if (this.nodeEnv !== 'development' && !this.supabase.url.startsWith('https://')) {
      throw new Error('SUPABASE_URL must be a valid HTTPS URL in production');
    }
    
    if (this.jwt.secret.length < 32 && this.nodeEnv === 'production') {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
  }
};

// Validate configuration on import
config.validate();
