import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/index';

// Initialize the app
let expressApp: any = null;

async function getApp() {
  if (!expressApp) {
    // Initialize database connection and get the Express app
    await app.start();
    expressApp = app.getExpressApp();
  }
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    
    // Convert VercelRequest to Express-compatible request
    return app(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.toString() : 'Something went wrong'
    });
  }
}
