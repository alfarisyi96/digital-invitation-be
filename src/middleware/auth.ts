import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { errorResponse } from '../utils/helpers';
import { logger } from '../utils/logger';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';

// Extend Express Request type to include admin user and regular user
declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
      user?: User | { id: string; email: string; name: string; };
    }
  }
}

/**
 * Middleware to authenticate admin users via JWT from HTTP-only cookie
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies?.admin_token;
    
    if (!token) {
      res.status(401).json(errorResponse('Authentication required'));
      return;
    }
    
    if (!token) {
      res.status(401).json(errorResponse('JWT token is required'));
      return;
    }
    
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Verify that this is an admin token
    if (decoded.role !== 'admin') {
      res.status(403).json(errorResponse('Admin access required'));
      return;
    }
    
    // Attach admin info to request
    req.admin = decoded;
    next();
    
  } catch (error) {
    logger.error('Admin authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(errorResponse('Invalid JWT token'));
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(errorResponse('JWT token has expired'));
      return;
    }
    
    res.status(500).json(errorResponse('Authentication error'));
  }
}

/**
 * Middleware to authenticate regular users via Supabase JWT token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json(errorResponse('Authentication token required'));
      return;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json(errorResponse('Invalid or expired token'));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('User authentication error:', error);
    res.status(500).json(errorResponse('Authentication error'));
  }
}

/**
 * Optional authentication middleware - continues even if no valid token
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      req.user = user || undefined;
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
}

/**
 * User authentication middleware for HTTP-only cookies (User Dashboard)
 */
export function userAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies?.user_token;
    
    if (!token) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Authentication required' }
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
    
  } catch (error) {
    logger.error('User authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Invalid authentication token' }
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Authentication token has expired' }
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      data: null,
      error: { message: 'Authentication error' }
    });
  }
}
